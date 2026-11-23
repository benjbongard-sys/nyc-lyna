# NOUX Private Edition

A password-unlocked, encrypted personal trip planner hosted on GitHub Pages.

## Cross-device login resilience (22 November 2026)

The site no longer rejects successful decryption merely because **React takes longer than 700 ms**, the first paint contains fewer than 40 characters, or an unrelated JavaScript error occurs. It waits for an actual rendered app and keeps the core planner available even if an optional module cannot initialise.

If the visual React interface genuinely cannot mount, NOUX opens a **read-only emergency itinerary derived from the successfully decrypted trip**, with day-by-day stops, statuses, verified addresses and Google Maps directions, plus a Print / save itinerary action. It does **not** request the passphrase again, offer a looping Basic itinerary button, change saved choices, erase cache storage, reset Cloudflare pairing or overwrite the encrypted checklist. A late React mount can dismiss this emergency view automatically.

Use **no browser-data-clearing instructions** for recovery: browser storage contains pairing information and potentially unsynchronised edits. On release, scripts and the offline cache are versioned `20261122-login1`. The `scripts/test_unlock_recovery.js` CI suite checks immediate/slow/short first paint, unrelated errors, emergency fallback and the formerly looping basic mode. This is a synthetic regression gate, not a substitute for testing Safari/Chrome on real devices.

## Five-day schedule automatically updated (22 November 2026)

The approved 23–27 November sightseeing route is now **loaded automatically as the native schedule after the normal passphrase unlock**, without uploading or importing a JSON file. The old daily itineraries, night-out alternatives, sunrise choices and decision cards are retired. The last day has a **fixed** approved itinerary; an obsolete Friday selection in a previously paired browser cannot replace it. Day-by-day timeline, map pins, transit estimates, itinerary search and calendar export all consume the same updated planner data.

**Privacy disclosure:** for this immediate no-import deployment, `approved-week.js` is a public, non-secret sightseeing itinerary template. Its **venue names, visit dates and approximate planned times are visible in the public repository source**. It deliberately excludes the travellers' names, exact hotel street address, passphrase and booking reference numbers. The original encrypted vault and protected packing data are not published by this public file. Browser-local itinerary preferences and the new booking checkboxes are not encrypted at rest; paired-device synchronisation encrypts the transmitted data. This template is NOT confidential merely because the web interface requires a passphrase to unlock. To make every itinerary stop confidential again, a client-side encrypted private-source update using the owner's key is required.

Both paired devices receive the new template from the published NOUX code on their next refresh/reopen. The website itself does not purchase tickets. The current native plan distinguishes seven booked items (the existing Golden Hour cruise, Dear Irving and return flight, plus the traveller-confirmed Davis Family Butterfly Vivarium, Guggenheim Museum, Hudson VU and Mercer Labs), arranged group transport, and Louie Vega's waitlist. A Louie Vega waitlist place does not guarantee admission and only a newly issued ticket can be marked as admitted in the tracker. Other tickets and reservations remain to be arranged or verified. There is no manual import, no Friday route choice, and no duplicate decisions panel. Public curated food details, maps, shared custom stops and gifts continue operating.

## Explore mobile drawer recovery · 22 November 2026

A real iPhone screenshot showed the Explore launcher but only a narrow, empty rounded strip at the bottom. **Root cause:** after automatic approval of the full five-day plan, the obsolete `NOUX_CHOICES` JavaScript module was still loaded but deliberately not initialised. `explorer.js` tried calling its `alternatives()` method, dereferenced a null internal DATA object, and threw *before* populating the drawer. The CSS positioned that empty drawer at the bottom, which made it look like a layout clipping problem.

The corrected Explore code skips retired Decisions entirely for an approved itinerary, still shows day navigation/Wishlist/optional places, and catches unexpected rendering errors with usable **Open itinerary / Open Wishlist** fallback controls. On mobile, the open drawer is now a full-height, independently scrollable overlay with an accessible sticky close control, correct safe-area padding and no competing permanent buttons. All content remains attached outside React's managed root.

