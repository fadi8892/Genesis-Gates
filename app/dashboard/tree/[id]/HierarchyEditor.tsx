import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Trash2, User } from "lucide-react";
import type { GraphData } from "./graph/types";

type Props = {
  data: GraphData;
  onSelect: (id: string) => void;
  onAdd: (parentId: string | null) => void;
  onDelete: (id: string) => void;
};

// --- Name Resolver Helper ---
const getName = (node: any) => {
    if (!node) return "Unknown";
    const d = node.data || {}; // Check JSONB
    return d.label || d.displayName || d.name || node.label || "Unnamed";
};

const TreeItem = ({ node, childrenNodes, depth, onSelect, onAdd, onDelete }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = childrenNodes.length > 0;
  
  // Use the helper to get the name
  const displayName = getName(node);

  return (
    <div className="select-none">
      <div 
        className="group flex items-center gap-2 py-2 px-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`p-1 rounded hover:bg-white/10 ${hasChildren ? 'opacity-100' : 'opacity-0'}`}
        >
          {isOpen ? <ChevronDown size={14} className="text-white/50" /> : <ChevronRight size={14} className="text-white/50" />}
        </button>

        <User size={16} className="text-indigo-400" />
        <span className="text-sm font-medium text-white/90 truncate flex-1">{displayName}</span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
           <button onClick={(e) => { e.stopPropagation(); onAdd(node.id); }} className="p-1.5 hover:bg-indigo-500/20 text-indigo-400 rounded">
             <Plus size={14} />
           </button>
           <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded">
             <Trash2 size={14} />
           </button>
        </div>
      </div>

      {isOpen && childrenNodes.map((child: any) => (
        <TreeItem 
          key={child.node.id} 
          node={child.node} 
          childrenNodes={child.children} 
          depth={depth + 1} 
          onSelect={onSelect}
          onAdd={onAdd}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default function HierarchyEditor({ data, onSelect, onAdd, onDelete }: Props) {
  const buildTree = () => {
    const nodeMap = new Map(data.nodes.map(n => [n.id, { node: n, children: [] }]));
    const roots: any[] = [];
    
    // Ensure edges have source/target mapped correctly
    data.edges.forEach(edge => {
      const parent = nodeMap.get(edge.source);
      const child = nodeMap.get(edge.target);
      if (parent && child) {
        parent.children.push(child);
      }
    });

    data.nodes.forEach(n => {
      const isChild = data.edges.some(e => e.target === n.id);
      if (!isChild) roots.push(nodeMap.get(n.id));
    });

    return roots;
  };

  const tree = buildTree();

  return (
    <div className="h-full overflow-y-auto pr-2 pb-20">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Hierarchy</h3>
        <button onClick={() => onAdd(null)} className="flex items-center gap-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded">
           <Plus size={12} /> NEW ROOT
        </button>
      </div>

      <div className="space-y-0.5">
        {tree.map((root: any) => (
          <TreeItem 
            key={root.node.id} 
            node={root.node} 
            childrenNodes={root.children} 
            depth={0} 
            onSelect={onSelect} 
            onAdd={onAdd}
            onDelete={onDelete}
          />
        ))}
        {tree.length === 0 && (
          <div className="text-center py-10 text-white/30 text-sm">
             No people found.
          </div>
        )}
      </div>
    </div>
  );
}