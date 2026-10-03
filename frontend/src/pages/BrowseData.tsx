import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Edit2, Plus, Trash2, Image as ImageIcon, Download, ChevronDown } from 'lucide-react';
import { Toast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

export default function BrowseData() {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  
  // Table schema & data
  const [columns, setColumns] = useState<any[]>([]);
  const [primaryKey, setPrimaryKey] = useState<any>(null);
  const [foreignKeys, setForeignKeys] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 50;

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [originalPkValues, setOriginalPkValues] = useState<any>({});
  
  // FK Data
  const [fkOptions, setFkOptions] = useState<Record<string, any[]>>({});

  // Image Modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Toast & Confirm
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const showAlert = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    fetch('http://localhost:8080/api/schema/tables')
      .then(res => res.json())
      .then(data => {
        setTables(data);
        if (data.length > 0) setSelectedTable(data[0].tableName);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedTable) return;
    
    const fetchTableInfo = async () => {
      try {
        setLoading(true);
        const [colsRes, pkRes, fkRes] = await Promise.all([
          fetch(`http://localhost:8080/api/schema/tables/${selectedTable}/columns`),
          fetch(`http://localhost:8080/api/schema/tables/${selectedTable}/primary-key`),
          fetch(`http://localhost:8080/api/schema/tables/${selectedTable}/foreign-keys`),
        ]);
        
        const cols = await colsRes.json();
        setColumns(cols);
        
        const pkText = await pkRes.text();
        setPrimaryKey(pkText ? JSON.parse(pkText) : null);
        
        const fks = await fkRes.json();
        setForeignKeys(fks);

        // Fetch FK options
        const options: Record<string, any[]> = {};
        for (const fk of fks) {
          const res = await fetch(`http://localhost:8080/api/data/${fk.referencedTable}?page=0&size=100`);
          if (res.ok) {
            const fData = await res.json();
            options[fk.column] = fData.content;
          }
        }
        setFkOptions(options);

        setPage(0);
        fetchData(0);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTableInfo();
  }, [selectedTable]);

  const fetchData = async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8080/api/data/${selectedTable}?page=${pageNum}&size=${size}`);
      const d = await res.json();
      setData(d.content);
      setTotalPages(d.totalPages);
      setTotalElements(d.totalElements);
      setPage(pageNum);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const openAddModal = async () => {
    setFormData({});
    setIsEditing(false);
    setShowModal(true);

    try {
      if (selectedTable) {
        const res = await fetch(`http://localhost:8080/api/data/${selectedTable}/next-id`);
        if (res.ok) {
          const data = await res.json();
          if (data.nextId > 0 && primaryKey && primaryKey.columns && primaryKey.columns.length === 1) {
            setFormData((prev: any) => ({ ...prev, [primaryKey.columns[0]]: data.nextId }));
          }
        }
      }
    } catch (e) {}
  };

  const openEditModal = (row: any) => {
    setFormData({ ...row });
    
    const pkVals: any = {};
    if (primaryKey) {
      primaryKey.columns.forEach((c: string) => {
        pkVals[c] = row[c];
      });
    }
    setOriginalPkValues(pkVals);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (row: any) => {
    if (!primaryKey) return;
    setConfirmDialog({
      message: 'Are you sure you want to delete this row?',
      onConfirm: async () => {
        const pkVals: any = {};
        primaryKey.columns.forEach((c: string) => {
          pkVals[c] = row[c];
        });

        try {
          const res = await fetch(`http://localhost:8080/api/data/${selectedTable}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pkVals)
          });
          if (!res.ok) throw new Error((await res.json()).error);
          fetchData(page);
        } catch (err: any) {
          showAlert(err.message);
        }
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (isEditing) {
        res = await fetch(`http://localhost:8080/api/data/${selectedTable}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pkValues: originalPkValues,
            updateData: formData
          })
        });
      } else {
        res = await fetch(`http://localhost:8080/api/data/${selectedTable}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      if (!res.ok) throw new Error((await res.json()).error);
      setShowModal(false);
      fetchData(page);
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const handleImageDoubleClick = async (colName: string, row: any) => {
    if (!primaryKey) return;
    
    const pkVals: any = {};
    primaryKey.columns.forEach((c: string) => {
      pkVals[c] = row[c];
    });

    try {
      const res = await fetch(`http://localhost:8080/api/data/${selectedTable}/image/${colName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkVals)
      });
      if (!res.ok) throw new Error('Failed to load image');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      setShowImageModal(true);
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const exportData = async (format: 'csv' | 'xlsx' | 'json') => {
    setShowExportMenu(false);
    if (!selectedTable) return;
    try {
      const res = await fetch('http://localhost:8080/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TABLE', source: selectedTable, format })
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      showAlert('Export failed');
    }
  };

  if (loading && tables.length === 0) return <div className="page-container p-8">Loading...</div>;

  return (
    <div className="page-container relative" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header mb-6">
        <div className="page-title-section">
          <div>
            <h1>Browse Data</h1>
            <p className="page-subtitle">View and manage table records</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <select 
            value={selectedTable} 
            onChange={(e) => setSelectedTable(e.target.value)}
            style={{ width: '200px', padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', outline: 'none' }}
          >
            {tables.map(t => <option key={t.tableName} value={t.tableName}>{t.tableName}</option>)}
          </select>
          <div className="flex gap-2 items-center" style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-secondary flex items-center gap-2"
              style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white', cursor: 'pointer' }}
            >
              <Download size={16} /> Export <ChevronDown size={14} />
            </button>
            
            {showExportMenu && (
              <div style={{ position: 'absolute', top: '100%', right: '100px', marginTop: '4px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)', zIndex: 50, minWidth: '120px' }}>
                <div onClick={() => exportData('csv')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} className="hover:bg-[#2a2a2a]">Export CSV</div>
                <div onClick={() => exportData('xlsx')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} className="hover:bg-[#2a2a2a]">Export XLSX</div>
                <div onClick={() => exportData('json')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} className="hover:bg-[#2a2a2a]">Export JSON</div>
              </div>
            )}

            <button className="btn-primary" onClick={openAddModal}>
              <Plus size={18} /> Add Row
            </button>
          </div>
        </div>
      </div>

      {!primaryKey && selectedTable && (
        <div className="mb-4 p-3 text-sm" style={{ backgroundColor: 'rgba(127,29,29,0.2)', border: '1px solid #7f1d1d', color: '#f87171', borderRadius: '0.5rem' }}>
          Warning: This table has no primary key. Editing and deleting individual rows is disabled.
        </div>
      )}

      {error && <div className="mb-4 text-red-400">{error}</div>}

      <div className="card flex-col" style={{ flex: 1, minHeight: 0 }}>
        <div className="table-responsive" style={{ flex: 1 }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(c => (
                  <th key={c.name}>
                    {c.name} {primaryKey?.columns?.includes(c.name) && <span style={{ color: '#eab308', marginLeft: '0.25rem' }}>🔑</span>}
                  </th>
                ))}
                <th className="text-right px-6" style={{ position: 'sticky', right: 0, backgroundColor: '#121212' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-secondary" style={{ textAlign: 'center', padding: '2rem 0' }}>
                    No rows found in this table.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map(c => (
                      <td 
                        key={c.name}
                        onDoubleClick={() => {
                          if (c.type.toLowerCase() === 'bytea' && row[c.name]) {
                            handleImageDoubleClick(c.name, row);
                          }
                        }}
                        style={{ cursor: c.type.toLowerCase() === 'bytea' && row[c.name] ? 'pointer' : 'default' }}
                      >
                        {c.type.toLowerCase() === 'bytea' && row[c.name] ? (
                          <div className="flex items-center gap-2" style={{ color: '#eab308' }}>
                            <ImageIcon size={14} /> [IMAGE]
                          </div>
                        ) : (
                          <span style={{ display: 'inline-block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[c.name]?.toString()}</span>
                        )}
                      </td>
                    ))}
                    <td className="actions-cell" style={{ position: 'sticky', right: 0, backgroundColor: '#121212' }}>
                      <div className="actions">
                        <Edit2 
                          size={16} 
                          className="action-icon"
                          style={{ opacity: !primaryKey ? 0.5 : 1, cursor: !primaryKey ? 'not-allowed' : 'pointer' }}
                          onClick={() => primaryKey && openEditModal(row)} 
                        />
                        <Trash2 
                          size={16} 
                          className="action-icon danger" 
                          style={{ opacity: !primaryKey ? 0.5 : 1, cursor: !primaryKey ? 'not-allowed' : 'pointer' }}
                          onClick={() => primaryKey && handleDelete(row)} 
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-color)', backgroundColor: '#121212' }}>
          <div className="text-secondary text-sm">
            Total Rows: {totalElements}
          </div>
          <div className="flex gap-2">
            <button 
              style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '0.25rem', color: 'white', display: 'flex', alignItems: 'center', opacity: page === 0 ? 0.5 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
              disabled={page === 0}
              onClick={() => fetchData(page - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ padding: '0.25rem 0.75rem', color: 'white' }}>Page {page + 1} of {Math.max(1, totalPages)}</span>
            <button 
              style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '0.25rem', color: 'white', display: 'flex', alignItems: 'center', opacity: page >= totalPages - 1 ? 0.5 : 1, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
              disabled={page >= totalPages - 1}
              onClick={() => fetchData(page + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Row Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <form className="card p-6 flex flex-col" style={{ width: '500px', maxHeight: '90vh' }} onSubmit={handleSave}>
            <h2 className="text-xl mb-6 text-white">{isEditing ? 'Edit Row' : 'Add Row'}</h2>
            
            <div className="flex flex-col gap-4" style={{ overflowY: 'auto', paddingRight: '0.5rem', flex: 1 }}>
              {columns.map(c => {
                const fk = foreignKeys.find(f => f.column === c.name);
                const isBytea = c.type.toLowerCase() === 'bytea';
                const isPk = primaryKey?.columns?.includes(c.name);
                const isAutoGenerated = !!c.defaultValue || (isPk && (c.type.toLowerCase().includes('int') || c.type.toLowerCase().includes('numeric')));
                const showAsterisk = c.nullable === 'NO' && !isAutoGenerated;

                return (
                  <div key={c.name}>
                    <label className="text-secondary text-sm mb-1" style={{ display: 'block' }}>
                      {c.name} {isPk && '🔑'} {showAsterisk && '*'}
                    </label>
                    
                    {fk ? (
                      <select 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', outline: 'none' }}
                        value={formData[c.name] || ''}
                        onChange={e => setFormData({...formData, [c.name]: e.target.value})}
                        required={c.nullable === 'NO'}
                      >
                        <option value="">Select {fk.referencedTable}...</option>
                        {fkOptions[c.name]?.map(opt => (
                          <option key={opt[fk.referencedColumn]} value={opt[fk.referencedColumn]}>
                            {opt[fk.referencedColumn]}
                          </option>
                        ))}
                      </select>
                    ) : isBytea ? (
                      <div className="flex items-center gap-4">
                        <label style={{ cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', display: 'inline-block' }}>
                          <input 
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  setFormData({...formData, [c.name]: evt.target?.result});
                                };
                                reader.readAsDataURL(file);
                              } else {
                                const newData = {...formData};
                                delete newData[c.name];
                                setFormData(newData);
                              }
                            }}
                          />
                          {formData[c.name] && formData[c.name] !== '[BYTEA]' ? 'Change File' : 'Choose File'}
                        </label>
                        {formData[c.name] && (
                          <span className="text-sm text-secondary truncate max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
                            {formData[c.name] === '[BYTEA]' ? 'Existing Image' : 'Image Selected'}
                          </span>
                        )}
                      </div>
                    ) : c.type === 'BOOLEAN' ? (
                      <input 
                        type="checkbox"
                        checked={!!formData[c.name]}
                        onChange={e => setFormData({...formData, [c.name]: e.target.checked})}
                      />
                    ) : (
                      <input 
                        type={c.type.toUpperCase().includes('INT') || c.type.toUpperCase().includes('NUMERIC') ? 'number' : 'text'}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', outline: 'none', opacity: ((isEditing && primaryKey?.columns?.includes(c.name)) || (!isEditing && isAutoGenerated)) ? 0.5 : 1 }}
                        value={formData[c.name] ?? ''}
                        disabled={(isEditing && primaryKey?.columns?.includes(c.name)) || (!isEditing && isAutoGenerated)}
                        onChange={e => {
                          let val: any = e.target.value;
                          const tUpper = c.type.toUpperCase();
                          if (val === '') {
                            val = null;
                          } else if (tUpper.includes('INT') || tUpper.includes('NUMERIC')) {
                            val = Number(val);
                          }
                          
                          if (val === null && !isEditing && c.defaultValue) {
                            const newData = {...formData};
                            delete newData[c.name];
                            setFormData(newData);
                          } else {
                            setFormData({...formData, [c.name]: val});
                          }
                        }}
                        required={showAsterisk}
                        placeholder={isAutoGenerated ? 'Auto-generated' : ''}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 mt-6" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" className="btn-primary" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && imageUrl && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowImageModal(false)}
        >
          <div style={{ position: 'relative', padding: '0.5rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.5rem', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img src={imageUrl} alt="Database content" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} />
            <button 
              style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.5rem 1rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', outline: 'none', backdropFilter: 'blur(4px)' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)'}
              onClick={() => setShowImageModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <ConfirmModal 
        isOpen={!!confirmDialog} 
        message={confirmDialog?.message || ''} 
        onConfirm={() => confirmDialog?.onConfirm()} 
        onCancel={() => setConfirmDialog(null)} 
      />
    </div>
  );
}