The regression `scripts/test_explorer_mobile.js` explicitly simulates the retired Decisions module throwing if called, verifies the normal approved itinerary still displays, then injects an independent optional error to ensure a real fallback appears rather than an empty strip. `scripts/test_explorer.js` continues to protect the historical planning behaviour. The new public asset version is `20261122-explore2` and the offline shell version matches it. Physical Safari validation is still needed.

## All-stops Map filter + iPhone Explore availability (22 November 2026)

- The existing **All-stops Map** now has a compact **Scheduled / All** pin control, with **Scheduled** selected by default. Scheduled uses all five approved `NYC_PLAN.day()` routes and their actual map coordinates, including any individually scheduled custom stop. **All** restores the unscheduled/Wishlist alternatives. The control changes marker visibility only; it does **not** remove saved places, modify the approved timetable or change calendar exports. The selected display mode is saved locally under `noux_map_filter_v1`. The control only appears while the native map is visible.
- **Explore** remains the only global floating shortcut, but its mobile position has been lifted above the iPhone Safari toolbar. It rechecks its mount after the decrypted React app renders and can remount if missing. Previously a retained `basic=1` recovery session skipped Explore entirely. That case now gets **display-only Explore**, which never re-wraps or alters the approved route. Other existing Explore functionality remains available.
- Regressions: `scripts/test_map_filter.js`, `scripts/test_explorer_mobile.js`; existing approved-plan, unlock and sync regressions remain in GitHub Pages workflow. The public filter never decrypts the vault, stores secrets or modifies React-managed markup.
- **Limitations:** this filters pins on the **existing All-stops Map**; it is not an additional map. It uses published venue coordinates and existing MapLibre markers, not independently verified GPS stop locations. Physical Safari/iPhone deployment validation still needs a short smoke test.

## Final route, booking and enrichment audit (22 November 2026)

- **Native schedule and map:** every approved stop in the five days uses `NYC_PLAN.day()`; map markers, itinerary timings, downstream search, current scheduled routing estimates and calendar exports read the same final plan. Friday's Brooklyn Bridge crossing remains compulsory in the approved sightseeing route. Thursday's Sadie's lunch is 13:20–14:15 after Mercer Labs, and Tuesday Blue Note doors/dining are planned for 18:30–19:30 ahead of the 20:00 show.
- **Leg-by-leg journeys:** `NYC_PLAN.legs()` now calculates geographic estimates between consecutive different stop locations, indicating insufficient scheduled travel buffers. The old event-card `Directions` links no longer wrongly begin at the hotel: they begin at the previous approved stop. **NOUX does not have an authenticated source for live door-to-door travel durations.** Clicking `Open current directions` opens Google Maps for live provider-side directions. Live MTA train predictions remain in the existing Subway arrivals tab. The Monday booked cruise meeting point is now confirmed by the traveller's instructions as **NY Waterway Pier 79, Slip 2, 459 12th Avenue (West 39th Street)**, with meeting/boarding at **15:40** for the 16:00 departure. The 15:25 arrival is a prudent buffer rather than a separate ticket time. Note that some general NY Waterway listings mention nearby Pier 78: the supplied booking confirmation specifies Pier 79 Slip 2.
- **One set of practical controls, no extra nav tabs:** open the original **Trip Settings → Shared / offline → Routes, tickets & venue details**. **Routes & live directions** shows the five days, individual scheduled times, travel estimates, official place links and source-based holiday notes. **Tickets & reservations** has the existing booked cruise and Dear Irving, the arranged coach and booked return flight, plus the unconfirmed museum, rooftop, concert and restaurant checks. Mark purchases manually; no sale or reservation is processed. `Refresh itinerary badges` reloads the agenda after an update.
- **Shared booking flags:** a boolean confirmation for an approved event is held in browser localStorage under `noux_booking_status_v1`, and is eligible for the existing end-to-end encrypted shared sync channel between paired devices. **These flags are not encrypted at rest in localStorage**; do not enter booking reference codes, payment details or credentials into the tool. Imported updates prompt the existing safe reload. Independent checklists and custom stops remain unchanged.
- **Wishlist and Food guide:** native Wishlist items are mapped to their selected day for the approved visits, without deleting independent entries. ARTE MUSEUM and West Village remain optional/unassigned. The existing Food guide is enriched from 13 to **15 address-level profiles**, now including Golden Diner (Friday) and Sadie's (Thursday). Sadie's Thursday Thanksgiving brunch 10:00–15:00 is supported by the Seaport's published programme. The Friday Golden Diner opening status is based on the travellers' check, but holiday listings conflict; confirm directly if relying on a table. Colbo Next Door opening on Thanksgiving also remains unconfirmed.
- **Privacy:** place names and itinerary times already present in the public `approved-week.js` are inspectable in the public repository. Hotel details and the private original vault are not added to that public file. The public route content must not be described as secret.

