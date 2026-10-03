import React, { useEffect, useState } from 'react';
import { Database, Table2, Activity, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SystemStatus {
  status: string;
  database: string;
  version?: string;
  uptime?: string;
}

interface TableInfo {
  tableName: string;
  rows: number;
}

export default function Home() {
  const [status, setStatus] = useState<SystemStatus>({ status: 'Connecting...', database: '...' });
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch system status
    fetch('http://localhost:8080/api/system/status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ status: 'Disconnected', database: 'Unknown' }));

    // Fetch tables for stats
    fetch('http://localhost:8080/api/schema/tables')
      .then(res => res.json())
      .then(data => {
        setTables(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalTables = tables.length;
  const totalRows = tables.reduce((acc, table) => acc + (table.rows || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <div className="page-icon">
            <Activity size={28} />
          </div>
          <div>
            <h1>Dashboard</h1>
            <p className="page-subtitle">Overview of your database instance and statistics.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="card stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="stat-icon" style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px' }}>
            <Server size={24} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Status</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '20px' }}>{status.status}</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>{status.database}</p>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="stat-icon" style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px' }}>
            <Table2 size={24} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Total Tables</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px' }}>{loading ? '...' : totalTables}</h3>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="stat-icon" style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '8px' }}>
            <Database size={24} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Total Rows</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px' }}>{loading ? '...' : totalRows}</h3>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={() => navigate('/tables/new')}>Create New Table</button>
          <button className="btn-secondary" onClick={() => navigate('/console')}>Open SQL Console</button>
        </div>
      </div>
    </div>
  );
}
