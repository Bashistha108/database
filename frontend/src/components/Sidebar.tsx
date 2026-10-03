import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Database, Table2, Network, FolderOpen, Download, TerminalSquare, Settings, WifiOff } from 'lucide-react';

export default function Sidebar() {
  const [status, setStatus] = useState<any>({ status: 'Connecting...', database: '...' });

  useEffect(() => {
    fetch('http://localhost:8080/api/system/status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ status: 'Disconnected', database: 'database' }));
  }, []);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `nav-item ${isActive ? 'active' : ''}`;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Database className="brand-icon" size={28} />
        <span className="brand-text">Database</span>
      </div>

      <div className="sidebar-nav">
        <NavLink to="/home" className={navItemClass}>
          <Home size={18} />
          <span>Home</span>
        </NavLink>

        <div className="nav-section-title">
          <span>Schema</span>
          <span>^</span>
        </div>
        <NavLink to="/tables" className={navItemClass}>
          <Table2 size={18} />
          <span>Tables</span>
        </NavLink>
        <NavLink to="/relationships" className={navItemClass}>
          <Network size={18} />
          <span>Relationships</span>
        </NavLink>

        <div className="nav-section-title">
          <span>Data</span>
          <span>^</span>
        </div>
        <NavLink to="/browse" className={navItemClass}>
          <FolderOpen size={18} />
          <span>Browse Data</span>
        </NavLink>

        <div className="mt-4">
          <NavLink to="/console" className={navItemClass}>
            <TerminalSquare size={18} />
            <span>SQL Console</span>
          </NavLink>
        </div>

        <div className="mt-2">
          <NavLink to="/settings" className={navItemClass}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="connection-status">
          {status.status === 'Connected' ? (
            <Database size={24} className="icon-dim" />
          ) : (
            <WifiOff size={24} className="icon-dim" style={{ color: '#ff4444' }} />
          )}
          <div className="connection-info">
            <span className="status-label">
              <span className="status-dot" style={{ backgroundColor: status.status === 'Connected' ? '#00e676' : '#ff4444' }}></span> 
              {status.status}
            </span>
            <span className="status-desc">PostgreSQL • {status.database}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
