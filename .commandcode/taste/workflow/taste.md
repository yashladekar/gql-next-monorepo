# Workflow

- Inspects the existing repository/architecture first and reuses existing infrastructure instead of recreating it; explicitly never blindly overwrites existing files. Confidence: 0.9
- For large features, wants an explicit phased/incremental implementation order that stays compatible with the existing codebase at each stage. Confidence: 0.75
- Requests a plan and resolved the key architectural forks (tech choices, package layout, scope) before implementation begins. Confidence: 0.7
- Expects real end-to-end runtime verification that features actually work (exercising the real UI/interactions, not just API-level checks) rather than an unverified "done" claim; explicitly asks for confirmation that "all the functionality works properly" and treats API-only verification as insufficient. Confidence: 0.7
- Proactively evaluates established open-source projects for a need and asks whether they can be combined/reused rather than building from scratch. Confidence: 0.6
- When scoping a feature, favors the complete feature set (core functionality plus advanced/visual extras) over a minimal first cut. Confidence: 0.55
- Works on a Windows machine with no Docker (and no admin control over existing services); wants projects run natively without Docker — downloading standalone binaries and using system-installed services/alternate ports rather than requiring containers. Confidence: 0.7
