---
name: Smooth explore transition
overview: Get rid of the freeze when /search loads, which comes from the search box's WebGL avatar. Replace the hard cut with a fade in from black that waits for the map. Make the dive's last frame line up with the map's first, and do less work while the pages swap.
todos:
  - id: avatar-shader
    content: Size the Warp avatar to its 32px circle; add a shader prop (through HaloSearchInput and AddressSearch) with a gradient placeholder, a one-frame deferred mount and a fade-in
    status: pending
  - id: arrival-veil
    content: Add the black arrival veil, its 1.8s cap and introDone to report-explorer.tsx; reset both in the replay layout effect; make the panel timer wait for the veil
    status: pending
  - id: map-intro
    content: "Add onIntroReady and onIntroDone to HazardMap: wait for the first idle (capped) before the intro flight, signal on moveend, cancel on cleanup; INTRO_ZOOM to about 3.7, INTRO_SECONDS to about 2.6"
    status: pending
  - id: dive-north-up
    content: Roll the dive camera to north-up in DiveRig and restore camera.up on cleanup
    status: pending
  - id: handoff
    content: Add warmUp (prefetch /search, import maplibre-gl) on Explore hover and focus; add landed to the dive context to freeze the Earth scene and hide the galaxy, then push two frames later
    status: pending
  - id: verify
    content: Re-measure the transition timeline in the browser; check direct /search load, reduced motion and a second dive; run lint, typecheck and tests
    status: pending
isProject: false
---

# Smooth the Explore to search transition

## What the measurements showed

- **Hard cut:** Clicking Explore runs a 1.8s camera dive, fades to black during the last 250ms, then calls `router.push("/search")`. The black overlay lives in [client/components/space/earth-hero.tsx](client/components/space/earth-hero.tsx), so it disappears the moment the route changes and the search page cuts in.
- **Freeze:** Right after arrival, the main thread froze for 1.7s, 4.8s and 10.4s in three runs. The profile puts nearly all of that time in `getContext("webgl2")` inside Paper's `ShaderMount`, which is the 32px `AiBlobWarpAvatar` in the search box.
  - Loading `/search` directly doesn't freeze. The stall comes from creating that context while the homepage's Earth and galaxy scenes are still using the GPU.
- **Oversized canvas:** The avatar paints a 2560×1440 canvas to show 32px, because Paper turns `width` and `height` into the element's CSS size:

```903:917:client/components/ui/halo-search.tsx
const DEFAULT_WARP: Partial<WarpProps> = {
  // ...
  height: 720,
  // ...
  width: 1280,
};
```

- **Knock-on effects:** The search panel's 250ms timer and the map creation both wait behind the freeze. Map tiles then pop in during the zoom.
- **Mismatched views:** The dive ends on a tilted view about 3,200 km across. The map opens north-up at about 1,100 km across (`INTRO_ZOOM = 5.3`).

## New sequence

```mermaid
flowchart TD
    hover["Hover or focus on Explore: prefetch /search and load maplibre-gl"] --> click[Click Explore]
    click --> dive["Camera dive, 1.8s, rolling to north-up"]
    dive --> black[Screen fades to black]
    black --> handoff["Freeze Earth, hide galaxy, push /search two frames later"]
    handoff --> veil["Search page mounts under an opaque black veil"]
    veil --> mapLoad["Map loads at the intro view and waits for first tiles, capped"]
    mapLoad --> reveal["Veil fades out as the map descends to the county"]
    reveal --> panel[Search panel slides in]
    panel --> flightDone["Flight ends: avatar shader mounts and fades in"]
```

## 1. Stop the search-box avatar from blocking

Files: [client/components/ui/halo-search.tsx](client/components/ui/halo-search.tsx), [client/components/address-search.tsx](client/components/address-search.tsx)

- **Size:** Remove `width` and `height` from `DEFAULT_WARP` and give `Warp` `className="size-full"`, so it renders at 32px. Re-tune `scale` by eye to keep today's look.
- **Placeholder:** Add a `shader` prop (default `true`) to `AiBlobWarpAvatar`, passed down through `HaloSearchInput` and `AddressSearch`. Until it's true, show a CSS conic gradient in the same five colors.
- **Deferred mount:** Mount `Warp` one frame after `shader` turns true, and fade it in. Remove it in the effect cleanup, so a second dive doesn't recreate the context during the page swap.

## 2. Fade in from black, driven by the map

Files: [client/components/report-explorer.tsx](client/components/report-explorer.tsx), [client/components/hazard-map.tsx](client/components/hazard-map.tsx)