## Privacy and security model

The published itinerary is encrypted locally using AES-256-GCM. Its PBKDF2 passphrase is **never included in the repository or GitHub Actions secrets**, and is never transmitted to a backend. The public HTML/CSS entry screen, venue images and dependency bundles can be downloaded without authentication; the AES-encrypted itinerary cannot be decrypted without the private passphrase. This is **client-side content encryption, not server-side HTTP access control**. Real private access restrictions require a separate authenticated host (such as Cloudflare Access or a private app server).

This repository had earlier unencrypted revisions. Replacing the current branch does **not guarantee deletion of prior commits, GitHub caches, forks or workflow artifacts**. Do not rely on the gate for complete erasure of previously published details. In the GitHub repository settings, consider private hosting or a new repository and Cloudflare Access for stronger privacy.

## Deployed features

- Cinematic unlock animation; itinerary encrypted at rest.
- Approved five-day daily schedule, transfer estimates, optional custom stops and independently confirmed booking statuses. Old itinerary decisions no longer appear in the final plan.
- Global search (Cmd/Ctrl+K) across all itinerary stops and wishes.
- All-stops MapLibre vector map using OpenFreeMap, with selected visits, alternatives and custom pins. No requests to blocked OpenStreetMap volunteer tile servers.
- Departure-day itinerary returns to the hotel for stored luggage before the **arranged guided group coach at approximately 17:00 on Friday 27 November**. The exact lobby boarding time is subject to the travel organiser.
- Official MTA subway GTFS-Realtime feed client, via a deployable Cloudflare Worker. Without an authorised Worker, no direct blocked browser requests or fabricated arrivals are shown.
- Every scheduled destination has a real photograph downloaded during GitHub Pages Actions builds. The photo catalogue maps each approved `noux_` place to its named source (31 unique local images for 32 scheduled locations and 53 itinerary events); the release fails if a scheduled image is unavailable. Location photos are reused for transfer/check-in cards; credits/source provenance are retained in `assets/photo-index.json`. The illustrated offline pack caches the scheduled photos after the traveller opts in.
- Custom-stop editor: add, edit, remove and position a stop, search a NYC address with Photon after a button click, look up a relevant Wikipedia photograph and description, upload your own photo or provide an HTTPS image link.
- Selecting a custom stop immediately updates the relevant day, changes the map and calendar export, estimates travel buffers and moves flexible stops when possible. Fixed appointments (especially the booked Monday cruise and Friday transfer pickup) never move; conflicts are clearly flagged. These are planning estimates, not certified travel times or validated venue opening hours.
- Personal custom stops remain local until **Shared trip sync** is paired. Once enabled, custom stops and saved choices are end-to-end encrypted and automatically copied to the partner's paired browser. Offline edits remain local until connectivity returns. Never enter access tokens or passwords in custom-stop fields.


