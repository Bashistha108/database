import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Edit } from 'lucide-react';
import { Toast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

export default function TableDetails() {
  const { tableName } = useParams();
  const navigate = useNavigate();
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCol, setEditingCol] = useState<any>(null);
  
  // Edit Table Name Modal
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTableName, setNewTableName] = useState(tableName || '');

  const DB_TYPES = [
    'INTEGER', 'BIGINT', 'NUMERIC', 'REAL', 'DOUBLE PRECISION',
    'VARCHAR(255)', 'TEXT', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'TIMESTAMPTZ', 'JSONB', 'BYTEA'
  ];

  // Add to existing state at the top:
  const [activeTab, setActiveTab] = useState('columns');
  
  // PK State
  const [primaryKey, setPrimaryKey] = useState<any>(null);
  const [showPkModal, setShowPkModal] = useState(false);
  const [pkSelectedColumns, setPkSelectedColumns] = useState<string[]>([]);

  // FK State
  const [foreignKeys, setForeignKeys] = useState<any[]>([]);
  const [showFkModal, setShowFkModal] = useState(false);
  const [fkDraft, setFkDraft] = useState<any>({ name: '', columns: [], referencedTable: '', referencedColumns: [], onDelete: '', onUpdate: '' });
  const [allTables, setAllTables] = useState<any[]>([]); // to populate target table dropdown

  // Toast & Confirm
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const showAlert = (msg: string) => setToastMessage(msg);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [colsRes, pkRes, fkRes, tablesRes] = await Promise.all([
        fetch(`http://localhost:8080/api/schema/tables/${tableName}/columns`),
        fetch(`http://localhost:8080/api/schema/tables/${tableName}/primary-key`),
        fetch(`http://localhost:8080/api/schema/tables/${tableName}/foreign-keys`),
        fetch('http://localhost:8080/api/schema/tables')
      ]);

      const cols = await colsRes.json();
      setColumns(cols);

      const pkText = await pkRes.text();
      setPrimaryKey(pkText ? JSON.parse(pkText) : null);

      setForeignKeys(await fkRes.json());
      setAllTables(await tablesRes.json());
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName]);

  // PK Handlers
  const handleAddPk = async () => {
    if (pkSelectedColumns.length === 0) return showAlert('Select at least one column');
    try {
      const res = await fetch(`http://localhost:8080/api/schema/tables/${tableName}/primary-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: pkSelectedColumns })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowPkModal(false);
      fetchData();
    } catch (err: any) { showAlert(err.message); }
  };

  const handleDropPk = async () => {
    setConfirmDialog({
      message: 'Drop Primary Key?',
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:8080/api/schema/tables/${tableName}/primary-key/${primaryKey.constraintName}`, { method: 'DELETE' });
          if (!res.ok) throw new Error((await res.json()).error);
          fetchData();
        } catch (err: any) { showAlert(err.message); }
      }
    });
  };

  // FK Handlers
  const handleAddFk = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/schema/tables/${tableName}/foreign-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fkDraft)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowFkModal(false);
      fetchData();
    } catch (err: any) { showAlert(err.message); }
  };

  const handleDropFk = async (constraintName: string) => {
    setConfirmDialog({
      message: `Drop Foreign Key '${constraintName}'?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:8080/api/schema/tables/${tableName}/foreign-keys/${constraintName}`, { method: 'DELETE' });
          if (!res.ok) throw new Error((await res.json()).error);
          fetchData();
        } catch (err: any) { showAlert(err.message); }
      }
    });
  };

  const handleRenameTable = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/schema/tables/${tableName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newTableName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowRenameModal(false);
      navigate(`/tables/${newTableName}`);
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const handleDeleteColumn = async (colName: string) => {
    setConfirmDialog({
      message: `Warning: Deleting column '${colName}' will permanently remove its existing data. Are you sure?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:8080/api/schema/tables/${tableName}/columns/${colName}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          fetchData();
        } catch (err: any) {
          showAlert(err.message);
        }
      }
    });
  };

  const saveColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingCol.originalName;
    const url = isNew 
      ? `http://localhost:8080/api/schema/tables/${tableName}/columns`
      : `http://localhost:8080/api/schema/tables/${tableName}/columns/${editingCol.originalName}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCol)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  if (loading) return <div className="page-container p-8">Loading...</div>;
  if (error) return <div className="page-container p-8 text-red-400">Error: {error}</div>;

  const Tab = ({ id, label }: { id: string, label: string }) => (
    <div 
      className={`pb-3 cursor-pointer transition-colors ${activeTab === id ? 'border-b-2 border-yellow text-white font-medium' : 'text-secondary hover:text-white'}`}
      onClick={() => setActiveTab(id)}
    >
      {label}
    </div>
  );

  return (
    <div className="page-container relative">
      <div className="page-header mb-6">
        <div className="page-title-section">
          <button className="page-icon" style={{ cursor: 'pointer', border: 'none' }} onClick={() => navigate('/tables')}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-secondary text-sm mb-1">
              <span>Tables</span>
              <span>&gt;</span>
              <span>{tableName}</span>
            </div>
            <h1>Table: {tableName}</h1>
            <p className="page-subtitle">Manage columns, keys and structure</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="btn-primary" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => setShowRenameModal(true)}>
            <Edit size={18} />
            Edit Table
          </button>
          <button className="btn-primary" onClick={() => {
            setEditingCol({ originalName: '', name: '', type: 'VARCHAR(255)', nullable: true, defaultValue: '' });
            setShowModal(true);
          }}>
            <Plus size={18} />
            Add Column
          </button>
        </div>
      </div>

      <div className="flex gap-8 border-b mb-6">
        <Tab id="columns" label="Columns" />
        <Tab id="pk" label="Primary Key" />
        <Tab id="fk" label="Foreign Keys" />
        <Tab id="rels" label="Relationships" />
      </div>

      <div className="card flex-1">
        {activeTab === 'columns' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Nullable</th>
                  <th>Default</th>
                  <th className="text-right px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">
                      {col.name}
                      {primaryKey?.columns?.includes(col.name) && <span className="badge ml-2" style={{marginLeft: '8px'}}>PK</span>}
                    </td>
                    <td>{col.type}</td>
                    <td>
                      <span className={`badge ${col.nullable === 'YES' ? 'text-[#a0a0a0] border-[#2a2a2a] bg-[#1a1a1a]' : 'text-red-400 border-red-900 bg-red-900/20'}`}>
                        {col.nullable === 'YES' ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>{col.defaultValue || '—'}</td>
                    <td className="actions-cell">
                      <div className="actions">
                        <Edit2 size={16} className="action-icon" onClick={() => {
                          setEditingCol({
                            originalName: col.name,
                            name: col.name,
                            type: col.type,
                            nullable: col.nullable === 'YES',
                            defaultValue: col.defaultValue || ''
                          });
                          setShowModal(true);
                        }} />
                        <Trash2 size={16} className="action-icon danger" onClick={() => handleDeleteColumn(col.name)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pk' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">Primary Key</h3>
              {!primaryKey && (
                <button className="btn-primary" onClick={() => {
                  setPkSelectedColumns([]);
                  setShowPkModal(true);
                }}>
                  <Plus size={16} /> Define Primary Key
                </button>
              )}
            </div>
            
            {primaryKey ? (
              <div className="p-4 border border-[#2a2a2a] rounded-lg bg-[#121212] flex justify-between items-center">
                <div>
                  <div className="text-sm text-secondary mb-1">Constraint: {primaryKey.constraintName}</div>
                  <div className="font-medium text-white flex gap-2 items-center">
                    Columns: {primaryKey.columns.map((c: string) => <span key={c} className="badge">{c}</span>)}
                  </div>
                </div>
                <button className="btn-primary" style={{ backgroundColor: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }} onClick={handleDropPk}>
                  Drop
                </button>
              </div>
            ) : (
              <div className="text-secondary">No Primary Key defined.</div>
            )}
          </div>
        )}

        {activeTab === 'fk' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">Foreign Keys</h3>
              <button className="btn-primary" onClick={() => {
                setFkDraft({ name: '', columns: [], referencedTable: '', referencedColumns: [], onDelete: '', onUpdate: '' });
                setShowFkModal(true);
              }}>
                <Plus size={16} /> Add Foreign Key
              </button>
            </div>
            
            {foreignKeys.length > 0 ? (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Columns</th>
                      <th>References</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foreignKeys.map((fk: any, idx: number) => (
                      <tr key={idx}>
                        <td>{fk.name}</td>
                        <td><span className="badge">{fk.column}</span></td>
                        <td>{fk.referencedTable}({fk.referencedColumn})</td>
                        <td className="actions-cell">
                          <Trash2 size={16} className="action-icon danger" onClick={() => handleDropFk(fk.name)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-secondary">No Foreign Keys defined.</div>
            )}
          </div>
        )}

        {activeTab === 'rels' && (
          <div className="p-6 text-center text-secondary">
            Go to the Relationships page from the sidebar to view the interactive ERD diagram.
          </div>
        )}
      </div>

      {/* Rename Table Modal */}
      {showRenameModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card p-6" style={{ width: '400px' }}>
            <h2 className="text-xl mb-4 text-white">Rename Table</h2>
            <div className="mb-4">
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>New Table Name</label>
              <input 
                type="text" 
                value={newTableName} 
                onChange={e => setNewTableName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none' }}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-primary" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => setShowRenameModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleRenameTable}>Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* Column Edit/Add Modal */}
      {showModal && editingCol && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <form className="card p-6" style={{ width: '500px' }} onSubmit={saveColumn}>
            <h2 className="text-xl mb-6 text-white">{editingCol.originalName ? 'Edit Column' : 'Add Column'}</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Column Name</label>
                <input 
                  type="text" 
                  value={editingCol.name} 
                  onChange={e => setEditingCol({...editingCol, name: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Data Type</label>
                <select 
                  value={editingCol.type} 
                  onChange={e => setEditingCol({...editingCol, type: e.target.value})}
                  disabled={!!editingCol.originalName}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none', opacity: editingCol.originalName ? 0.5 : 1 }}
                >
                  <option value={editingCol.type}>{editingCol.type}</option>
                  {!editingCol.originalName && DB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {editingCol.originalName && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>Type changes are restricted to prevent errors.</span>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Default Value</label>
                <input 
                  type="text" 
                  value={editingCol.defaultValue} 
                  onChange={e => setEditingCol({...editingCol, defaultValue: e.target.value})}
                  placeholder="e.g. 0 or CURRENT_TIMESTAMP"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="nullable"
                  checked={editingCol.nullable}
                  onChange={e => setEditingCol({...editingCol, nullable: e.target.checked})}
                />
                <label htmlFor="nullable" style={{ color: 'white' }}>Nullable (Allow NULL values)</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button type="button" className="btn-primary" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save Column</button>
            </div>
          </form>
        </div>
      )}

      {/* Primary Key Modal */}
      {showPkModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card p-6" style={{ width: '400px' }}>
            <h2 className="text-xl mb-4 text-white">Define Primary Key</h2>
            <div className="mb-4">
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select Columns</label>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto p-2 border border-[#2a2a2a] rounded">
                {columns.map(c => (
                  <label key={c.name} className="flex items-center gap-2 text-white">
                    <input 
                      type="checkbox" 
                      checked={pkSelectedColumns.includes(c.name)}
                      onChange={e => {
                        if (e.target.checked) setPkSelectedColumns([...pkSelectedColumns, c.name]);
                        else setPkSelectedColumns(pkSelectedColumns.filter(col => col !== c.name));
                      }}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-primary" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => setShowPkModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddPk}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Foreign Key Modal */}
      {showFkModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card p-6" style={{ width: '500px' }}>
            <h2 className="text-xl mb-4 text-white">Add Foreign Key</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-secondary text-sm block mb-1">Local Columns</label>
                <div className="flex flex-wrap gap-2 mb-1">
                  {fkDraft.columns.map((c: string) => <span key={c} className="badge">{c}</span>)}
                </div>
                <select className="w-full p-2 rounded bg-[#0a0a0a] border border-[#2a2a2a] text-white outline-none" onChange={e => {
                  if (e.target.value && !fkDraft.columns.includes(e.target.value)) setFkDraft({...fkDraft, columns: [...fkDraft.columns, e.target.value]});
                }}>
                  <option value="">+ Add Column</option>
                  {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-secondary text-sm block mb-1">Target Table</label>
                <select className="w-full p-2 rounded bg-[#0a0a0a] border border-[#2a2a2a] text-white outline-none" 
                  value={fkDraft.referencedTable}
                  onChange={e => setFkDraft({...fkDraft, referencedTable: e.target.value, referencedColumns: []})}
                >
                  <option value="">Select Table...</option>
                  {allTables.map(t => <option key={t.tableName} value={t.tableName}>{t.tableName}</option>)}
                </select>
              </div>

              {fkDraft.referencedTable && (
                <div>
                  <label className="text-secondary text-sm block mb-1">Target Columns (Type manually for MVP)</label>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {fkDraft.referencedColumns.map((c: string) => <span key={c} className="badge">{c}</span>)}
                  </div>
                  <input type="text" className="w-full p-2 rounded bg-[#0a0a0a] border border-[#2a2a2a] text-white outline-none" 
                    placeholder="Enter column name and press Enter"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !fkDraft.referencedColumns.includes(val)) {
                          setFkDraft({...fkDraft, referencedColumns: [...fkDraft.referencedColumns, val]});
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-secondary text-sm block mb-1">On Delete</label>
                  <select className="w-full p-2 rounded bg-[#0a0a0a] border border-[#2a2a2a] text-white outline-none" value={fkDraft.onDelete} onChange={e => setFkDraft({...fkDraft, onDelete: e.target.value})}>
                    <option value="">NO ACTION</option>
                    <option value="CASCADE">CASCADE</option>
                    <option value="SET NULL">SET NULL</option>
                    <option value="SET DEFAULT">SET DEFAULT</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-secondary text-sm block mb-1">On Update</label>
                  <select className="w-full p-2 rounded bg-[#0a0a0a] border border-[#2a2a2a] text-white outline-none" value={fkDraft.onUpdate} onChange={e => setFkDraft({...fkDraft, onUpdate: e.target.value})}>
                    <option value="">NO ACTION</option>
                    <option value="CASCADE">CASCADE</option>
                    <option value="SET NULL">SET NULL</option>
                    <option value="SET DEFAULT">SET DEFAULT</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-primary" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => setShowFkModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddFk}>Add Key</button>
            </div>
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