- **New state:** `ReportExplorer` gets `veil` (starts as `intro`) and `introDone` (starts as `!intro`). The existing replay `useLayoutEffect` resets both.
- **Veil:** Render it at the top of `<main>`. It matches the homepage overlay, so the swap is invisible:

```tsx
<div
  aria-hidden="true"
  className={`pointer-events-none fixed inset-0 z-50 bg-black transition-opacity duration-700 ease-out ${veil ? "opacity-100" : "opacity-0"}`}
/>
```

- **When it lifts:** Lift the veil on `onIntroReady`, or after a 1.8s safety cap, which also covers map errors.
- **Panel timing:** The panel timer waits until about 400ms after the veil lifts, instead of firing 250ms after mount.
- **Avatar:** Pass `introDone` through `AddressSearch` to the avatar's `shader` prop.
- **Map callbacks:** `HazardMap` gets optional `onIntroReady` and `onIntroDone` props, kept in refs so the flight effect doesn't rerun. The changes go in the intro branch of the existing flight helper:

```294:307:client/components/hazard-map.tsx
    const introFlight = introPending.current;
    introPending.current = false;
    const flyTo = (center: [number, number], zoom: number) => {
      if (introFlight) {
        instance.setProjection({ type: "globe" });
        instance.jumpTo({ center: COUNTY_CENTER, zoom: INTRO_ZOOM });
      }
      instance.flyTo({
        center,
        zoom,
        essential: true,
        ...(introFlight && { duration: INTRO_SECONDS * 1000, curve: 1.2 }),
      });
    };
```

  - Jump to the intro view.
  - Wait for the first `idle` event, skipping the wait if `areTilesLoaded()`, capped at about 800ms.
  - Call `onIntroReady`, start the flight, and call `onIntroDone` on that flight's `moveend`.
  - Return a cleanup from both the report and no-report branches, so a pending wait is cancelled.

## 3. Line up the dive's last frame with the map's first

Files: [client/components/space/earth-scene.tsx](client/components/space/earth-scene.tsx), [client/components/hazard-map.tsx](client/components/hazard-map.tsx)

- **North-up:** In `DiveRig`, store `startUp` in `createRig`. Each frame, blend `camera.up` toward the Earth's north by the same eased `e` before `lookAt`. North here is the spin group's world Y axis, with its component along the view direction removed. Restore `camera.up` in the cleanup along with the rest of the camera state.
- **Zoom:** Lower `INTRO_ZOOM` from 5.3 to about 3.7, which matches the dive's final span of about 3,200 km. Raise `INTRO_SECONDS` from 2.2 to about 2.6 so the descent speed feels the same. Tune both by eye.

## 4. Do less during the handoff

Files: [client/components/space/dive-context.tsx](client/components/space/dive-context.tsx), [client/components/space/explore-button.tsx](client/components/space/explore-button.tsx), [client/components/space/earth-hero.tsx](client/components/space/earth-hero.tsx), [client/components/space/earth-scene.tsx](client/components/space/earth-scene.tsx), [client/app/page.tsx](client/app/page.tsx)

- **Load early:** Add `warmUp()` to the dive context. It runs `router.prefetch(DIVE_TARGET)` and `import("maplibre-gl")` once. `ExploreButton` calls it on pointer enter and focus, and `startDive` still calls it.
- **Pause before switching:** Add `landed` to the dive context, exposed as `data-landed` next to `data-diving`. When a dive finishes (the screen is black), `finishDive` sets it and calls `router.push` two animation frames later. The fallback when the scene isn't ready still navigates immediately.
- **What `landed` stops:**
  - `EarthScene` gets `frozen`, which sets `frameloop="never"`.
  - In `page.tsx`, wrap `<SpaceBackground />` inside `<DiveProvider>` with `group-data-[landed=true]/dive:hidden`. The galaxy's IntersectionObserver already pauses it when hidden.
- **Reset:** Reset `landed` in the same unmount cleanup that resets `diving`.

## 5. Verify

- **Timeline:** Rerun the browser timing script from this investigation, which logs long frames and times `getContext`. Targets:
  - No main-thread pause over about 100ms from the click to the end of the map's flight.
  - The veil lifts only after the map has drawn.
  - The panel comes in after the veil.
  - The avatar shader starts after the flight.
- **Other paths:**
  - Opening `/search` directly: no veil, and the panel and avatar appear right away.
  - Reduced motion: no dive and no veil.
  - A second dive with `/search` cached: the veil replays without flashing the old page.
- **Checks:** Run `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm test` in `client/`.

**Risk:** The map's own context creation might still stall. If so, the veil turns it into a slightly longer black fade instead of a frozen, half-built page. Step 5's timeline will show whether the two-frame delay before switching pages needs to grow.