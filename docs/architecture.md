# Architecture

MCP Compliance Scan uses a local SQL ledger as the source of truth. The project models relationships as typed graph edges, but it does not require a graph database.

## Storage Model

- **Canonical storage:** SQLite audit ledger in `.local/audit/compliance.db`.
- **Public schema:** `schema/audit-ledger.sql`.
- **Graph model:** typed entity-edge projection stored in SQL tables.
- **Graph exports:** JSON, Markdown, Mermaid, and DOT/Graphviz.
- **Graph database dependency:** none.

The default deployment should stay local-first and SQL-backed. A graph database should only be considered if repeated deep traversal workloads become awkward or expensive with SQL indexes and recursive CTEs.

## Facts, Inference, And Prose

Audit data must keep these categories separate:

| Category | Example | Authority |
| --- | --- | --- |
| Fact | `audit_run` found `finding` | Deterministic scanner and persisted ledger |
| Fact | `finding` `VIOLATES_CONTROL` `standard_control` | Standards mapping rules |
| Inference | `finding` `BLOCKS` another `finding` | Deterministic priority/rule layer |
| Inference | priority band and remediation order | Deterministic scoring and dependency rules |
| Prose | executive summary or remediation wording | Report formatter, human author, or optional sampling |

Generated prose can explain facts and inferences. It must not overwrite facts, severity, priority, standards mappings, or audit history.

## Edge Semantics

| Edge | From | To | Persistence | Meaning |
| --- | --- | --- | --- | --- |
| `AFFECTS_COMPONENT` | finding | component | fact | The finding affects this repository component. |
| `VIOLATES_CONTROL` | finding | standard control | fact | The finding maps to this standards control. |
| `BLOCKS` | finding | finding | inference | The source finding should be remediated before the target finding can be considered fully closed. |
| `AMPLIFIES` | finding | finding | inference | The source finding increases the impact or urgency of the target finding. |
| `SHARES_ROOT_CAUSE_WITH` | finding | finding | inference | The findings appear to come from the same deterministic rule or root cause. |

Edge contracts should stay narrow. Do not add vague edge types that cannot be validated or explained.

## Rule Layer

The useful intelligence is in deterministic rules, not in graph traversal alone. The current rule layer does three jobs:

- maps findings to standards controls
- computes priority from severity, exposure, asset criticality, confidence, and dependency impact
- infers remediation-order edges such as `BLOCKS` and `AMPLIFIES`

Start with TypeScript rule packs because they are easy to test and audit. Evaluate Datalog only if rule composition becomes difficult to maintain with TypeScript.

## Export Boundary

The graph can be exported for review, reporting, and website visualization:

```bash
# MCP tool
repository_impact_graph(outputFormat: "json")
repository_impact_graph(outputFormat: "mermaid")
repository_impact_graph(outputFormat: "dot")
```

Exports are projections over the SQL ledger. They are not a separate source of truth.
