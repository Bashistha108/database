import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronDown, Eye, Edit2, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { Toast } from '../components/Toast';

interface TableInfo {
  tableName: string;
  schema: string;
  columns: number;
  rows: number;
  createdAt: string;
}

export default function Tables() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Deletion state
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchTables = () => {
    fetch('http://localhost:8080/api/schema/tables')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch tables');
        return res.json();
      })
      .then(data => {
        setTables(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;

    try {
      const res = await fetch(`http://localhost:8080/api/schema/tables/${tableToDelete}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete table');
      }
      
      setToast({ message: `Table "${tableToDelete}" deleted successfully.`, type: 'success' });
      fetchTables();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setTableToDelete(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <div className="page-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          </div>
          <div>
            <h1>Tables</h1>
            <p className="page-subtitle">View and manage your database tables. Create new tables, modify existing ones, and explore their structure, columns and relationships.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/tables/new')}>
          <Plus size={18} />
          Create Table
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={18} className="icon-secondary" />
          <input type="text" placeholder="Search tables..." />
        </div>
        <div className="dropdown">
          <span>All Schemas</span>
          <ChevronDown size={16} className="icon-secondary" />
        </div>
        <div className="dropdown">
          <span>User Tables</span>
          <ChevronDown size={16} className="icon-secondary" />
        </div>
      </div>

      <div className="card fill-height">
        {loading ? (
          <div className="empty-state">Loading tables...</div>
        ) : error ? (
          <div className="empty-state error">{error}</div>
        ) : tables.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="empty-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            <h3>No tables found</h3>
            <p>You haven't created any tables yet. Start building your database by creating your first table.</p>
            <button className="btn-primary" onClick={() => navigate('/tables/new')}>
              <Plus size={18} />
              Create your first Table
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th-icon"></th>
                  <th>Table Name</th>
                  <th>Schema</th>
                  <th>Columns</th>
                  <th>Rows</th>
                  <th>Created At</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => (
                  <tr key={`${table.schema}.${table.tableName}`}>
                    <td className="td-icon text-secondary">&gt;</td>
                    <td>
                      <div className="table-name-cell">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                        <span className="font-medium">{table.tableName}</span>
                      </div>
                    </td>
                    <td><span className="badge">{table.schema}</span></td>
                    <td>{table.columns}</td>
                    <td>{table.rows || '-'}</td>
                    <td className="text-secondary">{table.createdAt || '-'}</td>
                    <td className="actions-cell">
                      <div className="actions">
                        <Eye size={16} className="action-icon" onClick={() => navigate(`/tables/${table.tableName}`)} />
                        <Edit2 size={16} className="action-icon" onClick={() => navigate(`/tables/${table.tableName}`)} />
                        <Trash2 
                          size={16} 
                          className="action-icon danger" 
                          onClick={() => setTableToDelete(table.tableName)} 
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination-footer">
          <span>Showing {tables.length} tables</span>
          <div className="pagination-controls">
             <button className="page-btn disabled">&lt;</button>
             <button className="page-btn active">1</button>
             <button className="page-btn disabled">&gt;</button>
          </div>
        </div>
      </div>
      
      {tableToDelete && (
        <ConfirmModal
          isOpen={true}
          message={`Are you sure you want to permanently delete the table "${tableToDelete}"? This action cannot be undone and will destroy all data within the table.`}
          onConfirm={handleDeleteTable}
          onCancel={() => setTableToDelete(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
