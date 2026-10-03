import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Square, AlertCircle, CheckCircle, Save, FolderOpen, ChevronDown, Download } from 'lucide-react';
import { Toast } from '../components/Toast';

export default function Console() {
  const [sql, setSql] = useState(() => {
    return localStorage.getItem('console_sql') || "SELECT * FROM information_schema.tables WHERE table_schema = 'user_data';";
  });
  const [limit, setLimit] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Resizable layout state
  const [editorHeight, setEditorHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'Data Output' | 'Messages'>('Data Output');

  const executeSql = async () => {
    if (!sql.trim()) return;
    localStorage.setItem('console_sql', sql);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('http://localhost:8080/api/query/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, limit })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute query');
      setResult(data);
      if (data.type === 'UPDATE') {
        setActiveTab('Messages');
      } else {
        setActiveTab('Data Output');
      }
    } catch (err: any) {
      if (err.message.includes('cancel')) {
        setError("Query was cancelled.");
      } else {
        setError(err.message);
      }
      setActiveTab('Messages');
    } finally {
      setLoading(false);
    }
  };

  const cancelSql = async () => {
    try {
      await fetch('http://localhost:8080/api/query/cancel', {
        method: 'POST'
      });
    } catch (err) {
      console.error('Failed to cancel query', err);
    }
  };

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      setEditorHeight(prev => Math.max(100, prev + e.movementY));
    };
    const handleMouseUp = () => setIsResizing(false);
    
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isResizing]);

  const exportData = async (format: 'csv' | 'xlsx' | 'json') => {
    setShowExportMenu(false);
    if (!sql.trim()) return;
    try {
      const res = await fetch('http://localhost:8080/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'QUERY', source: sql, format })
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      setToastMessage('Export failed');
    }
  };

  return (
    <div className="page-container relative" style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
      
      {/* pgAdmin style Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#2d2d2d', borderBottom: '1px solid #111' }}>
        <button className="toolbar-btn" style={toolbarBtnStyle}>
          <FolderOpen size={16} color="#cccccc" />
        </button>
        <button className="toolbar-btn" style={toolbarBtnStyle}>
          <Save size={16} color="#cccccc" />
        </button>
        
        <div style={{ width: '1px', height: '16px', backgroundColor: '#444', margin: '0 8px' }}></div>
        
        <button 
          onClick={executeSql} 
          disabled={loading}
          style={{ ...toolbarBtnStyle, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          title="Execute/Refresh (F5)"
        >
          <Play size={16} color="#22c55e" fill="#22c55e" />
        </button>
        <button 
          onClick={cancelSql}
          disabled={!loading}
          style={{ ...toolbarBtnStyle, opacity: !loading ? 0.5 : 1, cursor: !loading ? 'not-allowed' : 'pointer' }}
          title="Cancel query"
        >
          <Square size={16} color="#ef4444" fill="#ef4444" />
        </button>
        
        <div style={{ width: '1px', height: '16px', backgroundColor: '#444', margin: '0 8px' }}></div>
        
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="toolbar-btn" 
            style={toolbarBtnStyle}
            title="Download Data"
          >
            <Download size={16} color="#cccccc" />
            <ChevronDown size={14} color="#cccccc" style={{ marginLeft: '2px' }} />
          </button>
          
          {showExportMenu && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)', zIndex: 100, minWidth: '100px' }}>
              <div onClick={() => exportData('csv')} style={{ padding: '8px 12px', cursor: 'pointer', color: '#ccc', fontSize: '13px' }} className="hover:bg-[#3c3c3c]">Export CSV</div>
              <div onClick={() => exportData('xlsx')} style={{ padding: '8px 12px', cursor: 'pointer', color: '#ccc', fontSize: '13px' }} className="hover:bg-[#3c3c3c]">Export XLSX</div>
              <div onClick={() => exportData('json')} style={{ padding: '8px 12px', cursor: 'pointer', color: '#ccc', fontSize: '13px' }} className="hover:bg-[#3c3c3c]">Export JSON</div>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#ccc', marginLeft: 'auto' }}>
          <span style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#3c3c3c' }}>
            No limit <ChevronDown size={14} style={{ marginLeft: '4px' }} />
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        
        {/* Editor Section */}
        <div style={{ height: `${editorHeight}px`, flex: 'none', position: 'relative' }}>
          <Editor
            height="100%"
            defaultLanguage="pgsql"
            theme="vs-dark"
            value={sql}
            onChange={(value) => setSql(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace'
            }}
          />
        </div>

        {/* Resizer Divider */}
        <div 
          onMouseDown={startResizing}
          style={{ 
            height: '6px', 
            backgroundColor: isResizing ? '#444' : '#2d2d2d', 
            cursor: 'row-resize',
            borderTop: '1px solid #111',
            borderBottom: '1px solid #111',
            transition: 'background-color 0.2s',
            zIndex: 10
          }}
        />

        {/* Results Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, backgroundColor: '#1e1e1e' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', backgroundColor: '#2d2d2d', borderBottom: '1px solid #111' }}>
            <div 
              onClick={() => setActiveTab('Data Output')}
              style={{ ...tabStyle, borderBottom: activeTab === 'Data Output' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'Data Output' ? '#fff' : '#ccc' }}
            >
              Data Output
            </div>
            <div 
              onClick={() => setActiveTab('Messages')}
              style={{ ...tabStyle, borderBottom: activeTab === 'Messages' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'Messages' ? '#fff' : '#ccc' }}
            >
              Messages
            </div>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
            
            {/* Messages Tab */}
            {activeTab === 'Messages' && (
              <div style={{ padding: '16px', fontFamily: 'monospace', fontSize: '13px', color: '#ccc' }}>
                {error && (
                  <div style={{ color: '#ef4444', whiteSpace: 'pre-wrap' }}>
                    ERROR: {error}
                  </div>
                )}
                
                {result && result.type === 'UPDATE' && (
                  <div style={{ color: '#fff' }}>
                    {result.message}
                  </div>
                )}

                {result && result.type === 'DATA' && (
                  <div style={{ color: '#fff' }}>
                    Successfully run. Total rows: {result.rows.length}.
                  </div>
                )}
                
                {!result && !error && !loading && (
                  <div style={{ color: '#666', fontStyle: 'italic' }}>No messages.</div>
                )}
              </div>
            )}

            {/* Data Output Tab */}
            {activeTab === 'Data Output' && (
              <>
                {result && result.type === 'DATA' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#2d2d2d', zIndex: 10 }}>
                      <tr>
                        <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}></th>
                        {result.columns.map((col: string, idx: number) => (
                          <th key={idx} style={thStyle}>
                            <div style={{ fontWeight: 600 }}>{col}</div>
                            <div style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>{result.columnTypes ? result.columnTypes[idx] : 'unknown'}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.length === 0 ? (
                        <tr>
                          <td colSpan={result.columns.length + 1} style={{ padding: '0', height: '100px' }}>
                             {/* Empty body space to simulate pgAdmin */}
                          </td>
                        </tr>
                      ) : (
                        result.rows.map((row: any, rIdx: number) => (
                          <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? '#1e1e1e' : '#252526' }}>
                            <td style={{ ...tdStyle, backgroundColor: '#2d2d2d', color: '#888', textAlign: 'center' }}>{rIdx + 1}</td>
                            {result.columns.map((col: string, cIdx: number) => {
                              const val = row[col];
                              let displayVal = val;
                              let isNull = false;
                              
                              if (val === null) {
                                displayVal = '[null]';
                                isNull = true;
                              } else if (typeof val === 'string' && val.startsWith('[BINARY DATA:')) {
                                const uuid = val.substring(13, val.length - 1);
                                displayVal = (
                                  <span 
                                    style={{ color: '#eab308', cursor: 'pointer', textDecoration: 'underline' }}
                                    onClick={() => {
                                      setImageUrl(`http://localhost:8080/api/query/image/${uuid}`);
                                      setShowImageModal(true);
                                    }}
                                  >
                                    [BINARY DATA]
                                  </span>
                                );
                              } else if (typeof val === 'object') {
                                displayVal = JSON.stringify(val);
                              } else if (typeof val === 'boolean') {
                                displayVal = val ? 'true' : 'false';
                              }
                              
                              return (
                                <td key={cIdx} style={{ ...tdStyle, color: isNull ? '#888' : '#d4d4d4', whiteSpace: 'nowrap', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={String(displayVal)}>
                                  {displayVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {(!result || result.type !== 'DATA') && !loading && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontStyle: 'italic' }}>
                    Data Output
                  </div>
                )}

                {loading && (
                  <div style={{ padding: '16px', color: '#666', fontStyle: 'italic' }}>
                    Executing query...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {showImageModal && imageUrl && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowImageModal(false)}
        >
          <div style={{ position: 'relative', padding: '0.5rem', backgroundColor: '#1e1e1e', borderRadius: '0.5rem', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
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
    </div>
  );
}

// Inline styles for the pgAdmin look
const toolbarBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  padding: '6px 8px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const tabStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '12px',
  cursor: 'pointer',
  userSelect: 'none'
};

const thStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '12px',
  color: '#ccc',
  borderRight: '1px solid #444',
  borderBottom: '1px solid #444',
  textAlign: 'left',
  whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '12px',
  borderRight: '1px solid #444',
  borderBottom: '1px solid #444'
};
