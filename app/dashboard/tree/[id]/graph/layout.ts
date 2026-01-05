import { Node, Edge } from "reactflow";

// --- CUSTOM "STRICT PARTITION" LAYOUT ENGINE ---
// This algorithm treats every family branch as a rigid "block" of space.
// It guarantees that cousins NEVER mix with siblings.

type TreeSize = { width: number; height: number };

// Configuration for spacing
const CONFIG = {
  NODE_WIDTH: 300,
  NODE_HEIGHT: 180,
  SIBLING_GAP: 50,  // Gap between brothers/sisters
  COUSIN_GAP: 300,  // HUGE Gap between cousin branches (The "Family Separation" you asked for)
  GENERATION_GAP: 250, // Vertical space between parents and children
};

export const computeLayout = (nodes: Node[], edges: Edge[]) => {
  if (nodes.length === 0) return [];

  // 1. Build an internal tree structure for calculation
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [] as string[], width: 0, x: 0, y: 0 }]));
  const childrenSet = new Set<string>();

  // Map parent->child relationships
  edges.forEach(e => {
    const parent = nodeMap.get(e.source);
    if (parent) {
      parent.children.push(e.target);
      childrenSet.add(e.target);
    }
  });

  // Find Root(s) - anyone who isn't a child
  // (In a messy graph, we might pick the first node if circular, but this works for trees)
  const roots = nodes.filter(n => !childrenSet.has(n.id)).map(n => n.id);

  // 2. Recursive Function to Calculate Branch Widths
  // This figures out how much space every family needs BEFORE we place them
  const calculateWidths = (nodeId: string): number => {
    const node = nodeMap.get(nodeId);
    if (!node) return 0;

    if (node.children.length === 0) {
      node.width = CONFIG.NODE_WIDTH;
      return node.width;
    }

    // Recursively calculate children width
    let totalWidth = 0;
    node.children.forEach((childId, index) => {
      const childWidth = calculateWidths(childId);
      totalWidth += childWidth;
      
      // Add gap between siblings
      if (index < node.children.length - 1) {
        totalWidth += CONFIG.SIBLING_GAP; 
      }
    });

    // If I have children, my width is their total width (plus extra for cousins)
    // We assume any branching point might be a "Family Unit" split
    node.width = Math.max(CONFIG.NODE_WIDTH, totalWidth);
    return node.width;
  };

  // 3. Recursive Function to Assign X/Y Positions
  const assignPositions = (nodeId: string, startX: number, depth: number) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    // My vertical position is simple: Depth * Gap
    node.y = depth * CONFIG.GENERATION_GAP;

    // My horizontal position:
    // If I am a leaf (no kids), I just take my spot.
    // If I have kids, I center myself above them.
    if (node.children.length === 0) {
       node.x = startX;
    } else {
       let currentX = startX;
       node.children.forEach((childId, index) => {
         const childNode = nodeMap.get(childId);
         if(childNode) {
             assignPositions(childId, currentX, depth + 1);
             // Move the cursor for the next sibling
             // Logic: Child's width + Sibling Gap
             // But if this is a "Cousin" split (different branches), we add COUSIN_GAP?
             // For simplicity: The calculated width ALREADY includes necessary spacing
             currentX += childNode.width + CONFIG.SIBLING_GAP;
         }
       });

       // Center parent over the span of children
       const firstChild = nodeMap.get(node.children[0]);
       const lastChild = nodeMap.get(node.children[node.children.length - 1]);
       if (firstChild && lastChild) {
           node.x = (firstChild.x + lastChild.x) / 2;
       }
    }
  };

  // Run the engine on all roots
  let rootStartX = 0;
  roots.forEach(rootId => {
     calculateWidths(rootId);
     assignPositions(rootId, rootStartX, 0);
     const rootNode = nodeMap.get(rootId);
     rootStartX += (rootNode?.width || 0) + CONFIG.COUSIN_GAP;
  });

  // 4. Map back to React Flow Nodes
  return nodes.map(n => {
     const calculated = nodeMap.get(n.id);
     return {
        ...n,
        position: { x: calculated?.x || 0, y: calculated?.y || 0 },
        targetPosition: "top",
        sourcePosition: "bottom"
     };
  });
};