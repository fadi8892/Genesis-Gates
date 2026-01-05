'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Calendar, MapPin } from 'lucide-react';
import { FamilyMemberData } from '@/types/family';
import { cn } from '@/lib/utils'; // Ensure you have this helper or use standard string concat

interface MemberSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  memberData: FamilyMemberData | null;
  onSave: (data: FamilyMemberData) => void;
}

export default function MemberSidebar({ isOpen, onClose, memberData, onSave }: MemberSidebarProps) {
  const [formData, setFormData] = useState<FamilyMemberData | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (memberData) {
      setFormData({ 
        ...memberData, 
        lifeEvents: memberData.lifeEvents || [],
        photos: memberData.photos || [] 
      });
    }
  }, [memberData]);

  const handleSave = () => { if (formData) onSave(formData); };
  const updateField = (field: keyof FamilyMemberData, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  if (!formData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          
          {/* Sidebar */}
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-4 top-4 bottom-4 w-full max-w-[400px] bg-[#121212]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">Inspector</span>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X className="w-4 h-4 text-white/70" /></button>
            </div>

            {/* Scroll Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Profile Header */}
              <div className="text-center">
                 <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-accent/20 to-purple-500/20 p-1 mb-4 relative group cursor-pointer">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black">
                        {formData.photos?.[0] ? (
                            <img src={formData.photos[0]} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-accent">{formData.label.charAt(0)}</div>
                        )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                        <span className="text-xs text-white font-medium">Change</span>
                    </div>
                 </div>
                 <input 
                   className="w-full bg-transparent text-2xl font-bold text-center text-white focus:outline-none placeholder:text-white/20"
                   value={formData.label}
                   onChange={e => updateField('label', e.target.value)}
                   placeholder="Name"
                 />
                 <input 
                   className="w-full bg-transparent text-sm text-center text-accent font-medium focus:outline-none placeholder:text-accent/50 mt-1"
                   value={formData.role || ''}
                   onChange={e => updateField('role', e.target.value)}
                   placeholder="Relationship Role"
                 />
              </div>

              {/* iOS Style Segmented Control */}
              <div className="bg-white/5 p-1 rounded-lg grid grid-cols-3 gap-1">
                {['details', 'gallery', 'timeline'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "py-1.5 text-xs font-medium capitalize rounded-md transition-all",
                            activeTab === tab ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        {tab}
                    </button>
                ))}
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                {activeTab === 'details' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                        <div className="group">
                            <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase mb-2"><Calendar className="w-3 h-3"/> Birth Date</label>
                            <input 
                                type="date" 
                                value={formData.birthDate || ''} 
                                onChange={e => updateField('birthDate', e.target.value)}
                                className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/10 transition-colors border-none rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                            />
                        </div>
                        <div className="group">
                            <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase mb-2"><MapPin className="w-3 h-3"/> Birth Place</label>
                            <input 
                                type="text"
                                value={formData.birthPlace || ''} 
                                onChange={e => updateField('birthPlace', e.target.value)}
                                placeholder="e.g. London, UK"
                                className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/10 transition-colors border-none rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <button 
                            onClick={() => {
                                const url = prompt("Enter Image URL:");
                                if(url) updateField('photos', [...(formData.photos||[]), url]);
                            }}
                            className="w-full py-8 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/40 hover:text-accent hover:border-accent/50 transition-colors mb-4"
                        >
                            <Plus className="w-6 h-6 mb-2 opacity-50"/>
                            <span className="text-xs font-medium">Add Photo URL</span>
                        </button>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {formData.photos?.map((url, i) => (
                                <div key={i} className="aspect-square rounded-lg overflow-hidden relative group">
                                    <img src={url} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={() => updateField('photos', formData.photos?.filter((_, idx) => idx !== i))}
                                            className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 text-white"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20">
              <button 
                onClick={handleSave} 
                className="w-full py-3.5 bg-accent hover:bg-accent-hover active:scale-95 transition-all text-[#050505] font-bold rounded-xl text-sm shadow-[0_0_20px_-5px_var(--accent)]"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}