## Food wishlist additions (21 November 2026)

The public `food-wishlist.js` extension originally added 13 curated NYC food suggestions and now maintains **15 verified-address profiles**, including the final Golden Diner and Sadie's additions to the **existing** native `food` wishlist category **only after the encrypted itinerary unlocks**. It retains existing wishlist entries and their priorities, recognises common naming variants to avoid duplicates, and marks four newly introduced classics as core: Katz's, Shake Shack, Joe's Pizza and L'Industrie. Other new food entries are optional, with no preselected day.

The enhancer does not modify the ciphertext, local or shared user preferences, booked events, or the route planner. Both devices receive the same public list with the latest deployed code. The additions are not reservations, and menus, pricing and Thanksgiving hours must be checked before visiting.

**Food place details (21 November 2026).** `food-wishlist.js` now carries branch-specific public metadata for all 15 current picks: full street address, official site, published standard hours, known holiday exception, best-fit itinerary day, approximate visit duration and concise geographical advice. `food-guide.js` renders those details in a responsive panel **outside React's managed root**. Open it via the **Food details & hours** control while the native Wishlist is visible, by clicking a recognised Food wishlist card, or through **Explore → Food locations & hours**. Each listing offers directions and a current Google Maps hours search. No client API keys, background requests or new reservations are involved.

Restaurant hours are **not** live opening guarantees. Official holiday notices are preserved: Russ & Daughters and Lobster Place are closed on Thanksgiving 26 November, while Katz's advertises an early 18:00 closing. Levain's pop-up and Magnolia Bakery have differing published regular hours across official sources; the guide explicitly discloses this. An unknown personally added Food wish receives a labelled "location/hours not verified" fallback with a search link rather than invented details. The guide never changes the native four-element Wishlist row or app's day plans.


## Simpler NOUX navigation · 21 November 2026

After feedback on the growing UI, the duplicated **Travel Companion** has been removed from the published site. The separate GO, weather, Tickets and Nearby panels were duplicating capabilities already present in the main itinerary, Map/MTA, Wishlist and decision cards. There is no Travel Companion floating button, and the original React navigation and encrypted itinerary are unchanged.

The deliberately small contextual structure is:

- **Trip Settings → Shared / offline**: open the original settings gear in the NOUX header. A small portal-owned **Shared / offline** action appears next to its heading (on narrow phones it reads **Sync**). It opens a technical mini-section containing the real **Shared Trip** pairing/status controls, the previously existing **encrypted Offline Essentials** download/status/remove functionality, and a link to the existing **Departure & gifts** checklists. There is no permanent Shared Sync, Packing or Offline launcher while browsing. The native Settings React DOM is **not modified**.
- **Explore → Approved trip overview**: once the five-day plan is final, this panel shows the next planned stop, the five approved days, remaining booking checks and shortcuts to Map, Wishlist, Routes and Tickets. Legacy Decisions, pace modes and second-chance selections are retired. The old guided-choices component remains only as a compatibility fallback when no approved plan is active.
- **Wishlist → Food card**: click the existing Food wish to see verified branches, addresses, published hours, holiday warnings and one-tap directions. The full Food guide is also accessible from **Explore**, but it has no permanent floating button.
- **Itinerary / Map / MTA**: retain their already existing schedules, walking/subway directions, train predictions and booked/proposed statuses. No duplicate GO or forecast screen is loaded.
- **Explore** is the remaining original floating shortcut. All other new features are contextual, so the visitor does not have to navigate a pile of overlapping buttons.

### Offline pack and safety

