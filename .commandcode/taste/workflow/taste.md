# Workflow

- Inspects the existing repository/architecture first and reuses existing infrastructure instead of recreating it; explicitly never blindly overwrites existing files. Confidence: 0.9
- For large features, wants an explicit phased/incremental implementation order that stays compatible with the existing codebase at each stage. Confidence: 0.75
- Requests a plan and resolved the key architectural forks (tech choices, package layout, scope) before implementation begins. Confidence: 0.7
- Expects real end-to-end runtime verification that features actually work (exercising the real UI/interactions, not just API-level checks) rather than an unverified "done" claim. Confidence: 0.65
