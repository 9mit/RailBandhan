# File review inventory

Generated from the Git checkout on 15 November 2026. 339 present files (309 text, 30 binary). Deleted superseded widgets/configurations are visible in the Git diff.

Every listed file was opened for inventory/content or binary inspection and included in repository-wide pattern/dependency/configuration review. Manual semantic review concentrated on authentication, authorization, HTTP boundaries, uploads, persistence, provider provenance, active UI workflows and deployment paths. The table does not claim an independent line-by-line penetration test of every dependency or exhaustive browser execution of every screen. Generated build output, installed dependencies, runtime data and secrets are excluded.

The active TypeScript source is linted and typechecked. Tests are typechecked separately and execute the relevant domain/security contracts. All 13 supplied images and the video’s beginning/middle/end were visually inspected. Original portrait/pass assets are retained without being represented as real users or official tickets. Historical Supabase/research files are not used to claim production capabilities.

| File                                                                | Format |     Bytes | SHA-256 prefix | Review coverage                                                  |
| ------------------------------------------------------------------- | ------ | --------: | -------------- | ---------------------------------------------------------------- |
| `.dockerignore`                                                     | Text   |       187 | `5cdbed125963` | Source/configuration scan; applicable lint/type/build checks     |
| `.env.example`                                                      | Text   |       781 | `9b433d6622f9` | Source/configuration scan; applicable lint/type/build checks     |
| `.env.production.example`                                           | Text   |     1,166 | `0610bd9f9518` | Source/configuration scan; applicable lint/type/build checks     |
| `.github/dependabot.yml`                                            | Text   |       317 | `989b176423a4` | Source/configuration scan; applicable lint/type/build checks     |
| `.github/workflows/ci.yml`                                          | Text   |     2,292 | `20ead83f55f8` | Source/configuration scan; applicable lint/type/build checks     |
| `.github/workflows/release.yml`                                     | Text   |     1,784 | `af9712689061` | Source/configuration scan; applicable lint/type/build checks     |
| `.gitignore`                                                        | Text   |       780 | `758e12f3c782` | Source/configuration scan; applicable lint/type/build checks     |
| `.vscode/settings.json`                                             | Text   |        42 | `7710565a95d6` | Source/configuration scan; applicable lint/type/build checks     |
| `README.md`                                                         | Text   |     4,031 | `06a3f72db075` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/.env.example`                                             | Text   |       781 | `9b433d6622f9` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/.gitignore`                                               | Text   |       402 | `6815ae0e5d42` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/.vscode/settings.json`                                    | Text   |        42 | `7710565a95d6` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/eslint.config.mjs`                                        | Text   |       649 | `bd41e30be4ce` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/next-env.d.ts`                                            | Text   |       262 | `85ae5aee75f0` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/next.config.ts`                                           | Text   |     1,394 | `03216fdd1309` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/package-lock.json`                                        | Text   |  2,64,371 | `e5e79892c134` | Locked dependency graph; npm production audit                    |
| `apps/web/package.json`                                             | Text   |     1,442 | `12068090b0c1` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/postcss.config.mjs`                                       | Text   |       157 | `efa65c65e17d` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/public/favicon.ico`                                       | Binary |        99 | `8ef0d1fa8c74` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/public/icon-192.png`                                      | Binary |       547 | `2d4900d0924d` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/public/icon-512.png`                                      | Binary |     1,881 | `efbb78611e3b` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/public/images/avatar_traveller_1.jpg`                     | Binary |  7,63,854 | `ba85d5229e35` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/avatar_traveller_1.webp`                    | Binary |    81,972 | `8b8aa1585cbf` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/avatar_traveller_2.jpg`                     | Binary |  7,93,283 | `ad3d10dee9bf` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/avatar_traveller_2.webp`                    | Binary |    78,670 | `1724851eda4c` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/avatar_wanderer.jpg`                        | Binary |  6,75,285 | `4e2357d8e779` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/avatar_wanderer.webp`                       | Binary |    54,944 | `f307f6de328f` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/avatar_you.jpg`                             | Binary |  6,33,982 | `72e583402540` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/avatar_you.webp`                            | Binary |    44,552 | `da365677e754` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/hero_train_window.jpg`                      | Binary |  8,50,339 | `c162a1b3918f` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/hero_train_window.webp`                     | Binary |  1,07,048 | `9abb568c35d9` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/post_railway_chai.jpg`                      | Binary |  7,60,967 | `99935cb08af2` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/post_railway_chai.webp`                     | Binary |    84,888 | `af03d5966b75` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/post_sunset_track.jpg`                      | Binary |  8,07,823 | `e47494e4c468` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/post_sunset_track.webp`                     | Binary |    87,508 | `2bca6f005ac3` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/sidebar_train_scenic.jpg`                   | Binary |  8,79,815 | `a30897b75026` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/sidebar_train_scenic.webp`                  | Binary |  1,13,626 | `f5f43d208329` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/surreal_celestial_junction.jpg`             | Binary | 11,13,667 | `0981492f1ab0` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/surreal_celestial_junction.webp`            | Binary |  2,03,742 | `3c94271b9613` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/surreal_cosmic_train_odyssey.jpg`           | Binary | 11,43,252 | `aed5c8f800c7` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/surreal_cosmic_train_odyssey.webp`          | Binary |  2,23,606 | `bf0466bc082f` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/surreal_holographic_pass.jpg`               | Binary | 11,09,400 | `e89b4b5bf7e1` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/surreal_holographic_pass.webp`              | Binary |  2,06,736 | `430cd6efb213` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/surreal_window_safar.jpg`                   | Binary | 10,74,452 | `37d645f8dd93` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/surreal_window_safar.webp`                  | Binary |  1,92,938 | `b893a531344b` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/travel_promo_banner.jpg`                    | Binary |  9,89,847 | `cc8f8014ceaa` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/images/travel_promo_banner.webp`                   | Binary |  1,57,346 | `5b7dfabb4374` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/public/manifest.webmanifest`                              | Text   |       560 | `b272565d324d` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/public/sw.js`                                             | Text   |     1,250 | `09c1a2fed5c4` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/public/videos/hero_train_journey.mp4`                     | Binary | 13,07,720 | `0918a74290d7` | Visual asset inspected; compressed derivative or retained source |
| `apps/web/src/app/(app)/chat/page.tsx`                              | Text   |     4,345 | `c576692990f9` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/communities/page.tsx`                       | Text   |     3,986 | `bb2c82711657` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/dm/[id]/page.tsx`                           | Text   |    16,553 | `7c00c75c46fe` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/dm/page.tsx`                                | Text   |     1,948 | `cf554f2685d9` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/explore/page.tsx`                           | Text   |     5,166 | `9c658c6425dc` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/games/[id]/page.tsx`                        | Text   |    12,921 | `2d33a223e692` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/games/page.tsx`                             | Text   |    19,565 | `766394b51872` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/help/page.tsx`                              | Text   |     6,480 | `a40a2605431e` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/home/page.tsx`                              | Text   |     9,566 | `cb983c0ce550` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/[id]/chat-panel.tsx`               | Text   |     8,559 | `489c7c69c6dc` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/[id]/community-panel.tsx`          | Text   |    19,413 | `dfa8a9b703e8` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/[id]/live-panel.tsx`               | Text   |     7,852 | `667fb30bf43b` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/[id]/page.tsx`                     | Text   |    12,216 | `646717014542` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/[id]/passengers-panel.tsx`         | Text   |     6,729 | `7a580158f727` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/confirm/[extractionId]/page.tsx`   | Text   |    13,524 | `ad70220ebe27` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/live/page.tsx`                     | Text   |     8,860 | `5eedf6bf4a3b` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/new/manual/page.tsx`               | Text   |    10,558 | `5a8d094838fe` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/new/page.tsx`                      | Text   |     2,556 | `665e1fe381ce` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/new/upload/page.tsx`               | Text   |     6,361 | `bfc49165b4fc` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/page.tsx`                          | Text   |     3,619 | `f282ae77fc03` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/journeys/restricted/page.tsx`               | Text   |     1,797 | `4249e52958e4` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/layout.tsx`                                 | Text   |       509 | `6e1c3af49490` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/loading.tsx`                                | Text   |       534 | `b49885ddefa3` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/moderation/page.tsx`                        | Text   |     6,795 | `e189e8267826` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/notifications/page.tsx`                     | Text   |     8,883 | `50fb04330fcf` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/onboarding/page.tsx`                        | Text   |    13,259 | `999f82473f85` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(app)/profile/page.tsx`                           | Text   |    17,553 | `fe546c9a20e3` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(auth)/login/page.tsx`                            | Text   |       271 | `fb46609068ab` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/(auth)/signup/page.tsx`                           | Text   |       278 | `ab19bfdabc2b` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/health/route.ts`                              | Text   |       785 | `fdfc37462b68` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/account/route.ts`                          | Text   |       887 | `0a87ed42e452` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/admin/railway-health/route.ts`             | Text   |       934 | `939e09d7b9cf` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/auth/login/route.ts`                       | Text   |       136 | `cffbc46bbe89` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/auth/logout/route.ts`                      | Text   |       423 | `a51dfc18574a` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/auth/me/route.ts`                          | Text   |       841 | `8ada273ba0b1` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/auth/refresh/route.ts`                     | Text   |       856 | `32fb81c56838` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/auth/session/route.ts`                     | Text   |       426 | `b87164dab491` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/auth/signup/route.ts`                      | Text   |       142 | `47186f419c9c` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/blocks/route.ts`                           | Text   |     1,647 | `259680174129` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/catalog/trains/route.ts`                   | Text   |       674 | `29f06935d0bf` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/conversations/[id]/messages/route.ts`      | Text   |     1,614 | `04008efe2c56` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/conversations/[id]/route.ts`               | Text   |     1,251 | `614eff62b537` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/conversations/route.ts`                    | Text   |     2,506 | `ed16d287f27b` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/games/[id]/join/route.ts`                  | Text   |       568 | `7d60de462a07` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/games/[id]/move/route.ts`                  | Text   |     1,546 | `f402882eda10` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/games/[id]/route.ts`                       | Text   |       565 | `b4cb5d06e604` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/games/route.ts`                            | Text   |     1,341 | `f86f2e4cbbd4` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/health/route.ts`                           | Text   |        51 | `2a2776729e14` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/home/feed/route.ts`                        | Text   |       491 | `2bcef64eacc8` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/jobs/retention/route.ts`                   | Text   |       349 | `d2eb0e3be559` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/journeys/[id]/games/route.ts`              | Text   |     1,173 | `594123de8f20` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/journeys/[id]/messages/route.ts`           | Text   |     1,394 | `c2e75582c254` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/journeys/[id]/passengers/route.ts`         | Text   |       730 | `db1368a5c679` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/journeys/[id]/polls/route.ts`              | Text   |     1,435 | `8290c96051ab` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/journeys/[id]/posts/route.ts`              | Text   |     2,174 | `6978b3c27dd9` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/journeys/[id]/route.ts`                    | Text   |       728 | `310817655424` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/journeys/[id]/status/route.ts`             | Text   |       636 | `c7e87eee290d` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/journeys/manual/route.ts`                  | Text   |     1,722 | `920faba77a00` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/journeys/route.ts`                         | Text   |     1,308 | `cfc36e925a14` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/metrics/route.ts`                          | Text   |     1,336 | `7c9841e816dd` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/moderation/reports/[id]/route.ts`          | Text   |     1,202 | `35d48e41eae6` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/moderation/reports/route.ts`               | Text   |     1,094 | `258a2a863e6b` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/notifications/[id]/read/route.ts`          | Text   |       763 | `84d5fdacde4e` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/notifications/read-all/route.ts`           | Text   |       418 | `b645214435ef` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/notifications/route.ts`                    | Text   |       674 | `e59df810dd60` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/polls/[id]/vote/route.ts`                  | Text   |       789 | `a1fbde5f76e2` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/posts/[id]/comments/route.ts`              | Text   |     1,706 | `61c39aa41ff8` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/posts/[id]/reactions/route.ts`             | Text   |       985 | `20954109b936` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/profiles/anonymous/[handle]/route.ts`      | Text   |     1,324 | `08da0b4bb0f6` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/profiles/anonymous/route.ts`               | Text   |       825 | `688752df76b1` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/profiles/badges/route.ts`                  | Text   |       573 | `ca96e500e394` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/profiles/me/route.ts`                      | Text   |       939 | `71bd1f2ae1ab` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/profiles/onboarding/route.ts`              | Text   |     1,392 | `76c927cc4f03` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/profiles/privacy/route.ts`                 | Text   |       992 | `5eece7aec607` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/reports/route.ts`                          | Text   |       753 | `c5051b399e3f` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/tickets/extractions/[id]/confirm/route.ts` | Text   |     1,482 | `482add43ce91` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/tickets/extractions/[id]/route.ts`         | Text   |       788 | `e72ad2d37195` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/api/v1/tickets/upload/route.ts`                   | Text   |     1,565 | `cdcd8f02c01a` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/error.tsx`                                        | Text   |       857 | `3edbb7a0ca51` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/globals.css`                                      | Text   |    31,837 | `61c21494416c` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/layout.tsx`                                       | Text   |     1,533 | `f88da2751a15` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/not-found.tsx`                                    | Text   |       544 | `679ee366a656` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/page.tsx`                                         | Text   |       105 | `1fe36863f9d8` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/robots.ts`                                        | Text   |       595 | `181d19ca6a96` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/app/sitemap.ts`                                       | Text   |       267 | `45847cc12edc` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/auth/auth-form.tsx`                        | Text   |     6,462 | `53fec50b674b` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/dashboard/cinematic-hero.tsx`              | Text   |     5,489 | `76f3e3d8e88b` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/motion/reveal.tsx`                         | Text   |     1,019 | `73a50aebc408` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/nav/app-shell.tsx`                         | Text   |     1,696 | `9bb38ae3ca30` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/nav/bottom-nav.tsx`                        | Text   |     1,022 | `83a072a7310b` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/nav/left-sidebar.tsx`                      | Text   |     2,872 | `619374b3c838` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/nav/navigation.tsx`                        | Text   |       999 | `7d9175fa959d` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/nav/top-header.tsx`                        | Text   |     3,239 | `5d6910cf4b39` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/pwa/register-sw.tsx`                       | Text   |     1,061 | `f8da1ca7d807` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/ui/avatar.tsx`                             | Text   |     4,055 | `26d615cec935` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/ui/badge.tsx`                              | Text   |     1,872 | `c0ab9add3db6` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/ui/button-link.tsx`                        | Text   |     1,010 | `0cbb81944190` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/ui/button.tsx`                             | Text   |     3,240 | `e05b7bb63411` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/ui/card.tsx`                               | Text   |     2,021 | `6d16a60ab48f` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/ui/empty-state.tsx`                        | Text   |     1,460 | `a289bf5b28c2` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/ui/input.tsx`                              | Text   |     2,333 | `1966c11be3f2` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/ui/modal.tsx`                              | Text   |     1,704 | `7caa6dfd3d58` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/components/ui/skeleton.tsx`                           | Text   |     2,573 | `3c6c6cd9d03f` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/hooks/use-api-resource.ts`                            | Text   |     1,251 | `4d5fcabbb530` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/instrumentation.ts`                                   | Text   |       487 | `6daa29d7fba5` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/lib/api.ts`                                           | Text   |     2,873 | `2f5094126ddd` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/lib/errors.ts`                                        | Text   |       767 | `7a1279986b87` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/lib/logger.ts`                                        | Text   |     2,159 | `30a2c2d40fbd` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/lib/navigation.ts`                                    | Text   |       441 | `439d36b98df1` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/lib/types.ts`                                         | Text   |     4,557 | `31c5244227cf` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/lib/utils.ts`                                         | Text   |       169 | `d1f1e0d62cb8` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/middleware.ts`                                        | Text   |     3,700 | `74ec0aa20fd9` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/account/service.ts`                            | Text   |     1,024 | `b0281470b807` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/ai/provider.ts`                                | Text   |     5,118 | `087d4516fb0b` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/ai/rag.ts`                                     | Text   |     4,555 | `7848bf596039` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/ai/tools.ts`                                   | Text   |     2,377 | `9d328fc101b1` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/api/serializers.ts`                            | Text   |    14,925 | `fc4ccfff0f50` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/auth/endpoint.ts`                              | Text   |     1,700 | `466903c894a1` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/auth/provider.ts`                              | Text   |     1,403 | `85c56c496ccd` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/auth/session.ts`                               | Text   |     8,495 | `575763997db4` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/authz/membership.ts`                           | Text   |     1,100 | `877adc19b2ad` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/authz/relationships.ts`                        | Text   |     2,077 | `215f4f2fe6d9` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/cache/resilient-cache.ts`                      | Text   |     2,954 | `7e68ae20dad7` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/chat/service.ts`                               | Text   |     1,952 | `a36c07ec2473` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/community/service.ts`                          | Text   |     5,555 | `a97393394a45` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/config.ts`                                     | Text   |     1,697 | `a8a8b53a5da5` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/crypto/pnr.ts`                                 | Text   |       757 | `7b1d01995f81` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/discovery/service.ts`                          | Text   |     1,646 | `2323eaa23aa1` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/dm/service.ts`                                 | Text   |     7,556 | `bc991a8c9eb2` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/domain/types.ts`                               | Text   |     6,430 | `0c54ddb26fac` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/games/engine.ts`                               | Text   |    11,668 | `914d21216eca` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/games/ludo.ts`                                 | Text   |     6,419 | `a63d6ef4dbbb` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/games/types.ts`                                | Text   |       672 | `fbb8ed7fe1f3` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/http.ts`                                       | Text   |     4,240 | `acc1a7f32bd4` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/jobs/retention.ts`                             | Text   |     2,650 | `96e0a9532a75` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/journeys/service.ts`                           | Text   |     7,366 | `25b82dd3fc59` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/moderation/service.ts`                         | Text   |     3,427 | `fb2285257619` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/moderation/spam-detector.ts`                   | Text   |     2,094 | `bda805a3d272` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/notifications/service.ts`                      | Text   |     1,436 | `a5dd60d08edb` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/operations.ts`                                 | Text   |       575 | `3a39c69c1d0c` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/outbound.ts`                                   | Text   |       854 | `817fd5a3d489` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/polls/service.ts`                              | Text   |     4,309 | `a997dbe1c779` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/profiles/service.ts`                           | Text   |     7,213 | `b78dce1452fd` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/eta-engine.ts`                         | Text   |     4,589 | `bce1e4f48335` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/graph.ts`                              | Text   |    12,029 | `2ddab51b8c30` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/normalizer.ts`                         | Text   |     8,337 | `12e1ee5fa287` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/observability.ts`                      | Text   |     4,157 | `7f76297d4fef` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/position-engine.ts`                    | Text   |     5,591 | `090eca83d9db` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/providers/base.ts`                     | Text   |       507 | `26008231e7ac` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/providers/deterministic.ts`            | Text   |     5,455 | `96d835e62e1f` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/providers/mock.ts`                     | Text   |     1,193 | `977485ae1a53` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/providers/opendata.ts`                 | Text   |     2,585 | `21692130f1cb` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/providers/railradar.ts`                | Text   |     6,210 | `a2f5541faa0a` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/repository.ts`                         | Text   |     4,446 | `5aa2bdab3f82` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/router.ts`                             | Text   |     8,827 | `ca7de481096c` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/service.ts`                            | Text   |     6,363 | `938b5ea9186f` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/stations.ts`                           | Text   |    10,549 | `c515c2fd3a94` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/timetable.ts`                          | Text   |       903 | `22ec5e2b68b3` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/railway/types.ts`                              | Text   |     2,493 | `57f754fded2c` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/rate-limit.ts`                                 | Text   |     2,679 | `ca8486a3ce50` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/realtime/authorizer.ts`                        | Text   |     2,510 | `f9e54a8c7149` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/recommendations/service.ts`                    | Text   |     3,055 | `666eba50664d` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/reputation/service.ts`                         | Text   |     2,287 | `c61172130e7d` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/search/embeddings.ts`                          | Text   |       627 | `7914ff138f90` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/search/service.ts`                             | Text   |     2,793 | `32c4d8189a66` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/store/index.ts`                                | Text   |     1,593 | `94a25c4cd6b9` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/store/memory-store.ts`                         | Text   |    46,817 | `37470d63c5b0` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/store/postgres-config.ts`                      | Text   |     1,231 | `9ddf1bce482e` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/store/postgres-store.ts`                       | Text   |       505 | `6993b462c640` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/store/schema.ts`                               | Text   |    14,392 | `79d7d5fc83bf` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/store/sql-connection.ts`                       | Text   |     4,202 | `28e5b3cc4820` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/store/sql-store.ts`                            | Text   |    75,429 | `1784454dc915` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/store/sqlite-store.ts`                         | Text   |     1,244 | `4d614f0f840f` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/store/types.ts`                                | Text   |    10,429 | `0b5e9fa6621a` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/tickets/ocr-engine.ts`                         | Text   |     3,346 | `391d8f1f1b10` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/tickets/parser.ts`                             | Text   |     7,641 | `10f7128c9eae` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/tickets/preprocessor.ts`                       | Text   |     1,403 | `a74dc60a42b8` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/tickets/service.ts`                            | Text   |     8,977 | `910f3d0538b8` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/tickets/vault.ts`                              | Text   |     2,180 | `b41ed6782150` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/trains/provider.ts`                            | Text   |     6,336 | `71d15484de17` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/trains/service.ts`                             | Text   |       987 | `443168692722` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/src/server/validation.ts`                                 | Text   |     6,654 | `4d3ec6637a7a` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/tailwind.config.ts`                                       | Text   |     3,866 | `4192855b07c0` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/tsconfig.json`                                            | Text   |       653 | `e5f743169acb` | Source/configuration scan; applicable lint/type/build checks     |
| `apps/web/vitest.config.mjs`                                        | Text   |       307 | `d7271d06ef6f` | Source/configuration scan; applicable lint/type/build checks     |
| `deploy/Dockerfile.web`                                             | Text   |     1,927 | `b98e84fc667a` | Source/configuration scan; applicable lint/type/build checks     |
| `deploy/docker-compose.prod.yml`                                    | Text   |     3,914 | `c31a55266b56` | Source/configuration scan; applicable lint/type/build checks     |
| `deploy/nginx/nginx.conf`                                           | Text   |     1,163 | `54b0fb563007` | Source/configuration scan; applicable lint/type/build checks     |
| `deploy/nginx/templates/railbandhan.conf.template`                  | Text   |     1,664 | `4d892a2f74c8` | Source/configuration scan; applicable lint/type/build checks     |
| `docker-compose.yml`                                                | Text   |       835 | `6b75f31c2d7b` | Source/configuration scan; applicable lint/type/build checks     |
| `docs/APPLY_REBUILD.md`                                             | Text   |     2,073 | `0b86519867e4` | Documentation consistency review; current or marked historical   |
| `docs/ARCHITECTURE_REVIEW.md`                                       | Text   |     9,299 | `84cbb7c4dd46` | Documentation consistency review; current or marked historical   |
| `docs/AUDIT_REPORT.md`                                              | Text   |    20,946 | `6d910b35a889` | Documentation consistency review; current or marked historical   |
| `docs/COMPLIANCE_AND_PRIVACY_AUDIT.md`                              | Text   |     5,702 | `7a8149982691` | Documentation consistency review; current or marked historical   |
| `docs/DESIGN_SYSTEM.md`                                             | Text   |     3,811 | `527f34daf0ed` | Documentation consistency review; current or marked historical   |
| `docs/FILE_REVIEW.md`                                               | Text   |    61,507 | `generated`    | Documentation consistency review; current or marked historical   |
| `docs/FINAL_PRODUCTION_AUDIT.md`                                    | Text   |    13,383 | `e7316dacf9f8` | Documentation consistency review; current or marked historical   |
| `docs/FREE_RAILWAY_APIS.md`                                         | Text   |     5,294 | `bad0bb719357` | Documentation consistency review; current or marked historical   |
| `docs/MONITORING_AND_SLOS.md`                                       | Text   |     4,222 | `c5d6c1167e79` | Documentation consistency review; current or marked historical   |
| `docs/OPEN_SOURCE_ARCHITECTURE.md`                                  | Text   |     8,834 | `a473409b0d7e` | Documentation consistency review; current or marked historical   |
| `docs/PERFORMANCE_REVIEW.md`                                        | Text   |     5,058 | `dc9601dd5454` | Documentation consistency review; current or marked historical   |
| `docs/PRODUCTION_DEPLOYMENT.md`                                     | Text   |    14,489 | `c2fe3c1debce` | Documentation consistency review; current or marked historical   |
| `docs/PRODUCTION_LAUNCH_PLAYBOOK.md`                                | Text   |     7,611 | `151b7b698e0e` | Documentation consistency review; current or marked historical   |
| `docs/PRODUCTION_READINESS.md`                                      | Text   |     3,747 | `4308b6720939` | Documentation consistency review; current or marked historical   |
| `docs/RAILWAY_DATA_RESEARCH.md`                                     | Text   |    27,983 | `4f870f85add2` | Documentation consistency review; current or marked historical   |
| `docs/REBUILD_PLAN.md`                                              | Text   |     3,346 | `4e303bd41692` | Documentation consistency review; current or marked historical   |
| `docs/REBUILD_REPORT.md`                                            | Text   |    10,449 | `d73a67840634` | Documentation consistency review; current or marked historical   |
| `docs/RESEARCH_REPORT.md`                                           | Text   |    14,111 | `3678e36d3677` | Documentation consistency review; current or marked historical   |
| `docs/SECURITY_REVIEW.md`                                           | Text   |    10,475 | `b2edd5bf23b3` | Documentation consistency review; current or marked historical   |
| `docs/SETUP.md`                                                     | Text   |     4,796 | `303164f43756` | Documentation consistency review; current or marked historical   |
| `docs/adr/ADR-001-postgresql-system-of-record.md`                   | Text   |     1,246 | `00620fc0074a` | Documentation consistency review; current or marked historical   |
| `docs/adr/ADR-002-rls-authorization-boundary.md`                    | Text   |     1,394 | `f2111e2e3249` | Documentation consistency review; current or marked historical   |
| `docs/adr/ADR-003-local-ocr-hybrid-pipeline.md`                     | Text   |     1,324 | `8bbd209c7c93` | Documentation consistency review; current or marked historical   |
| `docs/adr/ADR-004-open-weight-ai-model-routing.md`                  | Text   |     1,273 | `fadc4b4a8c9f` | Documentation consistency review; current or marked historical   |
| `docs/adr/ADR-005-railway-provider-abstraction.md`                  | Text   |     1,105 | `db2aa35f432f` | Documentation consistency review; current or marked historical   |
| `docs/adr/ADR-006-pgvector-hybrid-search.md`                        | Text   |     1,130 | `82b18b79ee76` | Documentation consistency review; current or marked historical   |
| `docs/adr/ADR-007-redis-valkey-coordination.md`                     | Text   |       996 | `046a45e62e41` | Documentation consistency review; current or marked historical   |
| `docs/adr/ADR-008-private-object-storage-vault.md`                  | Text   |       976 | `7121da05cdac` | Documentation consistency review; current or marked historical   |
| `docs/adr/ADR-009-self-hosting-roadmap.md`                          | Text   |     1,182 | `a827746a5827` | Documentation consistency review; current or marked historical   |
| `docs/api-spec.md`                                                  | Text   |     3,935 | `fae6d9ba5dcc` | Documentation consistency review; current or marked historical   |
| `docs/architecture.md`                                              | Text   |     6,307 | `d98fb1b9f252` | Documentation consistency review; current or marked historical   |
| `docs/authorization-model.md`                                       | Text   |     3,570 | `ca54b8112f3a` | Documentation consistency review; current or marked historical   |
| `docs/database-schema.md`                                           | Text   |     6,750 | `5048846a4c00` | Documentation consistency review; current or marked historical   |
| `docs/privacy-retention.md`                                         | Text   |     2,524 | `c02f557d0e27` | Documentation consistency review; current or marked historical   |
| `docs/runbooks/DEPLOYMENT_RUNBOOK.md`                               | Text   |     4,094 | `110d35db7cc1` | Documentation consistency review; current or marked historical   |
| `docs/runbooks/DISASTER_RECOVERY_RUNBOOK.md`                        | Text   |     3,424 | `b4efa8a1535a` | Documentation consistency review; current or marked historical   |
| `docs/runbooks/INCIDENT_RESPONSE_PLAYBOOK.md`                       | Text   |     4,148 | `102ea061aa26` | Documentation consistency review; current or marked historical   |
| `docs/runbooks/ROLLBACK_RUNBOOK.md`                                 | Text   |     2,978 | `c2d78209140e` | Documentation consistency review; current or marked historical   |
| `docs/threat-model.md`                                              | Text   |     2,837 | `7b66fb227405` | Documentation consistency review; current or marked historical   |
| `docs/ui-screen-map.md`                                             | Text   |     2,057 | `b40543d47817` | Documentation consistency review; current or marked historical   |
| `package-lock.json`                                                 | Text   |       137 | `73884f1692a9` | Locked dependency graph; npm production audit                    |
| `package.json`                                                      | Text   |       879 | `e3dc0e71df9e` | Source/configuration scan; applicable lint/type/build checks     |
| `research/datasets/synthetic-tickets.json`                          | Text   |     4,625 | `c835580acc51` | Historical prototype/research; inactive in production topology   |
| `research/models/benchmark.ts`                                      | Text   |     4,392 | `062aecfff06d` | Historical prototype/research; inactive in production topology   |
| `research/moderation/spam-benchmark.ts`                             | Text   |     1,881 | `1b57fd0d3b06` | Historical prototype/research; inactive in production topology   |
| `research/ocr/benchmark.ts`                                         | Text   |     7,273 | `f4e97e762191` | Historical prototype/research; inactive in production topology   |
| `research/railway-data/canonical-routes.json`                       | Text   |     5,990 | `ed78b3c56e07` | Historical prototype/research; inactive in production topology   |
| `research/railway-data/sources.md`                                  | Text   |     4,535 | `7bb1ef3280d5` | Historical prototype/research; inactive in production topology   |
| `research/search/hybrid-benchmark.ts`                               | Text   |     1,969 | `694414ec46c3` | Historical prototype/research; inactive in production topology   |
| `scripts/backup-format.mjs`                                         | Text   |     2,169 | `cd4124edca05` | Source/configuration scan; applicable lint/type/build checks     |
| `scripts/ci-smoke.mjs`                                              | Text   |     1,901 | `7eceb1274c99` | Source/configuration scan; applicable lint/type/build checks     |
| `scripts/dev.mjs`                                                   | Text   |       807 | `c029c631cee7` | Source/configuration scan; applicable lint/type/build checks     |
| `scripts/migrate.mjs`                                               | Text   |     1,596 | `829afe0ace97` | Source/configuration scan; applicable lint/type/build checks     |
| `scripts/pg-backup.mjs`                                             | Text   |     1,136 | `c02185ca3d59` | Source/configuration scan; applicable lint/type/build checks     |
| `scripts/pg-restore.mjs`                                            | Text   |     1,798 | `5e28f616b819` | Source/configuration scan; applicable lint/type/build checks     |
| `scripts/pg-tool-env.mjs`                                           | Text   |       769 | `800d2134e9d1` | Source/configuration scan; applicable lint/type/build checks     |
| `scripts/preflight-check.mjs`                                       | Text   |     1,446 | `c3dc89078047` | Source/configuration scan; applicable lint/type/build checks     |
| `scripts/prepare-standalone.mjs`                                    | Text   |       632 | `335533fa9d72` | Source/configuration scan; applicable lint/type/build checks     |
| `scripts/retention-worker.mjs`                                      | Text   |     1,065 | `d8a264ac09f9` | Source/configuration scan; applicable lint/type/build checks     |
| `scripts/review-inventory.mjs`                                      | Text   |     3,126 | `43c7a612a229` | Source/configuration scan; applicable lint/type/build checks     |
| `scripts/smoke-test.mjs`                                            | Text   |     1,748 | `4c45cb01d3be` | Source/configuration scan; applicable lint/type/build checks     |
| `supabase/README.md`                                                | Text   |       683 | `b5eb63b6978f` | Historical prototype/research; inactive in production topology   |
| `supabase/config.toml`                                              | Text   |       314 | `7a24756b48c0` | Historical prototype/research; inactive in production topology   |
| `supabase/migrations/20260810000001_init.sql`                       | Text   |    14,899 | `896c36bc92d6` | Historical prototype/research; inactive in production topology   |
| `supabase/migrations/20260810000002_phase2_phase3.sql`              | Text   |     7,146 | `e24ae8ebccbe` | Historical prototype/research; inactive in production topology   |
| `supabase/migrations/20260810000003_rls_hardening.sql`              | Text   |     1,522 | `e85d4c48d9e4` | Historical prototype/research; inactive in production topology   |
| `supabase/migrations/20260810000004_railway_graph_pgvector.sql`     | Text   |     2,824 | `c24e0f886ece` | Historical prototype/research; inactive in production topology   |
| `supabase/seed/seed.sql`                                            | Text   |     2,010 | `661a7eeef59f` | Historical prototype/research; inactive in production topology   |
| `tests/account-deletion.test.ts`                                    | Text   |     1,663 | `bc0b4c0ab21c` | Behavioral/adversarial verification source                       |
| `tests/adversarial-e2e.test.ts`                                     | Text   |     7,382 | `f3dbe65971f5` | Behavioral/adversarial verification source                       |
| `tests/api-security.test.ts`                                        | Text   |     4,192 | `c5c70f4444ab` | Behavioral/adversarial verification source                       |
| `tests/auth.test.ts`                                                | Text   |     3,398 | `dc260b53c1dd` | Behavioral/adversarial verification source                       |
| `tests/backup-format.test.ts`                                       | Text   |     1,464 | `b1f37db4be93` | Behavioral/adversarial verification source                       |
| `tests/chat-and-dm.test.ts`                                         | Text   |     4,275 | `bc2c26b956f4` | Behavioral/adversarial verification source                       |
| `tests/cross-journey-security.test.ts`                              | Text   |     3,109 | `c46b2271126e` | Behavioral/adversarial verification source                       |
| `tests/fixtures/ticket.ts`                                          | Text   |     1,213 | `006efd21b43a` | Behavioral/adversarial verification source                       |
| `tests/games-engine.test.ts`                                        | Text   |     4,908 | `62b56b9d7dfd` | Behavioral/adversarial verification source                       |
| `tests/health-smoke.test.ts`                                        | Text   |       548 | `0510ce9a4b18` | Behavioral/adversarial verification source                       |
| `tests/hybrid-search.test.ts`                                       | Text   |     2,522 | `e3969edaabd5` | Behavioral/adversarial verification source                       |
| `tests/journey-creation.test.ts`                                    | Text   |     2,818 | `b042d9f5f594` | Behavioral/adversarial verification source                       |
| `tests/local-ai-rag.test.ts`                                        | Text   |     2,522 | `46a552a9c357` | Behavioral/adversarial verification source                       |
| `tests/ludo-game.test.ts`                                           | Text   |     4,043 | `0b80b7e6b02d` | Behavioral/adversarial verification source                       |
| `tests/moderation-reporting.test.ts`                                | Text   |     2,409 | `724a2485e20e` | Behavioral/adversarial verification source                       |
| `tests/position-engine.test.ts`                                     | Text   |     3,146 | `5356d70e8cf7` | Behavioral/adversarial verification source                       |
| `tests/postgres-store.test.ts`                                      | Text   |     4,466 | `3d3d3da12ec6` | Behavioral/adversarial verification source                       |
| `tests/privacy-identity.test.ts`                                    | Text   |     3,158 | `716174595784` | Behavioral/adversarial verification source                       |
| `tests/provider-router-resilience.test.ts`                          | Text   |     2,839 | `a9b0436b1268` | Behavioral/adversarial verification source                       |
| `tests/railradar-contract.test.ts`                                  | Text   |     5,220 | `83321cf1a362` | Behavioral/adversarial verification source                       |
| `tests/railway-benchmark.test.ts`                                   | Text   |     3,619 | `04ffc08aa1b9` | Behavioral/adversarial verification source                       |
| `tests/railway-graph.test.ts`                                       | Text   |     4,051 | `f2dcfeecad29` | Behavioral/adversarial verification source                       |
| `tests/resilient-cache.test.ts`                                     | Text   |     2,115 | `124f6594b434` | Behavioral/adversarial verification source                       |
| `tests/session-security.test.ts`                                    | Text   |     2,731 | `4698d5c27fd1` | Behavioral/adversarial verification source                       |
| `tests/spam-moderation.test.ts`                                     | Text   |     1,558 | `9eac35ba54d6` | Behavioral/adversarial verification source                       |
| `tests/sqlite-store-parity.test.ts`                                 | Text   |     8,659 | `c08436bd1f11` | Behavioral/adversarial verification source                       |
| `tests/test-utils.ts`                                               | Text   |       387 | `bd1746fac6de` | Behavioral/adversarial verification source                       |
| `tests/ticket-ocr-pipeline.test.ts`                                 | Text   |     2,294 | `3def69b4eef1` | Behavioral/adversarial verification source                       |
| `tests/ticket-security.test.ts`                                     | Text   |     2,803 | `853e49d17b18` | Behavioral/adversarial verification source                       |
| `tests/timetable.test.ts`                                           | Text   |     1,545 | `1c14b300e928` | Behavioral/adversarial verification source                       |
| `tsconfig.json`                                                     | Text   |       493 | `a9692007b4ac` | Source/configuration scan; applicable lint/type/build checks     |