A service worker is still registered **after successful unlock and a healthy first React render**. To save offline content, open **Trip Settings → Shared / offline → Save offline pack** separately on each phone. It saves only public app assets and the **AES-256-GCM encrypted vault**; the passphrase, decrypted itinerary, pairing credentials and live MTA predictions are never stored in the pack. Reopen NOUX once in airplane mode on each device to validate locally. Google Maps routes, MTA real-time feeds and fresh hours require internet. Clearing this offline pack does not clear choices, shared pairing or the encrypted packing/souvenir list.

The code intentionally uses **body-owned modals and settings-only overlay controls** rather than inserting children into React-owned headers or dialogs; this protects against the prior blank-screen regression. Dedicated `test_decision_guide.js` and `test_trip_settings_tools.js` tests replace the old redundant Travel Companion suite. The encrypted site, existing data keys, original Decision controls and return-coach commitments remain untouched.

## Route-quality safeguards

The public `choice-orchestrator.js` and `day-audit.js` layers run only **after** decryption and read the existing private itinerary; they do not embed private reservations or the passphrase.

- Legacy route choices are superseded by the directly deployed public approved-week schedule. Wednesday and Friday remain fixed in the selected sightseeing plan.
- The optimiser uses tighter photo and focused-gallery durations, clusters nearby stops, inserts honest transfer buffers, and retains dismissed choices in the Explorer's Second Chances / Route Checks sections.
- The arrival-day booked cruise now targets Pier 79 by about 15:25 with a mandatory 15:40 meeting time. Slip 2 is specified by the supplied booking instructions; navigation uses the actual terminal address and planning estimates remain non-live.
- Holiday closures are screened for selected museums. A relaxed parade viewing window is preserved; it does not promise early front-row viewing.
- The departure day retains a fixed arranged airport transfer at approximately 17:00, with bags collected by 16:40 and arrival in the hotel lobby by 16:45. Final sightseeing stops are defined by the approved private itinerary. Confirm any transfer adjustment directly with the guide.
- Five-day synthetic regression tests are run in `scripts/test_day_audit.js`, alongside existing choice, venue, routing and subway tests, as part of the Pages deployment workflow.

**Important:** transfer estimates and venue hours are not live guarantees. Protected bookings survive conflicts, which are flagged for human resolution. Choice history and personal stops sync only after both devices join the same encrypted shared room; before pairing, all data stays on each device.

## Final-day coach, sunrise and encrypted checklists

- **Friday 27 November:** breakfast at the hotel from 07:00 to 10:00; check out **before 12:00**, leaving suitcases with hotel reception. The booked group transfer is by coach with a French-speaking guide, **approximately 17:00** from the hotel to JFK Terminal 1. The planner puts guests in the lobby by 16:45. This supersedes the earlier speculative noon/15:50 pickup. The private encrypted itinerary retains actual flight booking details.
- The approved five-day itinerary does not include an early sunrise crossing. Friday's daytime DUMBO and Brooklyn Bridge route is fixed.
- After unlock, **Trip Settings → Shared / offline → Open checklists** opens the existing encrypted **Departure & gifts** checklist. It has separate Lyna/Benjamin ticks, editable souvenirs and Bought/Packed markers, curated shops and live Google Maps search. There is no extra permanent packing launcher.
- All ticks and shopping notes are saved **encrypted locally with AES-GCM**. After the two phones have been paired, changes also synchronise through encrypted Cloudflare Durable Object storage, preserving Benjamin's and Lyna's independent checkboxes. Encrypted export/import remains available as a separate backup.
- The shopping suggestions and France customs caveats are informational. Store inventory, special holiday hours, carrier baggage conditions and customs exemptions need verification before purchase.

## Shared trip: Ben + Lyna on separate phones

The optional shared backend is an **independent** Cloudflare Worker (`cloudflare/sync-worker.js`) at `https://noux-sync.benjbongard.workers.dev`. It uses a SQLite-backed Durable Object with one strongly consistent document per randomly generated room. GitHub Actions deploys it automatically on changes to the Worker or its deploy workflow, provided the existing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` Actions secrets allow creating/deploying Workers.

**First verify** `https://noux-sync.benjbongard.workers.dev/health` returns `{"ok":true,...}`. Pairing remains local/offline until this service is deployed. If deployment fails, check **Actions → Deploy NOUX encrypted sync**; do not paste any API token or pairing code into chat.

