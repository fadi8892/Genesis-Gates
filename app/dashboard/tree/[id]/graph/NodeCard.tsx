import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { MapPin } from "lucide-react";

export const NodeCard = memo(({ data, selected }: NodeProps<any>) => {
  const safeData = data || {};
  const accent = safeData.accent || "#3b82f6";

  return (
    <div 
      className={`
        relative group w-[280px] transition-all duration-300 ease-out
        ${selected ? 'scale-110 z-50' : 'scale-100 z-0'}
      `}
    >
      <div 
        className={`
          rounded-xl overflow-hidden border-2 transition-all duration-300
          ${selected 
            ? 'bg-zinc-900 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.5)]' 
            : 'bg-[#1a1a1a] border-[#333] hover:border-[#555] shadow-lg'
          }
        `}
      >
        {/* High Contrast Color Strip */}
        <div className="h-2 w-full" style={{ background: accent }} />

        <div className="p-4 flex gap-4 items-center">
          {/* Larger, Clearer Avatar */}
          <div className="relative shrink-0">
             <div 
               className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2 border-white/10 shadow-inner bg-black/20" 
               style={{ color: accent }}
             >
                {safeData.label?.charAt(0) || "?"}
             </div>
          </div>

          {/* Large, Readable Text */}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg truncate text-white tracking-wide">
              {safeData.label}
            </h3>
            {/* Year is critical for older users to differentiate 'John Smith's */}
            <div className="text-sm text-zinc-400 font-medium mt-1">
              {safeData.born_year || '????'} — {safeData.died_year || '????'}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONNECTORS (Hidden visually, but placed perfectly) --- */}
      {/* Parents attach to Top */}
      <Handle 
        type="target" 
        position={Position.Top} 
               className="!w-3 !h-3 !opacity-100 !-top-3 !rounded-full !border-2 !border-[#0c0c0c] shadow-lg"
        style={{ background: accent }}
      />
      {/* Spouse / lateral connectors (kept subtle for now) */}
      <Handle 
        type="source" 
        position={Position.Left} 
        className="!w-2.5 !h-2.5 !opacity-60 !-left-3 !rounded-full !border-2 !border-[#0c0c0c]"
        style={{ background: `${accent}99` }}
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        className="!w-2.5 !h-2.5 !opacity-60 !-right-3 !rounded-full !border-2 !border-[#0c0c0c]"
        style={{ background: `${accent}99` }}
      />
      {/* Children attach to Bottom */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !opacity-100 !-bottom-3 !rounded-full !border-2 !border-[#0c0c0c] shadow-lg" 
        style={{ background: accent }}
    </div>
  );
});

NodeCard.displayName = "NodeCard";