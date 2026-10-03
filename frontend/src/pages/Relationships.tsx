import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Node for Tables
const TableNode = ({ data }: any) => {
  return (
    <div className="card" style={{ minWidth: '200px', backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)' }}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--text-secondary)' }} />
      
      <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>
        {data.label}
      </div>
      
      <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        {data.columns?.length > 0 ? data.columns.map((c: any) => (
          <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ color: 'white' }}>{c.name}</span>
            <span style={{ color: '#666', fontSize: '11px' }}>{c.type.split('(')[0]}</span>
          </div>
        )) : <div style={{ fontStyle: 'italic', color: '#555' }}>No columns</div>}
      </div>
      
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--text-secondary)' }} />
    </div>
  );
};

export default function Relationships() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const nodeTypes = useMemo(() => ({ table: TableNode }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const tablesRes = await fetch('http://localhost:8080/api/schema/tables');
        const tables = await tablesRes.json();

        // Fetch columns for each table to display in the node
        const tablesWithCols = await Promise.all(tables.map(async (t: any) => {
          const colRes = await fetch(`http://localhost:8080/api/schema/tables/${t.tableName}/columns`);
          const cols = await colRes.json();
          return { ...t, columns: cols };
        }));

        const relsRes = await fetch('http://localhost:8080/api/schema/relationships');
        const rels = await relsRes.json();

        // Generate Nodes
        const initialNodes = tablesWithCols.map((t: any, index: number) => ({
          id: t.tableName,
          type: 'table',
          position: { x: (index % 3) * 300 + 50, y: Math.floor(index / 3) * 300 + 50 },
          data: { label: t.tableName, columns: t.columns },
        }));

        // Generate Edges
        const initialEdges = rels.map((r: any) => ({
          id: r.constraintName,
          source: r.sourceTable,
          target: r.targetTable,
          label: `${r.sourceColumn} → ${r.targetColumn}`,
          style: { stroke: 'var(--accent-yellow)', strokeWidth: 2 },
          labelStyle: { fill: 'var(--text-secondary)', fontWeight: 500 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'var(--accent-yellow)',
          },
          animated: true
        }));

        setNodes(initialNodes);
        setEdges(initialEdges);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load schema", err);
        setLoading(false);
      }
    };

    fetchSchema();
  }, []);

  if (loading) return <div className="page-container p-8">Loading ERD...</div>;

  return (
    <div className="page-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: 0, padding: '0 0 1.5rem 0' }}>
        <div className="page-title-section">
          <div className="page-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path></svg>
          </div>
          <div>
            <h1>Relationships</h1>
            <p className="page-subtitle">Entity-Relationship Diagram of your database</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '0.75rem', overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
          style={{ backgroundColor: 'var(--bg-panel)' }}
        >
          <Background color="#333" gap={16} />
          <Controls style={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)' }} />
        </ReactFlow>
      </div>
    </div>
  );
}
