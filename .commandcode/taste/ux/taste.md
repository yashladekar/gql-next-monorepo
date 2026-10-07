# UX Preferences

- Avoids UI flicker for permission-dependent UI; wants permission state loaded/seeded before first paint (skeletons or permission-aware loading states, not "show then hide"). Confidence: 0.8
- Distinguishes two unauthorized-UX patterns deliberately: hide sensitive/admin-only controls, but show restricted discoverable actions as disabled with an explanatory tooltip — and wants the rationale documented. Confidence: 0.8
- Wants unauthorized routes to surface a real 403/Forbidden experience rather than just hiding the nav entry. Confidence: 0.75
- Wants authorization projected through every frontend layer — navigation, routes, pages, components, actions, tables, rows, and fields/projections — so the same app dynamically looks different per user, not merely backed by server-side API checks. Confidence: 0.8
- For optimistic UI updates, never assumes the operation is authorized: applies the optimistic change but rolls it back if server-side authorization fails. Confidence: 0.6
