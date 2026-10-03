import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, GripVertical } from 'lucide-react';

const DB_TYPES = [
  'INTEGER', 'BIGINT', 'NUMERIC', 'REAL', 'DOUBLE PRECISION',
  'VARCHAR(255)', 'TEXT', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'TIMESTAMPTZ', 'JSONB', 'BYTEA', 'ENUM'
];

export default function CreateTable() {
  const navigate = useNavigate();
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState([
    { _id: Math.random().toString(36).substr(2, 9), name: 'id', type: 'INTEGER', nullable: false, defaultValue: '', primaryKey: true }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const addColumn = () => {
    setColumns([...columns, { _id: Math.random().toString(36).substr(2, 9), name: '', type: 'VARCHAR(255)', nullable: true, defaultValue: '', primaryKey: false }]);
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const newCols = [...columns];
    newCols[index] = { ...newCols[index], [field]: value };
    setColumns(newCols);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    const newCols = [...columns];
    const draggedItem = newCols[draggedIdx];
    newCols.splice(draggedIdx, 1);
    newCols.splice(index, 0, draggedItem);
    
    setColumns(newCols);
    setDraggedIdx(null);
  };

  const handleSave = async () => {
    if (!tableName) {
      setError('Table name is required');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8080/api/schema/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, columns: columns.map(({ _id, ...rest }) => rest) })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create table');
      }
      
      navigate(`/tables/${tableName}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <button className="page-icon" style={{ cursor: 'pointer', border: 'none' }} onClick={() => navigate('/tables')}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1>Create Table</h1>
            <p className="page-subtitle">Define the table name and initial columns</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={18} />
            {saving ? 'Creating...' : 'Create Table'}
          </button>
        </div>
      </div>

      {error && <div className="card p-4 mb-6" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>{error}</div>}

      <div className="card mb-6 p-6">
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Table Name</label>
          <input 
            type="text" 
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="e.g. users"
            style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none' }}
          />
        </div>
      </div>

      <div className="card flex-1">
        <div className="flex justify-between items-center p-4 border-b border-[#2a2a2a]">
          <h3 className="font-medium text-lg">Columns</h3>
          <button className="btn-primary" onClick={addColumn}>
            <Plus size={16} />
            Add Column
          </button>
        </div>
        
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Name</th>
                <th>Type</th>
                <th>Nullable</th>
                <th>Default Value</th>
                <th>Primary Key</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, idx) => (
                <tr 
                  key={col._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  style={{ opacity: draggedIdx === idx ? 0.5 : 1 }}
                >
                  <td style={{ cursor: 'grab', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <GripVertical size={16} />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={col.name} 
                      onChange={(e) => updateColumn(idx, 'name', e.target.value)}
                      placeholder="column_name"
                      style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'white', width: '100%' }}
                    />
                  </td>
                  <td>
                    <select 
                      value={col.type.startsWith('ENUM') ? 'ENUM' : col.type}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'ENUM') updateColumn(idx, 'type', 'ENUM()');
                        else updateColumn(idx, 'type', val);
                      }}
                      style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'white', width: '100%' }}
                    >
                      {!DB_TYPES.includes(col.type) && !col.type.startsWith('ENUM') && (
                        <option value={col.type}>{col.type}</option>
                      )}
                      {DB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {col.type.startsWith('ENUM') && (
                      <input 
                        type="text"
                        value={col.type === 'ENUM()' ? '' : col.type.substring(5, col.type.length - 1)}
                        onChange={(e) => updateColumn(idx, 'type', `ENUM(${e.target.value})`)}
                        placeholder="'A', 'B'"
                        style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'white', width: '100%' }}
                      />
                    )}
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={col.nullable}
                      onChange={(e) => updateColumn(idx, 'nullable', e.target.checked)}
                      disabled={col.primaryKey}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={col.defaultValue} 
                      onChange={(e) => updateColumn(idx, 'defaultValue', e.target.value)}
                      placeholder="NULL, 0, CURRENT_TIMESTAMP..."
                      style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'white', width: '100%' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={col.primaryKey}
                      onChange={(e) => {
                        updateColumn(idx, 'primaryKey', e.target.checked);
                        if (e.target.checked) updateColumn(idx, 'nullable', false);
                      }}
                    />
                  </td>
                  <td className="text-right">
                    <button 
                      onClick={() => removeColumn(idx)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} className="action-icon danger" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
