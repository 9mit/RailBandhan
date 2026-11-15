# Design system

## Direction

A train window into a diverse India: warm paper, deep green, terracotta, architectural arches and editorial serif type. Cultural references appear through travel rituals, riverfronts, rail architecture, Hindi accents and the supplied imagery. Utility screens stay readable, with clear forms, generous spacing and honest states.

| Token        | Value                               | Role                           |
| ------------ | ----------------------------------- | ------------------------------ |
| Paper        | `#f7f5ef`                           | App canvas                     |
| Surface      | `#fffefa`                           | Forms, cards and dialogs       |
| Ink          | `#192c2d`                           | Main text                      |
| Muted        | `#62716d`                           | Supporting text                |
| Forest       | `#24483f`                           | Navigation and primary actions |
| Terracotta   | `#b84e2c`                           | Editorial accent and focus     |
| Border       | `#dedfd6`                           | Quiet separators               |
| Display font | Iowan/Palatino/Georgia system serif | Headings and story moments     |
| UI font      | Aptos/Segoe UI/Arial system sans    | Navigation and forms           |

System fonts avoid runtime font CDN dependencies. The hero’s light copy appears over a controlled dark scrim. Information is not conveyed through color alone.

## Layout and motion

The desktop shell uses a persistent left navigation, a quiet top bar and full-width responsive content. Tablets and phones use a native modal navigation drawer and a bottom navigation. Ultrawide layouts expand content and hero/media proportions.

The home page tells one story: welcome, cinematic journey, actual train entry, community experiences and a cultural invitation. Public discovery combines visual chapters with the real local route catalog. Joining a journey offers two clear paths, document extraction or manual entry. Profile settings display actual earned badges, explicit privacy controls and a password-confirmed deletion dialog.

Motion supports orientation. Reveal animations run once through IntersectionObserver. The film can be paused. The atmospheric dream view uses the supplied surreal artwork. Reduced-motion settings remove decorative movement; native scrolling remains intact. No scroll hijacking, forced sound or essential scroll-only controls are introduced.

## Assets

All 13 original images and the 10-second supplied film were inspected. The film was sampled at the beginning, middle and end. The home page uses the film, cosmic train artwork, station artwork, window artwork, chai scene and riverfront image. Discovery uses scenic, riverfront and chai artwork. Authentication and journey entry reuse the train-window scene.

The four portraits are retained as source assets but are not shown as real users. The holographic pass artwork is retained without being represented as an official ticket. This is a deliberate editorial choice: use each asset where it supports the journey, rather than inserting every file into every screen.

## Accessibility implementation and QA boundary

Implemented: semantic landmarks, a skip link, visible keyboard focus, browser zoom, labelled inputs, linked error/help text, native form validation, inline error states, native dialog keyboard behavior, playback control, reduced-motion rules and content clearance beneath fixed navigation.

WCAG 2.2 AA is a verification target. It has not been certified. Complete a screen-reader/keyboard/mobile review and contrast audit on every interactive state in staging. Very small editorial labels should be included in user readability testing and enlarged if they impede comprehension.