1. On the first phone, open NOUX and unlock with the existing **private itinerary passphrase**. Open **Trip Settings → Shared / offline → Manage shared sync**, identify the device as Benjamin (or Lyna), then **Create our shared trip**. Wait for **Shared trip synced**.
2. Click **Copy pairing code** and deliver it privately to the other person. It begins with `NOUX1.` and contains a 128-bit random room ID plus a 256-bit random capability. **The code is a secret**, not an ordinary public link. Do not put it in a GitHub issue, URL, website setting, public chat or screenshot.
3. On the second phone, open the same NOUX URL, unlock with the **same itinerary passphrase**, choose **Lyna** (or Benjamin), paste the pairing code and choose **Join existing trip**.
4. Both browsers poll roughly every 6.5 seconds, and also synchronise after relevant local actions, focus and reconnection. Personal stop additions, itinerary choices and all checkboxes/bring-home items merge **by field or stable ID**. Ben and Lyna's packing ticks are independent. An offline device retains its local edits and submits them on reconnect.
5. Incoming checklist changes appear immediately in the open checklist. An already-open **React itinerary** cannot safely be rehydrated without its private source, so a small **View latest itinerary** prompt appears when another device changes choices or custom stops. Click to reload and enter the passphrase again. The new state is already stored locally before reload.

### Privacy, conflicts and recovery

- The Worker receives **only** authenticated AES-GCM ciphertext. The key is derived locally from the existing itinerary passphrase and vault salt; no passphrase, private itinerary plaintext, custom stop, gift or packing label is sent to Cloudflare. The random pairing token is sent over HTTPS solely as a bearer capability and is stored encrypted on each phone. Cloudflare retains a SHA-256 verifier of the capability, not the raw secret.
- Room writes use a monotonic revision with conflict rejection, followed by field-wise merge and retry. Distinct choices, separately identified stops and individual Bought/Packed/checklist ticks are preserved independently. **When the exact same field is edited simultaneously**, the newer device timestamp wins. Keep your device clocks set automatically.
- Browser storage is **not** replaced with a destructive remote snapshot. On initial pairing with an established room, shared fields win while locally unique custom stops and gifts are retained. If syncing fails, the website keeps working from its existing local copy.
- Pairing and synchronisation cache are encrypted in each browser. If a phone is lost or browser data deleted, unlock NOUX on the replacement device and enter the pairing code again. If you lose the code on both devices, the existing room cannot be recovered from public GitHub data; create a new room using the latest device copy and pair again.
- Embedded custom-stop photographs larger than about **180 KB** remain on the originating device to avoid breaking sync quotas; the stop's title, address, coordinates and other smaller fields still synchronise. You can transfer large photos separately using the existing custom-stop export feature.
- The shared room is **not a user-account login**: anyone with the pairing capability can read or replace its ciphertext, and anyone with **both** the pairing code and itinerary passphrase could decrypt the shared data. Share both separately and privately. No commercial-grade authentication, audit log, automatic revocation or guarantee against malicious authorised edits is claimed.
- Public code and scripts are safe to read. The password-protected vault remains encrypted client-side, not inaccessible via HTTP. Do not store additional personal secrets in custom-stop fields.

## Activate the optional MTA Cloudflare Worker

