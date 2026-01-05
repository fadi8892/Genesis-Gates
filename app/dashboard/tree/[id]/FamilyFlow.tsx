'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { 
  Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge, 
  Connection, Edge, Node, NodeChange, EdgeChange, MiniMap, Panel, 
  useReactFlow, ReactFlowProvider, useNodesState, useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Plus, Trash2, Save, Loader2, CheckCircle, Download, Search, 
  Layout, List, Grid, ArrowDown, ArrowRight, Circle, Fan, Image as ImageIcon
} from 'lucide-react';
// Additional icon used for importing JSON
import { Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import dagre from 'dagre';
import FamilyNode from '@/components/FamilyNode';
import MemberSidebar from '@/components/MemberSidebar';
import { FamilyMemberData } from '@/types/family';
import { generateGedcom } from '@/lib/gedcom';
import { useRef } from 'react';

// --- PERFORMANCE FIX: Define outside component ---
const nodeTypes = { familyMember: FamilyNode };

export default function FamilyFlowWrapper({ treeId }: { treeId: string }) {
  return (
    <ReactFlowProvider>
      <FamilyFlow treeId={treeId} />
    </ReactFlowProvider>
  );
}

function FamilyFlow({ treeId }: { treeId: string }) {
  const supabase = createClient();
  const { fitView, setViewport } = useReactFlow();
  
  // --- STATE ---
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // View Modes: 'graph' or 'list'
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI Loading States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Offline mode flag.  When supabase calls fail (e.g. when opened locally
  // without environment variables), the editor falls back to purely local
  // storage.  In offline mode database writes are skipped and the user can
  // import/export JSON files to persist their work.  This makes the
  // application usable even without a backend.
  const [isOffline, setIsOffline] = useState(false);

  // Reference to hidden JSON file input for import
  const jsonInputRef = useRef<HTMLInputElement>(null);

  /**
   * Persist edits made in the sidebar to the database.  When the user edits a
   * person’s details in the MemberSidebar, update the local state and
   * immediately push the changes to Supabase.  Without this handler only the
   * UI would update and the database would not reflect the change until the
   * next save.
   */
  const handleMemberSave = async (data: any) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => (n.id === selectedNodeId ? { ...n, data } : n)));
    const { error } = await supabase
      .from('nodes')
      .update({ data })
      .eq('id', selectedNodeId);
    if (error) console.error('Update member data error:', error.message);
  };

  // --- 1. ADVANCED LAYOUT ENGINE ---
  const runLayout = useCallback((mode: 'TB' | 'LR' | 'RADIAL' | 'FAN') => {
    if (nodes.length === 0) return;

    // A. Standard Dagre (Vertical/Horizontal)
    if (mode === 'TB' || mode === 'LR') {
      const g = new dagre.graphlib.Graph();
      g.setGraph({ rankdir: mode, nodesep: 100, ranksep: 150 });
      g.setDefaultEdgeLabel(() => ({}));
      
      nodes.forEach(n => g.setNode(n.id, { width: 180, height: 100 }));
      edges.forEach(e => g.setEdge(e.source, e.target));
      
      dagre.layout(g);
      
      const newNodes = nodes.map(n => {
        const pos = g.node(n.id);
        return { ...n, position: { x: pos.x - 90, y: pos.y - 50 } };
      });
      setNodes(newNodes);
    } 
    
    // B. Radial / Circular Layout
    else if (mode === 'RADIAL' || mode === 'FAN') {
      const levels: Record<string, number> = {};
      const visited = new Set<string>();
      const queue: {id: string, lvl: number}[] = [];
      
      // Find a root (node with no parents ideally)
      const hasParent = new Set(edges.map(e => e.target));
      const root = nodes.find(n => !hasParent.has(n.id)) || nodes[0];
      
      if(root) queue.push({ id: root.id, lvl: 0 });
      
      while(queue.length > 0) {
        const { id, lvl } = queue.shift()!;
        if(visited.has(id)) continue;
        visited.add(id);
        levels[id] = lvl;
        
        const children = edges.filter(e => e.source === id).map(e => e.target);
        children.forEach(c => queue.push({ id: c, lvl: lvl + 1 }));
      }
      
      const nodesByLevel: Record<number, string[]> = {};
      Object.entries(levels).forEach(([id, lvl]) => {
         if(!nodesByLevel[lvl]) nodesByLevel[lvl] = [];
         nodesByLevel[lvl].push(id);
      });

      const newNodes = nodes.map(n => {
        const lvl = levels[n.id] || 0;
        const index = nodesByLevel[lvl]?.indexOf(n.id) || 0;
        const count = nodesByLevel[lvl]?.length || 1;
        
        const radius = lvl * 300;
        const sweep = mode === 'FAN' ? Math.PI : 2 * Math.PI; 
        const angleOffset = mode === 'FAN' ? Math.PI : 0;
        
        const angle = (index / count) * sweep + angleOffset;
        
        return {
          ...n,
          position: {
            x: radius * Math.cos(angle) + 400,
            y: radius * Math.sin(angle)
          }
        };
      });
      setNodes(newNodes);
    }

    setTimeout(() => fitView({ duration: 1000 }), 50);
  }, [nodes, edges, setNodes, fitView]);

  /**
   * Intercept node change events to persist position updates to the database.
   * This wrapper calls the default onNodesChange provided by ReactFlow to
   * update local state and then, when dragging ends, persists the final
   * position to Supabase.  Without this, users would need to explicitly
   * press save after every drag to persist positions, which felt laggy.
   */
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      changes.forEach(async change => {
        if (change.type === 'position' && change.dragging === false) {
          const moved = nodes.find(n => n.id === change.id);
          if (moved) {
            const pos = change.position ?? moved.position;
            if (!isOffline) {
              const { error } = await supabase
                .from('nodes')
                .update({ position_x: pos.x, position_y: pos.y })
                .eq('id', moved.id);
              if (error) console.error('Update node position error:', error.message);
            }
          }
        }
      });
    },
    [onNodesChange, nodes, supabase, isOffline],
  );

  // --- 2. SEARCH FUNCTIONALITY ---
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return [];
    return nodes.filter(n => n.data.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [nodes, searchQuery]);

  const jumpToNode = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (node) {
      setViewport({ x: -node.position.x + 500, y: -node.position.y + 300, zoom: 1.5 }, { duration: 1000 });
      setSelectedNodeId(id);
      setIsSidebarOpen(true);
      setSearchQuery('');
    }
  };

  // --- 3. DATA LOAD & SAVE (With Batching) ---
  
  // Helper to split array (prevents 400 error)
  const chunkArray = (arr: any[], size: number) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const { data: n, error: nodeErr } = await supabase.from('nodes').select('*').eq('tree_id', treeId);
        const { data: e, error: edgeErr } = await supabase.from('edges').select('*').eq('tree_id', treeId);
        if (nodeErr || edgeErr) throw new Error('Supabase unavailable');
        if (n) setNodes(n.map(x => ({
          id: x.id,
          type: 'familyMember',
          position: { x: x.position_x, y: x.position_y },
          data: x.data,
        })));
        if (e) setEdges(e.map(x => ({
          id: x.id,
          source: x.source,
          target: x.target,
          animated: true,
          type: 'smoothstep',
          style: { stroke: '#7c3aed', strokeWidth: 2 },
        })));
      } catch (err) {
        // When supabase errors (likely when running locally without env vars)
        // enable offline mode and start with empty graph.
        console.warn('Supabase not available; starting in offline mode.');
        setIsOffline(true);
        setNodes([]);
        setEdges([]);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [treeId, setNodes, setEdges, supabase]);

  /**
   * Persist the current graph to the database.  Unlike the previous implementation
   * which deleted everything and re–inserted it on each save (causing significant
   * lag for even modest trees), this method uses Supabase’s upsert API to
   * incrementally write just the current set of nodes and edges.  Nodes and
   * edges that were removed by the user are deleted when they are removed via
   * the removeNode handler.  New or modified nodes and edges are upserted
   * individually, greatly reducing the amount of work on each save and producing
   * a smoother, more “Apple‑like” experience.
   */
  const saveTree = async () => {
    setIsSaving(true);
    // If offline, export JSON instead of writing to the database
    if (isOffline) {
      exportJSON();
      setIsSaving(false);
      return;
    }
    // Prepare payloads.  Serialize node position and data so Supabase
    // understands them.
    const dbNodes = nodes.map(n => ({
      id: n.id,
      tree_id: treeId,
      type: n.type,
      position_x: n.position.x,
      position_y: n.position.y,
      data: n.data,
    }));
    const dbEdges = edges.map(e => ({
      id: e.id,
      tree_id: treeId,
      source: e.source,
      target: e.target,
    }));
    // Upsert nodes in manageable chunks.  Upsert will insert new rows or
    // replace existing rows with the same primary key without wiping the
    // entire table.  Chunking avoids Supabase’s 400 row limit per insert.
    const nodeChunks = chunkArray(dbNodes, 100);
    for (const chunk of nodeChunks) {
      const { error } = await supabase.from('nodes').upsert(chunk);
      if (error) console.error('Node upsert error:', error.message);
    }
    // Upsert edges similarly.
    const edgeChunks = chunkArray(dbEdges, 100);
    for (const chunk of edgeChunks) {
      const { error } = await supabase.from('edges').upsert(chunk);
      if (error) console.error('Edge upsert error:', error.message);
    }
    setLastSaved(new Date());
    setIsSaving(false);
  };

  const handleExport = () => {
    const blob = new Blob([generateGedcom(nodes, edges)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'family_tree.ged'; a.click();
  };

  /**
   * Export the current nodes and edges as a JSON file.  Used in offline
   * mode when supabase is unavailable.  The file contains an object
   * structure with `nodes` and `edges` arrays which can be imported back
   * into the editor.  Each node and edge retains its id, position and
   * data properties.
   */
  const exportJSON = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'family_tree.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Import a JSON file containing nodes and edges.  When run, this replaces
   * the current state.  It is only available in offline mode since
   * supabase-managed trees will sync automatically from the database.
   */
  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const obj = JSON.parse(e.target?.result as string);
        if (Array.isArray(obj.nodes) && Array.isArray(obj.edges)) {
          // map JSON to ReactFlow nodes/edges
          const importedNodes = obj.nodes.map((n: any) => ({
            id: n.id,
            type: n.type ?? 'familyMember',
            position: n.position ?? { x: n.position_x ?? 0, y: n.position_y ?? 0 },
            data: n.data,
          }));
          const importedEdges = obj.edges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: true,
            type: 'smoothstep',
            style: { stroke: '#7c3aed', strokeWidth: 2 },
          }));
          setNodes(importedNodes);
          setEdges(importedEdges);
        } else {
          alert('Invalid JSON format.');
        }
      } catch (err) {
        alert('Error parsing JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  // --- 4. ADD / REMOVE LOGIC ---
  /**
   * Create a new node both in the UI and persist it to the database.  This
   * function immediately upserts the new node into the `nodes` table so that
   * autosave isn’t required before closing the tab or navigating away.  The
   * optimistic UI ensures the node appears instantly; errors are logged but
   * not fatal.
   */
  const addNode = async () => {
    const id = crypto.randomUUID();
    const newNode: Node = {
      id,
      type: 'familyMember',
      position: { x: 0, y: 0 },
      data: { label: 'New Person', role: 'Relative', photos: [] },
    };
    setNodes(nds => [...nds, newNode]);
    setSelectedNodeId(id);
    setIsSidebarOpen(true);
    // Persist immediately
    if (!isOffline) {
      const payload = {
        id,
        tree_id: treeId,
        type: newNode.type,
        position_x: newNode.position.x,
        position_y: newNode.position.y,
        data: newNode.data,
      };
      const { error } = await supabase.from('nodes').insert(payload);
      if (error) console.error('Add node error:', error.message);
    }
  };

  /**
   * Remove a node and its associated edges from both the UI and the database.
   */
  const removeNode = async () => {
    if (!selectedNodeId) return;
    // Remove locally
    setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
    setEdges(eds => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    // Persist deletion
    if (!isOffline) {
      const { error: nodeErr } = await supabase.from('nodes').delete().eq('id', selectedNodeId);
      if (nodeErr) console.error('Delete node error:', nodeErr.message);
      // Delete edges referencing this node
      const { error: edgeSrcErr } = await supabase.from('edges').delete().eq('source', selectedNodeId);
      if (edgeSrcErr) console.error('Delete edges (source) error:', edgeSrcErr.message);
      const { error: edgeTgtErr } = await supabase.from('edges').delete().eq('target', selectedNodeId);
      if (edgeTgtErr) console.error('Delete edges (target) error:', edgeTgtErr.message);
    }
    setSelectedNodeId(null);
    setIsSidebarOpen(false);
  };

  /**
   * Create a new edge when two nodes are connected.  This function not only
   * updates the UI but also persists the edge to the database via upsert.  If
   * the edge already exists it will be replaced; otherwise it is inserted.
   */
  const onConnect = useCallback(async (params: Connection) => {
    // Update UI immediately
    setEdges(eds => addEdge({
      ...params,
      animated: true,
      type: 'smoothstep',
      style: { stroke: '#7c3aed', strokeWidth: 2 },
    }, eds));
    // Persist to DB if online
    if (!isOffline) {
      const payload = {
        id: `${params.source}-${params.target}`,
        tree_id: treeId,
        source: params.source!,
        target: params.target!,
      };
      const { error } = await supabase.from('edges').upsert(payload);
      if (error) console.error('Add edge error:', error.message);
    }
  }, [setEdges, treeId, supabase, isOffline]);

  // --- RENDER ---
  if(isLoading) return <div className="h-full flex items-center justify-center bg-[#050505] text-white"><Loader2 className="animate-spin mr-2"/> Loading...</div>;

  return (
    <div className="h-full w-full bg-[#050505] flex flex-col relative">
      
      {/* === HEADER TOOLBAR === */}
      <div className="h-16 bg-[#0d1117] border-b border-white/10 flex items-center justify-between px-4 z-20 shadow-xl">
        
        {/* LEFT: Search */}
        <div className="relative w-72">
           <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
           <input 
             value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
             placeholder="Find person..." 
             className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:border-accent focus:outline-none"
           />
           {/* Search Results Dropdown */}
           {searchQuery && (
             <div className="absolute top-12 left-0 w-full bg-[#161b22] border border-white/10 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50">
               {filteredNodes.map(n => (
                 <div key={n.id} onClick={() => jumpToNode(n.id)} className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-white/5">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold">{n.data.label[0]}</div>
                    <div className="text-sm font-bold text-white">{n.data.label}</div>
                 </div>
               ))}
               {filteredNodes.length === 0 && <div className="p-3 text-white/30 text-xs">No matches found.</div>}
             </div>
           )}
        </div>

        {/* CENTER: Layout & View Controls */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
           <button onClick={() => setViewMode('graph')} className={`p-2 rounded hover:bg-white/10 ${viewMode==='graph' ? 'bg-accent text-white' : 'text-white/50'}`} title="Graph View"><Grid className="w-4 h-4"/></button>
           <button onClick={() => setViewMode('list')} className={`p-2 rounded hover:bg-white/10 ${viewMode==='list' ? 'bg-accent text-white' : 'text-white/50'}`} title="List View"><List className="w-4 h-4"/></button>
           
           <div className="w-px h-6 bg-white/10 mx-2"/>
           
           {/* Layout Buttons (Only active in Graph Mode) */}
           {viewMode === 'graph' && (
             <>
               <button onClick={() => runLayout('TB')} className="p-2 text-white/50 hover:text-white rounded" title="Vertical Tree"><ArrowDown className="w-4 h-4"/></button>
               <button onClick={() => runLayout('LR')} className="p-2 text-white/50 hover:text-white rounded" title="Horizontal Tree"><ArrowRight className="w-4 h-4"/></button>
               <button onClick={() => runLayout('RADIAL')} className="p-2 text-white/50 hover:text-white rounded" title="Circular Map"><Circle className="w-4 h-4"/></button>
               <button onClick={() => runLayout('FAN')} className="p-2 text-white/50 hover:text-white rounded" title="Fan Chart"><Fan className="w-4 h-4"/></button>
             </>
           )}
        </div>

        {/* RIGHT: Actions */}
        <div className="flex gap-2">
           {/* Export button: GEDCOM online, JSON offline */}
           {isOffline ? (
             <button onClick={exportJSON} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70" title="Export JSON"><Download className="w-5 h-5"/></button>
           ) : (
             <button onClick={handleExport} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70" title="Export GEDCOM"><Download className="w-5 h-5"/></button>
           )}
           {/* Import JSON button in offline mode */}
           {isOffline && (
             <button onClick={() => jsonInputRef.current?.click()} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70" title="Import JSON"><Upload className="w-5 h-5"/></button>
           )}
           <button onClick={saveTree} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 rounded-lg font-bold text-sm transition-all">
             {isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>} {isSaving ? 'Saving...' : isOffline ? 'Download' : 'Save'}
           </button>
        </div>
      </div>

      {/* === MAIN CANVAS === */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'graph' ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, n) => {
              setSelectedNodeId(n.id);
              setIsSidebarOpen(true);
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setIsSidebarOpen(false);
            }}
            fitView
          >
            <Background color="#7c3aed" gap={30} size={1} variant="dots" className="opacity-20" />
            <Controls className="!bg-[#161b22] !border-white/10 [&>button]:!fill-white hover:[&>button]:!bg-white/10"/>
            <MiniMap nodeColor="#7c3aed" maskColor="rgba(0,0,0, 0.7)" className="!bg-[#161b22] !border-white/10 rounded-lg"/>
            
            {/* FLOATING ACTION BAR (Bottom) */}
            <Panel position="bottom-center" className="mb-8 flex gap-3 p-2 bg-[#161b22]/80 backdrop-blur border border-white/10 rounded-2xl shadow-2xl">
               <button onClick={addNode} className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold transition-transform hover:scale-105 shadow-[0_0_15px_-5px_var(--color-accent)]">
                 <Plus className="w-5 h-5"/> Add Member
               </button>
               {selectedNodeId && (
                 <button onClick={removeNode} className="flex items-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold transition-colors">
                   <Trash2 className="w-5 h-5"/> Remove Selected
                 </button>
               )}
            </Panel>
          </ReactFlow>
        ) : (
          // === LIST VIEW (Table) ===
          <div className="p-8 max-w-5xl mx-auto animate-in fade-in">
             <div className="bg-[#161b22] border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-xs uppercase text-white/50 font-bold">
                    <tr>
                      <th className="p-4">Profile</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Birth Date</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map(n => (
                      <tr key={n.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 flex items-center gap-3 font-bold text-white">
                           {n.data.photos?.[0] ? 
                             <img src={n.data.photos[0]} className="w-8 h-8 rounded-full object-cover"/> : 
                             <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs">{n.data.label[0]}</div>
                           }
                           {n.data.label}
                        </td>
                        <td className="p-4 text-white/70">{n.data.role}</td>
                        <td className="p-4 text-white/70">{n.data.birthDate || '-'}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => { setSelectedNodeId(n.id); setIsSidebarOpen(true); }} className="text-accent hover:underline text-sm font-bold">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}
      </div>

      {/* EDITING SIDEBAR */}
      <MemberSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        memberData={nodes.find(n => n.id === selectedNodeId)?.data || null}
        onSave={handleMemberSave}
      />

      {/* Hidden input for importing JSON (offline mode) */}
      <input
        type="file"
        accept=".json"
        ref={jsonInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importJSON(file);
          // reset input value so same file can be re-imported if needed
          if (e.target) (e.target as HTMLInputElement).value = '';
        }}
      />
    </div>
  );
}