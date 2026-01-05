"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function Viewer({ mode, treeId }: { mode: "demo" | "share"; treeId: string | null }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    (async () => {
      if (mode === "demo") {
        // Local demo graph (no DB)
        setNodes([
          { id: "a", position: { x: 0, y: 0 }, data: { label: "Founder" }, type: "default" },
          { id: "b", position: { x: 220, y: 120 }, data: { label: "Child" }, type: "default" },
        ]);
        setEdges([{ id: "e-a-b", source: "a", target: "b", animated: true }]);
        return;
      }

      if (!treeId) return;

      const mem = await supabase.from("members").select("*").eq("tree_id", treeId);
      const ed = await supabase.from("edges").select("*").eq("tree_id", treeId);

      setNodes((mem.data || []).map((m: any) => ({
        id: m.id,
        position: { x: m.pos_x, y: m.pos_y },
        data: { label: m.label },
        type: "default",
      })));

      setEdges((ed.data || []).map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: { strokeWidth: 2 },
      })));
    })();
  }, [mode, treeId, supabase]);

  return (
    <div className="h-screen w-screen bg-black text-white">
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="font-semibold">{mode === "demo" ? "Demo Tree" : "Viewer"}</div>
        <a href="/" className="text-sm text-white/60 hover:text-white transition">
          Back home →
        </a>
      </div>

      <div className="h-[calc(100vh-64px)]">
        <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false}>
          <Background gap={46} size={1} color="#101010" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
