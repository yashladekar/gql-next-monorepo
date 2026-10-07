# Code Style & Architecture

- Prefers capability/permission-based authorization checks over hard-coded role checks (e.g. avoid `if (role === "admin")`; prefer `if (permissions.canManageMembers)`). Confidence: 0.9
- Keeps a single source of truth for authorization rules and avoids duplicating authorization logic in multiple places. Confidence: 0.85
- Keeps responsibilities cleanly separated: authentication (who you are) vs authorization (what you may do) vs application data vs client projection. Confidence: 0.85
- Avoids N+1 authorization checks (e.g. 100 resources → 100 checks); prefers batch/collection approaches (ListObjects/BatchCheck) and wants the trade-offs explained. Confidence: 0.8
- Wants a scalable, reusable abstraction (e.g. a single `<Can permission="...">` / permission-gate API used consistently) instead of hundreds of role-specific conditionals. Confidence: 0.8
- Favors typed, strict TypeScript-codebases (types are a first-class concern across schema, authorization, and client). Confidence: 0.7
