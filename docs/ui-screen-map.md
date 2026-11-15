> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# UI Screen Map (Phase 1)

Mobile-first. Bottom nav: **Home · My Journey · Chat · Profile** (Games disabled placeholder).

## Screens

1. **Landing** — brand hero “RailBandhan”, CTA Create account / Sign in
2. **Signup / Login** — email+password; optional Google
3. **Onboarding — Private details** — name, age, gender + privacy explanation
4. **Onboarding — Anonymous profile** — handle suggestion `Passenger_XXXX`, avatar
5. **Add journey** — Upload ticket | Enter manually
6. **Manual journey form** — train number, date, from, to (+ optional fields)
7. **Ticket upload** — consent copy; PDF/JPG/PNG
8. **Extraction confirm** — editable fields; “We found… Please confirm”
9. **You’re in** — enter journey CTA
10. **Home** — greeting by anonymous handle; my journeys cards; trending posts from authorized journeys only
11. **Journey shell** — header (train, date, route, membership badge); tabs: Live | Community | Chat | Passengers (count stub)
12. **Live** — status, delay, route progress (YOU ARE HERE)
13. **Community** — feed, compose post, comments, like
14. **Chat** — realtime messages, anonymous handles
15. **Restricted** — lock copy; no leak of requested community internals
16. **Profile** — anonymous public view of self; stats stubs
17. **Privacy settings** — discovery, messaging, coach visibility (defaults most private)
18. **Account deletion** — confirm destructive flow

## Visual direction

- Light + dark CSS variables
- Indian travel feel without IRCTC clone: indigo-slate rails, warm accent sparingly
- Low clutter; thumb-friendly; restrained motion (route pulse, tab fade)

## Empty / error states

- OCR fail → offer manual entry
- Unauthorized journey → Restricted screen
- Offline → soft banner; retry
