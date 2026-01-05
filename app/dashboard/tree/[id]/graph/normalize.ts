// app/dashboard/tree/[id]/graph/normalize.ts
import type { DbEdge, DbNode, Edge, PersonNode } from "./types";

function pickString(obj: any, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickSex(obj: any): "M" | "F" | null {
  const v = obj?.sex ?? obj?.gender ?? obj?.Sex ?? obj?.Gender;
  if (typeof v !== "string") return null;
  const s = v.toLowerCase();
  if (s === "m" || s === "male") return "M";
  if (s === "f" || s === "female") return "F";
  return null;
}

export function normalizeNode(n: DbNode): PersonNode {
  const d = n.data ?? {};

  // try common patterns
  const first = pickString(d, ["first_name", "firstName", "fname", "first"]);
  const last = pickString(d, ["last_name", "lastName", "lname", "last"]);
  const full =
    pickString(d, ["full_name", "fullName", "display_name", "displayName", "name", "title"]) ??
    [first, last].filter(Boolean).join(" ").trim();

  const displayName = full && full.length ? full : `Person ${String(n.id).slice(0, 6)}`;

  return {
    id: n.id,
    tree_id: n.tree_id,
    type: n.type,
    displayName,
    sex: pickSex(d),
    data: d,
    position_x: n.position_x ?? null,
    position_y: n.position_y ?? null,
  };
}

export function normalizeEdge(e: DbEdge, treeId: string): Edge | null {
  // Support many possible column names:
  const source =
    e.source ??
    e.parent ??
    e.parent_id ??
    e.parentId ??
    e.from ??
    e.from_id ??
    e.fromId ??
    e.src ??
    e.src_id ??
    e.srcId;

  const target =
    e.target ??
    e.child ??
    e.child_id ??
    e.childId ??
    e.to ??
    e.to_id ??
    e.toId ??
    e.dst ??
    e.dst_id ??
    e.dstId;

  if (!source || !target) return null;

  return {
    id: String(e.id ?? `${source}->${target}`),
    tree_id: String(e.tree_id ?? treeId),
    source: String(source),
    target: String(target),
    type: e.type ?? null,
  };
}
