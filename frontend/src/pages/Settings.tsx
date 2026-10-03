import React, { useEffect, useState } from 'react';
import { Database, Server, Hash, Download } from 'lucide-react';

export default function Settings() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/system/status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ status: 'Disconnected' }));
  }, []);

  const ItemRow = ({ icon: Icon, title, value, statusColor, isLast }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 0', borderBottom: isLast ? 'none' : '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--bg-lighter)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          <Icon size={20} />
        </div>
        <div style={{ fontWeight: 500, color: 'white', fontSize: '1rem' }}>{title}</div>
      </div>
      <div style={{ color: statusColor || 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: statusColor ? 600 : 400 }}>
        {statusColor && (
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor, display: 'inline-block' }}></span>
        )}
        {value}
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.75rem' }}>Settings</h1>
        <p className="page-description">Manage your application configuration and connections</p>
      </div>

      <div className="card" style={{ padding: '0 1.5rem', borderRadius: '12px' }}>
        {status ? (
          <>
            <ItemRow 
              icon={Server} 
              title="Connection Status" 
              value={status.status} 
              statusColor={status.status === 'Connected' ? '#00e676' : '#ff4444'} 
            />
            <ItemRow 
              icon={Database} 
              title="Database Name" 
              value={status.database || 'N/A'} 
            />
            <ItemRow 
              icon={Hash} 
              title="PostgreSQL Version" 
              value={status.version || 'N/A'} 
            />
            <ItemRow 
              icon={Download} 
              title="Export Row Limit" 
              value="10,000" 
              isLast={true}
            />
          </>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading system status...
          </div>
        )}
      </div>
    </div>
  );
}
