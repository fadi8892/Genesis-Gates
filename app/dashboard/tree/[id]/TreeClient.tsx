"use client";

import React, { useCallback, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import Link from "next/link"; 
import GraphView from "./graph/GraphView";
import HierarchyEditor from "./HierarchyEditor"; 
import PersonProfile from "./PersonProfile"; // <--- Import New Component
import type { GraphData } from "./graph/types";
import { useFocusGraph } from "./useFocusMode"; 
import { LayoutList, GitGraph, Home, User, Bell, Search, Menu } from "lucide-react"; 

type Props = { treeId: string; initialData: GraphData; };

export default function TreeClient({ treeId, initialData }: Props) {
  // Added 'profile' mode
  const [mode, setMode] = useState<"editor" | "view" | "profile">("editor"); 
  const [data, setData] = useState<GraphData>(initialData);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);

  const focusData = useFocusGraph(data, activePersonId);
  
  // Decide what graph data to show
  const graphDataToRender = mode === 'view' ? data : (activePersonId ? focusData : { nodes: [], edges: [] });

  const handleSelectPerson = useCallback((id: string) => {
    setActivePersonId(id);
    // If we are in 'profile' mode, we stay there but switch person.
    // If in editor/view, we just focus the node.
  }, []);

  const goToProfile = () => {
      if (activePersonId) setMode('profile');
  };

  return (
    <div className="h-screen w-screen bg-[#050505] flex flex-col font-sans text-white overflow-hidden">
      
      {/* --- 1. GLOBAL TOP TOOLBAR (The App Shell) --- */}
      <header className="h-16 flex-shrink-0 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-4 z-50">
          {/* LEFT: Logo & Home */}
          <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform">G</div>
                  <span className="font-bold text-lg tracking-tight group-hover:text-indigo-400 transition-colors">Genesis</span>
              </Link>
              <div className="h-6 w-px bg-white/10 mx-2" />
              <div className="flex items-center gap-2 text-sm text-white/50">
                  <Home size={16} />
                  <span>/</span>
                  <span className="text-white">My Family Tree</span>
              </div>
          </div>

          {/* CENTER: Mode Switcher */}
          {mode !== 'profile' && (
            <div className="absolute left-1/2 -translate-x-1/2 flex gap-1 bg-white/5 p-1 rounded-lg">
                <button 
                    onClick={() => setMode('editor')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'editor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                >
                    <LayoutList size={14} /> Editor
                </button>
                <button 
                    onClick={() => setMode('view')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'view' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                >
                    <GitGraph size={14} /> View
                </button>
            </div>
          )}

          {/* RIGHT: User Profile & Tools */}
          <div className="flex items-center gap-4">
             <button className="p-2 text-white/50 hover:text-white transition-colors"><Search size={18} /></button>
             <button className="p-2 text-white/50 hover:text-white transition-colors"><Bell size={18} /></button>
             <div className="h-6 w-px bg-white/10" />
             <button className="flex items-center gap-3 pl-2 pr-4 py-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <User size={16} className="text-white" />
                 </div>
                 <div className="text-left hidden sm:block">
                     <div className="text-xs font-bold text-white">John Doe</div>
                     <div className="text-[10px] text-white/50">Pro Member</div>
                 </div>
             </button>
          </div>
      </header>

      {/* --- 2. MAIN WORKSPACE --- */}
      <div className="flex-1 flex overflow-hidden relative">
          
          {/* FULL SCREEN PROFILE MODE */}
          {mode === 'profile' && activePersonId ? (
              <div className="absolute inset-0 z-40 bg-[#0a0a0a]">
                  <PersonProfile 
                    data={data} 
                    personId={activePersonId} 
                    onBack={() => setMode('editor')} 
                    onSelect={setActivePersonId} // Clicking relative switches profile
                  />
              </div>
          ) : (
              // GRAPH & EDITOR MODE
              <>
                {/* LEFT: Hierarchy Editor */}
                <div className={`
                    flex-shrink-0 border-r border-white/10 bg-[#0a0a0a] transition-all duration-300 ease-in-out flex flex-col
                    ${mode === 'editor' ? 'w-[320px] translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
                `}>
                    <div className="p-4 border-b border-white/10 bg-[#0a0a0a]">
                        <h2 className="font-bold text-sm uppercase tracking-widest text-white/50">Directory</h2>
                    </div>
                    <div className="flex-1 overflow-hidden p-2">
                        <HierarchyEditor 
                            data={data} 
                            onSelect={handleSelectPerson} 
                            onAdd={() => {}} 
                            onDelete={() => {}} 
                        />
                    </div>
                </div>

                {/* CENTER: Graph Canvas */}
                <div className="flex-1 relative bg-black">
                        {mode === 'editor' && !activePersonId ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 gap-4">
                                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5">
                                    <LayoutList size={40} className="opacity-50" />
                                </div>
                                <p>Select a person to start editing</p>
                            </div>
                        ) : (
                            <ReactFlowProvider>
                                <GraphView 
                                    key={mode + (activePersonId || 'root')} 
                                    data={graphDataToRender as GraphData} 
                                    onOpenSidebar={handleSelectPerson} 
                                />
                            </ReactFlowProvider>
                        )}
                </div>
              </>
          )}

          {/* INSPECTOR (Floating Sidebar for quick actions) */}
          {activePersonId && mode !== 'profile' && (
             <div className="absolute top-4 right-4 bottom-4 w-80 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right-4">
                 {/* Inspector Content... */}
                 <div className="p-6 flex-1">
                      <div className="text-center mb-6">
                          <div className="w-20 h-20 mx-auto bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold mb-3 shadow-lg border-4 border-[#121212]">
                             {data.nodes.find(n => n.id === activePersonId)?.data?.label?.charAt(0)}
                          </div>
                          <h3 className="font-bold text-xl">{data.nodes.find(n => n.id === activePersonId)?.data?.label}</h3>
                          <div className="text-white/40 text-xs mt-1">ID: {activePersonId.slice(0,6)}</div>
                      </div>

                      <button 
                        onClick={goToProfile} 
                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                         <User size={18} /> View Full Profile
                      </button>
                 </div>
             </div>
          )}
      </div>
    </div>
  );
}