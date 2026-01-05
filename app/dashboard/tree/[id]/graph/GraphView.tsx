"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
  useReactFlow,
  Edge,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { NodeCard } from "./NodeCard";
import { Search, RotateCcw, Maximize, Minus, Plus } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import type { GraphData } from "./types";
import { computeLayout } from "./layout"; 

const nodeTypes = { person: NodeCard };

// --- HELPERS ---
const resolveName = (dbNode: any) => {
  if (!dbNode) return "Unknown";
  const innerData = dbNode.data || {};
  if (innerData.label) return innerData.label;
  if (innerData.displayName) return innerData.displayName;
  if (innerData.name) return innerData.name;
  if (innerData.first_name) return `${innerData.first_name} ${innerData.last_name || ''}`.trim();
  if (dbNode.label) return dbNode.label;
  return "Unnamed Person"; 
};

// --- NAN SANITIZER ---
// Ensures we never pass bad math to React Flow
const sanitizeNode = (node: any) => {
    return {
        ...node,
        position: {
            x: Number.isFinite(node.position.x) ? node.position.x : 0,
            y: Number.isFinite(node.position.y) ? node.position.y : 0,
        }
    };
};

export default function GraphView({ data, onOpenSidebar }: { data: GraphData, onOpenSidebar: (id: string) => void }) {
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // --- LOAD & LAYOUT ---
  useEffect(() => {
    if (!data) return;

    // 1. Map Data
    const rawNodes: Node[] = data.nodes.map((n: any) => ({
        id: n.id,
        type: "person", 
        position: { x: 0, y: 0 }, 
        data: { 
            ...n.data, 
            label: resolveName(n),
            accent: n.data?.accent || "#3b82f6"
        }
    }));

    const rawEdges: Edge[] = data.edges.map((e: any) => ({
      id: e.id,
      source: e.source, 
      target: e.target,
      type: 'step', // Strict orthogonal lines
      animated: false,
      style: { stroke: '#444', strokeWidth: 2 },
    }));

    // 2. Compute Layout & Sanitize
    const layoutNodes = computeLayout(rawNodes, rawEdges).map(sanitizeNode);
    
    setNodes(layoutNodes);
    setEdges(rawEdges);
    setIsReady(true);

    // Initial Fit (Only if we have nodes)
    if (layoutNodes.length > 0) {
        setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 50);
    }
  }, [data]);

  // --- INTERACTIONS ---
  const handleNodeClick = useCallback((_: any, node: Node) => {
      setSelectedId(node.id);
      onOpenSidebar(node.id);
      setCenter(node.position.x + 140, node.position.y + 90, { zoom: 1.1, duration: 1200 });
  }, [onOpenSidebar, setCenter]);

  return (
    // Explicit 100% size ensures parent flexbox doesn't collapse it to 0 height
    <div style={{ width: '100%', height: '100%', background: '#050505', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={() => setSelectedId(null)}
        nodeTypes={nodeTypes}
        minZoom={0.1}
        maxZoom={2}
        // Wait until ready to render background to avoid NaN errors on first paint
        nodesDraggable={false} 
        proOptions={{ hideAttribution: true }}
      >
        {isReady && <Background color="#1a1a1a" gap={40} size={1} />}
        
        <Panel position="bottom-center" className="mb-10">
            <div className="flex items-center gap-1 p-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
                 <button onClick={() => setShowSearch(!showSearch)} className="p-3 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-colors"><Search className="w-5 h-5" /></button>
                 <div className="w-px h-6 bg-white/10 mx-2" />
                 <button onClick={() => { setSelectedId(null); fitView({ duration: 800 }); }} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold text-xs uppercase tracking-widest border border-white/5"><RotateCcw className="w-3 h-3" /> Reset</button>
                 <div className="w-px h-6 bg-white/10 mx-2" />
                 <button onClick={() => zoomOut()} className="p-3 hover:bg-white/10 rounded-xl text-white/50 hover:text-white"><Minus className="w-4 h-4" /></button>
                 <button onClick={() => zoomIn()} className="p-3 hover:bg-white/10 rounded-xl text-white/50 hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
        </Panel>

        <AnimatePresence>
            {showSearch && (
                <Panel position="top-center" className="mt-8">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-black/90 p-2 rounded-xl border border-white/10">
                        <input autoFocus placeholder="Search..." className="bg-transparent text-white outline-none px-2 py-1 w-64" onChange={(e) => {
                             const target = nodes.find(n => n.data.label.toLowerCase().includes(e.target.value.toLowerCase()));
                             if(target) setCenter(target.position.x, target.position.y, { zoom: 1.2, duration: 500 });
                        }}/>
                    </motion.div>
                </Panel>
            )}
        </AnimatePresence>
      </ReactFlow>
    </div>
  );
}