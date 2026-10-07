# Security

- Never trusts the frontend for security; the server/API must be the real authorization boundary, with frontend checks treated as UX only. Confidence: 0.9
- Requires server-side authorization on every protected operation/mutation, including when a client bypasses the UI and calls the API directly. Confidence: 0.85
- Prevents IDOR: a user must not gain access by changing an ID; unauthorized resource IDs must be rejected server-side, not filtered client-side. Confidence: 0.85
- Never exposes unauthorized sensitive fields — sensitive data must be excluded from the response/projection server-side, never merely hidden with CSS. Confidence: 0.85
