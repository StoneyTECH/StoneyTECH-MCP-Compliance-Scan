import { ImpactEdgeType, PriorityPlan } from "./priority.js";

export interface EdgeSemantics {
  from: string;
  to: string;
  meaning: string;
  persistence: "fact" | "inference";
}

export type ImpactGraphExportFormat = "markdown" | "json" | "mermaid" | "dot";

export const EDGE_SEMANTICS: Record<ImpactEdgeType, EdgeSemantics> = {
  AFFECTS_COMPONENT: {
    from: "finding",
    to: "component",
    meaning: "The finding affects this repository component.",
    persistence: "fact"
  },
  VIOLATES_CONTROL: {
    from: "finding",
    to: "standard_control",
    meaning: "The finding maps to this standards control.",
    persistence: "fact"
  },
  BLOCKS: {
    from: "finding",
    to: "finding",
    meaning: "The source finding should be remediated before the target finding can be considered fully closed.",
    persistence: "inference"
  },
  AMPLIFIES: {
    from: "finding",
    to: "finding",
    meaning: "The source finding increases the impact or urgency of the target finding.",
    persistence: "inference"
  },
  SHARES_ROOT_CAUSE_WITH: {
    from: "finding",
    to: "finding",
    meaning: "The findings appear to come from the same deterministic rule or root cause.",
    persistence: "inference"
  }
};

export const GRAPH_STORAGE_MODEL = {
  sourceOfTruth: "SQLite audit ledger",
  model: "typed entity-edge projection",
  graphDatabaseRequired: false,
  notes: [
    "Facts and inferred relationships are stored in SQL tables.",
    "Graph views are exports over the ledger, not a requirement for a graph database product.",
    "Deterministic rules create inferred edges; sampled or human-written prose must not become graph fact without validation."
  ]
};

export function formatImpactGraphMarkdown(plan: PriorityPlan, auditRunId: string): string {
  const lines = [
    "# Repository Impact Graph",
    "",
    `Audit run: ${auditRunId}`,
    `Storage: ${GRAPH_STORAGE_MODEL.sourceOfTruth}`,
    `Model: ${GRAPH_STORAGE_MODEL.model}`,
    `Graph database required: ${GRAPH_STORAGE_MODEL.graphDatabaseRequired ? "yes" : "no"}`,
    `Nodes: ${plan.graph.nodes.length}`,
    `Edges: ${plan.graph.edges.length}`,
    "",
    "## Edge Semantics",
    "",
    "| Edge | From | To | Persistence | Meaning |",
    "| --- | --- | --- | --- | --- |",
    ...Object.entries(EDGE_SEMANTICS).map(([edge, semantics]) => `| ${edge} | ${semantics.from} | ${semantics.to} | ${semantics.persistence} | ${semantics.meaning} |`),
    "",
    "## Impact Edges",
    "",
    "| Edge | From | To | Rationale |",
    "| --- | --- | --- | --- |",
    ...plan.graph.edges
      .filter((edge) => edge.type === "BLOCKS" || edge.type === "AMPLIFIES" || edge.type === "SHARES_ROOT_CAUSE_WITH")
      .slice(0, 50)
      .map((edge) => `| ${edge.type} | ${edge.from} | ${edge.to} | ${edge.rationale} |`)
  ];

  return `${lines.join("\n")}\n`;
}

export function formatImpactGraphMermaid(plan: PriorityPlan): string {
  const idMap = new Map(plan.graph.nodes.map((node, index) => [node.id, `n${index}`]));
  const lines = ["flowchart LR"];

  for (const node of plan.graph.nodes) {
    lines.push(`  ${idMap.get(node.id)}["${mermaidLabel(`${node.kind}: ${node.label}`)}"]`);
  }

  for (const edge of plan.graph.edges) {
    const from = idMap.get(edge.from);
    const to = idMap.get(edge.to);
    if (!from || !to) {
      continue;
    }
    lines.push(`  ${from} -- "${edge.type}" --> ${to}`);
  }

  return `${lines.join("\n")}\n`;
}

export function formatImpactGraphDot(plan: PriorityPlan): string {
  const lines = [
    "digraph RepositoryImpactGraph {",
    "  rankdir=LR;",
    "  node [shape=box, style=rounded];"
  ];

  for (const node of plan.graph.nodes) {
    lines.push(`  "${dotEscape(node.id)}" [label="${dotEscape(`${node.kind}: ${node.label}`)}"];`);
  }

  for (const edge of plan.graph.edges) {
    lines.push(`  "${dotEscape(edge.from)}" -> "${dotEscape(edge.to)}" [label="${edge.type}", tooltip="${dotEscape(edge.rationale)}"];`);
  }

  lines.push("}");
  return `${lines.join("\n")}\n`;
}

function mermaidLabel(value: string): string {
  return value.replace(/["\n\r]/g, " ").replace(/\s+/g, " ").trim();
}

function dotEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n");
}
