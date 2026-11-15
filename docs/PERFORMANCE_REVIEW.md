# Performance review

Measured on 15 November 2026. Measurements refer to this workspace and build, not a deployed production audience.

## Measured improvements

| Item                   |                       Before |                                                               After |                                       Change |
| ---------------------- | ---------------------------: | ------------------------------------------------------------------: | -------------------------------------------: |
| Supplied image set     |             11,595,966 bytes |                                             1,637,576 bytes in WebP |                                85.9% smaller |
| Background train film  |              5,225,135 bytes |                                                     1,307,720 bytes |                                75.0% smaller |
| Image dimensions       | Existing original dimensions |                              Preserved; responsive Next.js delivery |                      Avoids visual upscaling |
| Film                   |  1280 × 720 H.264 with audio |      1280 × 720 H.264, muted background, no audio track, fast-start |           Less transfer and earlier playback |
| Initial public home JS |     Not measured on baseline | Approximately 118 kB first-load JS in the observed production build |        Build estimate, not a CWV measurement |
| Shared first-load JS   |     Not measured on baseline |               Approximately 103 kB in the observed production build | Check final build for exact per-route values |

Original images are retained as source material. The application references the compressed derivatives. Portrait assets are not used to invent passengers. The surreal pass illustration is not presented as an official railway ticket.

## Frontend behavior

Next.js splits routes automatically. Server-rendered public content avoids unnecessary client-only wrappers. Layouts reserve media dimensions. The hero uses a priority poster, `preload="none"` video and user playback control. Reduced-motion and data-saving settings prevent automatic playback; hidden or out-of-view video pauses. Decorative motion uses transform/opacity and is limited to visible content. There is no always-running WebGL scene, virtual scroll engine or animation library bundle on every page.

The UI preserves native scrolling, browser zoom, keyboard focus and semantic forms. The shared dialog uses the native dialog focus trap and restores focus on close. The fixed mobile navigation leaves content clearance and respects safe areas. Images below the fold load through Next.js with responsive sizes.

## Backend and database

- Replace duplicated synchronous database code with one awaited repository and driver adapters.
- Bound PostgreSQL pools and connection/statement execution time.
- Index membership, feed, message, notification, extraction and retention lookups.
- Bound common feed/chat/notification/game responses to a recent window rather than returning unbounded history.
- Aggregate reputation statistics in SQL, replacing repeated full-report and per-room scans after messages.
- Batch reaction reads for community posts and update reputation atomically.
- Bound in-process railway caches and upstream JSON, and retain single-flight/circuit-breaker behavior.
- Stop live-status polling while hidden and cancel requests on unmount.
- Limit local OCR concurrency, image pixels, file bytes, pages and execution time.

## Verification status

A production build completed successfully. The desktop home and help/navigation rendering were inspected in the browser. The browser later became unresponsive, so mobile/ultrawide interaction checks, full authenticated browser journeys and reduced-motion emulation were not completed. Code includes those layout/motion rules, but that is not the same as observing them across devices.

No Lighthouse run, 60 FPS measurement, real-user LCP/INP/CLS sample or load test was obtained. Do not publish invented scores or claim WCAG/CWV certification from these source checks.

## Staging performance gate

1. Run Lighthouse on home, explore, login and an authenticated journey using an actual HTTPS build. Capture reports with device, throttling, hardware, commit and cache state.
2. Measure LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1 at the 75th percentile with real-user monitoring. These are target thresholds, not measured results here.
3. Test 360, 390, 768, 1024, 1440 and 2560 CSS-pixel layouts, 200% zoom, keyboard-only navigation and reduced motion.
4. Run representative authenticated read/write workloads and bursty OCR uploads. Measure p50/p95/p99 latency, error rates, pool wait time, CPU, memory, database locks and cache behavior.
5. Test with Redis unavailable, slow upstream railway responses, slow mobile networks and storage cleanup failures. Protected requests must fail clearly without creating false success or invented telemetry.
6. Set a capacity limit from the measured staging result before choosing replica counts or an availability SLA.
