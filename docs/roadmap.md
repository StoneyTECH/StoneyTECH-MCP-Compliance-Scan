# Roadmap

## Evaluate Deterministic Rule Engines

Status: backlog

Problem: priority, remediation order, and standards inference are currently implemented as TypeScript rules. That is the right default, but the rules may become harder to compose as standards coverage grows.

First probe:

- keep the current TypeScript rule layer as baseline
- model a small subset of priority/remediation rules in Datalog or another deterministic rules engine
- compare readability, testability, explainability, and runtime cost

Acceptance criteria:

- the prototype explains rule decisions at least as clearly as the current TypeScript implementation
- facts and inferences remain separately labeled
- audit outputs remain deterministic and reproducible
- SQLite remains the source of truth
- no graph database dependency is introduced unless SQL-backed traversal fails a concrete benchmark

Non-goal: replacing the SQLite audit ledger with a graph database.
