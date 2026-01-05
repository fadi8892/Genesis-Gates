"use client";

import React from "react";
import { 
  ArrowLeft, Calendar, MapPin, Share2, 
  Printer, Edit3, User, Heart, 
  Baby, ScrollText, Users
} from "lucide-react";
import type { GraphData } from "./graph/types";

// --- HELPERS ---
const getPerson = (data: GraphData, id: string) => data.nodes.find(n => n.id === id);
const getRelatives = (data: GraphData, id: string) => {
    const parents: any[] = [];
    const children: any[] = [];
    const spouses: any[] = [];

    data.edges.forEach(e => {
        if (e.target === id) parents.push(getPerson(data, e.source));
        if (e.source === id) children.push(getPerson(data, e.target));
        // Simple spouse logic: if share children or explicit link (simplified)
    });
    return { parents, children, spouses };
};

const resolveName = (n: any) => {
    if(!n) return "Unknown";
    return n.data?.label || n.data?.displayName || n.data?.name || "Unnamed";
};

export default function PersonProfile({ data, personId, onBack, onSelect }: { 
  data: GraphData; 
  personId: string; 
  onBack: () => void;
  onSelect: (id: string) => void;
}) {
  const person = getPerson(data, personId);
  const relatives = getRelatives(data, personId);
  if (!person) return null;

  const d = person.data || {};
  const accent = d.accent || "#3b82f6";

  // Mock timeline events based on basic data
  const events = [
    { year: d.born_year || '????', title: "Birth", desc: d.birthPlace || "Unknown Location", icon: Baby },
    // You can add more events from your JSONB data here
    ...(d.events || []), 
    { year: d.died_year || 'Present', title: d.died_year ? "Death" : "Living", desc: d.deathPlace || "", icon: Heart },
  ];

  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar">
      
      {/* --- 1. HERO HEADER --- */}
      <div className="relative h-64 bg-gradient-to-b from-zinc-800 to-[#0a0a0a] border-b border-white/10">
         <div className="absolute top-4 left-4">
             <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white font-bold transition-all">
                <ArrowLeft size={16} /> Back to Tree
             </button>
         </div>
         
         <div className="container mx-auto max-w-5xl h-full flex items-end px-8 pb-8 gap-8">
             {/* Portrait */}
             <div className="w-40 h-40 rounded-full border-4 border-[#0a0a0a] bg-zinc-800 shadow-2xl flex items-center justify-center overflow-hidden shrink-0 relative -bottom-12">
                 {d.photos && d.photos[0] ? (
                    <img src={d.photos[0]} className="w-full h-full object-cover" />
                 ) : (
                    <User size={64} className="text-white/20" />
                 )}
             </div>
             
             {/* Info */}
             <div className="mb-2 flex-1">
                 <h1 className="text-4xl font-bold text-white mb-2">{resolveName(person)}</h1>
                 <div className="flex items-center gap-4 text-white/60 text-sm font-mono">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {d.born_year || '?'} — {d.died_year || 'Present'}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {d.birthPlace || 'Location not set'}</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 text-xs uppercase tracking-wider">Great-Grandfather</span>
                 </div>
             </div>

             {/* Actions */}
             <div className="flex gap-2 mb-4">
                 <button className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg transition-transform hover:scale-105"><Edit3 size={18} /></button>
                 <button className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"><Printer size={18} /></button>
                 <button className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"><Share2 size={18} /></button>
             </div>
         </div>
      </div>

      {/* --- 2. MAIN CONTENT --- */}
      <div className="container mx-auto max-w-5xl mt-16 px-8 grid grid-cols-12 gap-12 pb-20">
         
         {/* LEFT COL: FACTS & SOURCES (8 cols) */}
         <div className="col-span-8 space-y-10">
             
             {/* Tabs */}
             <div className="flex border-b border-white/10 mb-8">
                 {['LifeStory', 'Facts', 'Gallery', 'Hints'].map((tab, i) => (
                     <button key={tab} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${i===1 ? 'border-indigo-500 text-white' : 'border-transparent text-white/40 hover:text-white'}`}>
                        {tab} {i===3 && <span className="ml-1 bg-green-500 text-black text-[10px] px-1.5 rounded-full">6</span>}
                     </button>
                 ))}
             </div>

             {/* Timeline Section */}
             <section>
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ScrollText size={20} className="text-indigo-400"/> Timeline</h3>
                 <div className="relative border-l-2 border-white/10 ml-3 space-y-8 pb-10">
                     {events.map((ev, i) => (
                         <div key={i} className="relative pl-8 group">
                             {/* Dot */}
                             <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#0a0a0a] border-2 border-white/20 group-hover:border-indigo-500 group-hover:bg-indigo-500/20 transition-colors" />
                             
                             <div className="bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors">
                                 <div className="flex justify-between items-start mb-1">
                                     <span className="font-bold text-lg text-white">{ev.year}</span>
                                     <span className="text-xs font-bold uppercase tracking-wider text-white/30">Age {i * 24}</span>
                                 </div>
                                 <div className="font-bold text-indigo-200 mb-1">{ev.title}</div>
                                 <div className="text-sm text-white/50">{ev.desc}</div>
                             </div>
                         </div>
                     ))}
                 </div>
             </section>

             {/* Sources Section */}
             <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><ScrollText size={20} className="text-green-400"/> Sources</h3>
                    <button className="text-xs font-bold text-white/40 hover:text-white uppercase">+ Add</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {[1910, 1920, 1930, 1940].map(year => (
                        <div key={year} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg hover:border-white/20 cursor-pointer transition-colors">
                            <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center font-serif font-bold text-white/20">Census</div>
                            <div>
                                <div className="font-bold text-sm text-white">{year} US Federal Census</div>
                                <div className="text-xs text-white/40">Official Record</div>
                            </div>
                        </div>
                    ))}
                </div>
             </section>
         </div>

         {/* RIGHT COL: FAMILY SIDEBAR (4 cols) */}
         <div className="col-span-4 space-y-8">
             <section>
                 <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Users size={20} className="text-orange-400"/> Family</h3>
                 
                 {/* Parents */}
                 <div className="mb-6">
                     <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Parents</div>
                     <div className="space-y-2">
                         {relatives.parents.map(p => p && (
                             <div key={p.id} onClick={() => onSelect(p.id)} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                                 <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                                     {p.data?.photos?.[0] ? <img src={p.data.photos[0]} className="w-full h-full object-cover"/> : p.data.label.charAt(0)}
                                 </div>
                                 <div>
                                     <div className="font-bold text-sm text-white">{resolveName(p)}</div>
                                     <div className="text-xs text-white/40">{p.data.born_year || '?'} — {p.data.died_year || '?'}</div>
                                 </div>
                             </div>
                         ))}
                         {relatives.parents.length === 0 && <div className="text-white/20 text-sm italic">No parents listed</div>}
                     </div>
                 </div>

                 {/* Spouse & Children */}
                 <div>
                     <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Spouse & Children</div>
                     <div className="space-y-2">
                         {relatives.children.map(c => c && (
                             <div key={c.id} onClick={() => onSelect(c.id)} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors ml-4 border-l border-white/10">
                                 <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs overflow-hidden">
                                     {c.data?.photos?.[0] ? <img src={c.data.photos[0]} className="w-full h-full object-cover"/> : c.data.label.charAt(0)}
                                 </div>
                                 <div>
                                     <div className="font-bold text-sm text-white">{resolveName(c)}</div>
                                     <div className="text-xs text-white/40">{c.data.born_year || '?'}</div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>

             </section>
         </div>
      </div>

    </div>
  );
}