1. Create/authorise a Cloudflare Workers account.
2. In GitHub repository **Settings → Secrets and variables → Actions**, create secrets `CLOUDFLARE_API_TOKEN` (Workers Scripts edit + routes rights) and `CLOUDFLARE_ACCOUNT_ID`. Do not paste keys into chat.
3. Run **Actions → Deploy official MTA realtime proxy → Run workflow**.
4. The deploy log prints the `https://noux-mta-live.<your-subdomain>.workers.dev` address. Check its `/health` endpoint.
5. In **Settings → Secrets and variables → Actions → Variables**, add `MTA_PROXY_URL` with that address and rerun the Pages workflow; alternatively paste the URL once into the planner settings.
6. Confirm the planner displays real GTFS station-arrival predictions. Neither MTA nor the Worker provides verified door-to-door routing time. Before this configuration the MTA section explicitly shows as disconnected; no direct browser requests are made or invented. In GitHub Actions, run the Worker workflow only after the two secrets exist.

The passphrase is held by the owner, never in this repository. For upgrades, encrypt private modules locally and upload only the new ciphertext.
## Booking status reconciliation (23 November 2026)

- **Confirmed by the traveller:** Davis Family Butterfly Vivarium (Tue 24, scheduled 10:30), Guggenheim Museum (Tue 24, scheduled 13:30), Hudson VU Rooftop (Tue 24, scheduled 16:30), Mercer Labs (Thu 26, scheduled 11:30). Exact ticket or reservation entry times should be checked against the issued confirmations; no reference numbers are committed.
- **Waitlisted, not admitted:** Louie Vega at Superior Ingredients, The Room (Wed 25, scheduled 22:00). Registering for a waitlist is not a guaranteed entry ticket. The waiting-list checkbox becomes 'Ticket issued' only after an explicit traveller confirmation of admission, and is never automatically promoted from an old ticket-checkbox record.
- **Cross-device safety:** default booked statuses ship in the public approved itinerary and booking desk. User-specific existing booking confirmations, waitlist promotion, custom stops, checklists and pairing stay in local browser state and the encrypted shared sync service. No migrations wipe existing values.

## Daily Itinerary photograph renderer · 23 November 2026

The old encrypted React photo component could display a generic "New York" placeholder even though its photo sources existed. The new public **`day-photos.js`** renderer now binds 53/53 approved event IDs individually to 34 related local photographs and paints the actual local image over any React fallback using a CSS-only thumbnail overlay. It does not inject children into React, change the private vault, touch localStorage, or add a button.

This includes travel, hotel check-in/breakfast, confirmed admissions, Pier 79 boarding, the Golden Hour **cruise photo** (distinct from its ferry terminal), the Central Park transfer, the Rockefeller Center transfer, and Friday's airport return. Existing custom stops are excluded from fixed-event image substitution. The release build's `scripts/test_daily_photo_renderer.js` validates real local JPEG files and simulates card-level rendering, mobile day switching and unrelated custom stops.

For the full event-by-event photo list, see [the daily-photo audit](docs/NOUX_DAILY_PHOTOS_2026-11-23.md). Actual iPhone Safari display is not claimed verified until an unlocked-device smoke test. No stored user data should be cleared to update images.

## Daily photographs: follow-up fix for blank event cards (23 November 2026)

The first photo-renderer release only decorated `.event-thumb` elements. The private React application does not create that optional element for many itinerary events; the result was exactly the reported bug: Chelsea Market and Louie Vega showed photos while Whitney Museum, Little Island, Williamsburg transfers and vintage stops left the photo column blank. The corrected `day-photos.js` applies a verified image to the **always-present `.timeline .event` row**, using a CSS `::after` pseudo-element in the existing photo column. No React child is inserted and no private vault content or personal/sync data is modified. All 53 scheduled events now pass a new synthetic regression where most cards have **no** `.event-thumb`. Phone-width CSS displays each image beneath its event description, keeping the text readable. Photos retry after reconnection rather than caching a failed load permanently. The public image bundle still contains all 57 independently fetched images.

GitHub Actions can validate the generated images and synthetic card rendering, but an actual unlocked Safari/Chrome screen check remains needed before claiming real-device visual acceptance.
