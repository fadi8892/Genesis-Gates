// components/graph/FamilyNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { User, MapPin, Crown } from 'lucide-react';
import { FamilyMemberData } from '@/types/family';
import { cn } from '@/lib/utils'; // Assuming you have a class merger, if not replace with template literals

const FamilyNode = ({ data, selected }: NodeProps<FamilyMemberData>) => {
  // Use the first photo if available, otherwise fallback
  const avatarUrl = data.photos && data.photos.length > 0 ? data.photos[0] : null;

  return (
    <div 
      className={cn(
        "relative group w-[220px] transition-all duration-300 ease-out",
        "rounded-2xl border backdrop-blur-2xl",
        // Conditional Styling based on Selection
        selected 
          ? "bg-zinc-900/90 border-accent/60 shadow-[0_0_30px_-5px_var(--accent)] scale-105 z-50" 
          : "bg-[#0d1117]/60 border-white/10 shadow-lg hover:border-white/20 hover:bg-[#0d1117]/80"
      )}
    >
      {/* Handles: Hidden by default, reveal on group hover. 
        This cleans up the UI significantly.
      */}
      <Handle 
        type="target" position={Position.Top} 
        className="!w-3 !h-3 !bg-accent !border-2 !border-[#0d1117] !-top-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
      />
      <Handle 
        type="source" position={Position.Bottom} 
        className="!w-3 !h-3 !bg-accent !border-2 !border-[#0d1117] !-bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
      />

      <div className="p-4 flex items-center gap-4">
        {/* Avatar Section */}
        <div className="relative shrink-0">
          <div className={cn(
            "w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center",
            selected ? "border-accent" : "border-white/10 group-hover:border-white/30"
          )}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={data.label} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white/40" />
            )}
          </div>
          {/* Role Badge (Optional) */}
          {data.role === 'root' && (
            <div className="absolute -top-1 -right-1 bg-accent text-black rounded-full p-0.5 border border-[#0d1117]">
               <Crown className="w-2 h-2" />
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="flex flex-col min-w-0">
          <h3 className={cn(
            "font-semibold text-sm truncate leading-tight transition-colors",
            selected ? "text-white" : "text-white/90"
          )}>
            {data.label}
          </h3>
          
          <span className="text-xs text-accent/80 font-medium truncate mb-0.5">
            {data.role || 'Relative'}
          </span>

          {data.birthDate && (
            <span className="text-[10px] text-zinc-500 font-mono tracking-wide">
              {data.birthDate.split('-')[0]}
            </span>
          )}
        </div>
      </div>
      
      {/* Location Footer (Only if location exists) */}
      {data.birthPlace && (
        <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02] flex items-center gap-1.5 rounded-b-2xl">
          <MapPin className="w-3 h-3 text-zinc-500" />
          <span className="text-[10px] text-zinc-400 truncate max-w-full">
            {data.birthPlace}
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(FamilyNode);