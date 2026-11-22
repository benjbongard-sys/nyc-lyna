# NOUX Private Edition

A password-unlocked, encrypted personal trip planner hosted on GitHub Pages.

## Cross-device login resilience (22 November 2026)

The site no longer rejects successful decryption merely because **React takes longer than 700 ms**, the first paint contains fewer than 40 characters, or an unrelated JavaScript error occurs. It waits for an actual rendered app and keeps the core planner available even if an optional module cannot initialise.

If the visual React interface genuinely cannot mount, NOUX opens a **read-only emergency itinerary derived from the successfully decrypted trip**, with day-by-day stops, statuses, verified addresses and Google Maps directions, plus a Print / save itinerary action. It does **not** request the passphrase again, offer a looping Basic itinerary button, change saved choices, erase cache storage, reset Cloudflare pairing or overwrite the encrypted checklist. A late React mount can dismiss this emergency view automatically.

Use **no browser-data-clearing instructions** for recovery: browser storage contains pairing information and potentially unsynchronised edits. On release, scripts and the offline cache are versioned `20261122-login1`. The `scripts/test_unlock_recovery.js` CI suite checks immediate/slow/short first paint, unrelated errors, emergency fallback and the formerly looping basic mode. This is a synthetic regression gate, not a substitute for testing Safari/Chrome on real devices.

## Apply the final privately approved five-day route (22 November 2026)

The detailed 23–27 November route is **not committed as plaintext**. Public `trip-revision.js` accepts the approved private JSON **only after normal NOUX unlock**. The existing in-memory AES-256-GCM key encrypts the approved route in browser storage, with a separate authenticated encryption context. Original private vault, passphrase, packing and saved choices are not overwritten. An atomic ciphertext value is included in the existing end-to-end shared sync and becomes visible on another paired device after reopening NOUX.

To apply the final route, download the private approved-plan JSON from the conversation. Unlock NOUX and open **Trip Settings → Shared / offline → Approved itinerary → Import approved plan**, select the file, and choose **View updated itinerary**. Never upload private JSON to GitHub or public issues. The approved route replaces archived schedules in the original day planner and its map, transit, calendar and search views. Independently added custom stops and separately confirmed commitments are retained. Obsolete sunrise/roof/nightlife choice cards no longer drive the itinerary. **The final day is fixed** in the private approved itinerary. Older weather-dependent substitutions and unselected alternatives cannot replace it. Tickets not explicitly confirmed remain marked unbooked.

After encrypted sync, the other paired browser can reload and unlock to see the same plan. When unpaired, import locally on the second device or pair first. The code push cannot decrypt or replace the original private vault remotely without the owner's passphrase; import is the safe way to activate this revision without exposing travel details.

## Privacy and security model

The published itinerary is encrypted locally using AES-256-GCM. Its PBKDF2 passphrase is **never included in the repository or GitHub Actions secrets**, and is never transmitted to a backend. The public HTML/CSS entry screen, venue images and dependency bundles can be downloaded without authentication; the AES-encrypted itinerary cannot be decrypted without the private passphrase. This is **client-side content encryption, not server-side HTTP access control**. Real private access restrictions require a separate authenticated host (such as Cloudflare Access or a private app server).

This repository had earlier unencrypted revisions. Replacing the current branch does **not guarantee deletion of prior commits, GitHub caches, forks or workflow artifacts**. Do not rely on the gate for complete erasure of previously published details. In the GitHub repository settings, consider private hosting or a new repository and Cloudflare Access for stronger privacy.

## Deployed features

- Cinematic unlock animation; itinerary encrypted at rest.
- Complete dynamic daily schedule, choices and travel estimates, and independently recorded bookings.
- Global search (Cmd/Ctrl+K) across all itinerary stops and wishes.
- All-stops MapLibre vector map using OpenFreeMap, with selected visits, alternatives and custom pins. No requests to blocked OpenStreetMap volunteer tile servers.
- Departure-day itinerary returns to the hotel for stored luggage before the **arranged guided group coach at approximately 17:00 on Friday 27 November**. The exact lobby boarding time is subject to the travel organiser.
- Official MTA subway GTFS-Realtime feed client, via a deployable Cloudflare Worker. Without an authorised Worker, no direct blocked browser requests or fabricated arrivals are shown.
- Verified venue photographs bundled locally during GitHub Pages Actions builds.
- Custom-stop editor: add, edit, remove and position a stop, search a NYC address with Photon after a button click, look up a relevant Wikipedia photograph and description, upload your own photo or provide an HTTPS image link.
- Selecting a custom stop immediately updates the relevant day, changes the map and calendar export, estimates travel buffers and moves flexible stops when possible. Fixed appointments (especially the booked Monday cruise and Friday transfer pickup) never move; conflicts are clearly flagged. These are planning estimates, not certified travel times or validated venue opening hours.
- Personal custom stops remain local until **Shared trip sync** is paired. Once enabled, custom stops and saved choices are end-to-end encrypted and automatically copied to the partner's paired browser. Offline edits remain local until connectivity returns. Never enter access tokens or passwords in custom-stop fields.


## Food wishlist additions (21 November 2026)

The public `food-wishlist.js` extension adds up to 13 curated NYC food suggestions to the **existing** native `food` wishlist category **only after the encrypted itinerary unlocks**. It retains existing wishlist entries and their priorities, recognises common naming variants to avoid duplicates, and marks four newly introduced classics as core: Katz's, Shake Shack, Joe's Pizza and L'Industrie. Other new food entries are optional, with no preselected day.

The enhancer does not modify the ciphertext, local or shared user preferences, booked events, or the route planner. Both devices receive the same public list with the latest deployed code. The additions are not reservations, and menus, pricing and Thanksgiving hours must be checked before visiting.

**Food place details (21 November 2026).** `food-wishlist.js` now carries branch-specific public metadata for all 13 picks: full street address, official site, published standard hours, known holiday exception, best-fit itinerary day, approximate visit duration and concise geographical advice. `food-guide.js` renders those details in a responsive panel **outside React's managed root**. Open it via the **Food details & hours** control while the native Wishlist is visible, by clicking a recognised Food wishlist card, or through **Explore → Food locations & hours**. Each listing offers directions and a current Google Maps hours search. No client API keys, background requests or new reservations are involved.

Restaurant hours are **not** live opening guarantees. Official holiday notices are preserved: Russ & Daughters and Lobster Place are closed on Thanksgiving 26 November, while Katz's advertises an early 18:00 closing. Levain's pop-up and Magnolia Bakery have differing published regular hours across official sources; the guide explicitly discloses this. An unknown personally added Food wish receives a labelled "location/hours not verified" fallback with a search link rather than invented details. The guide never changes the native four-element Wishlist row or app's day plans.


## Simpler NOUX navigation · 21 November 2026

After feedback on the growing UI, the duplicated **Travel Companion** has been removed from the published site. The separate GO, weather, Tickets and Nearby panels were duplicating capabilities already present in the main itinerary, Map/MTA, Wishlist and decision cards. There is no Travel Companion floating button, and the original React navigation and encrypted itinerary are unchanged.

The deliberately small contextual structure is:

- **Trip Settings → Shared / offline**: open the original settings gear in the NOUX header. A small portal-owned **Shared / offline** action appears next to its heading (on narrow phones it reads **Sync**). It opens a technical mini-section containing the real **Shared Trip** pairing/status controls, the previously existing **encrypted Offline Essentials** download/status/remove functionality, and a link to the existing **Departure & gifts** checklists. There is no permanent Shared Sync, Packing or Offline launcher while browsing. The native Settings React DOM is **not modified**.
- **Explore → Guide our decisions**: a lightweight tour for Lyna (or Benjamin) that reads exactly the actual `NYC_DATA.CHOICES` list. It displays the current selection, delegates a choice to the original React **Decisions** card, and tracks independent reviewed/decide-later progress in the existing choice journal. The progress already syncs between paired devices. It does not duplicate GO, weather, maps, bookings or any separate itinerary state.
- **Wishlist → Food card**: click the existing Food wish to see verified branches, addresses, published hours, holiday warnings and one-tap directions. The full Food guide is also accessible from **Explore**, but it has no permanent floating button.
- **Itinerary / Map / MTA**: retain their already existing schedules, walking/subway directions, train predictions and booked/proposed statuses. No duplicate GO or forecast screen is loaded.
- **Explore** is the remaining original floating shortcut. All other new features are contextual, so the visitor does not have to navigate a pile of overlapping buttons.

### Offline pack and safety

A service worker is still registered **after successful unlock and a healthy first React render**. To save offline content, open **Trip Settings → Shared / offline → Save offline pack** separately on each phone. It saves only public app assets and the **AES-256-GCM encrypted vault**; the passphrase, decrypted itinerary, pairing credentials and live MTA predictions are never stored in the pack. Reopen NOUX once in airplane mode on each device to validate locally. Google Maps routes, MTA real-time feeds and fresh hours require internet. Clearing this offline pack does not clear choices, shared pairing or the encrypted packing/souvenir list.

The code intentionally uses **body-owned modals and settings-only overlay controls** rather than inserting children into React-owned headers or dialogs; this protects against the prior blank-screen regression. Dedicated `test_decision_guide.js` and `test_trip_settings_tools.js` tests replace the old redundant Travel Companion suite. The encrypted site, existing data keys, original Decision controls and return-coach commitments remain untouched.

## Route-quality safeguards

The public `choice-orchestrator.js` and `day-audit.js` layers run only **after** decryption and read the existing private itinerary; they do not embed private reservations or the passphrase.

- Wednesday defaults to a Manhattan-first afternoon, with optional Williamsburg skyline/oysters/vintage alternatives; a theatre performance and an indoor house-music event are independent selections.
- The optimiser uses tighter photo and focused-gallery durations, clusters nearby stops, inserts honest transfer buffers, and retains dismissed choices in the Explorer's Second Chances / Route Checks sections.
- The arrival-day booked cruise keeps a 60-minute pier transfer and 30-minute boarding window free of speculative extras. Exact pier and actual travel times are read from the booking, not inferred.
- Holiday closures are screened for selected museums. A relaxed parade viewing window is preserved; it does not promise early front-row viewing.
- The departure day preserves a Midtown shopping route while treating the **arranged guided coach around 17:00 on Friday 27 November** as fixed, with bags collected by 16:40 and guests in the lobby by 16:45. Confirm any adjustment directly with the group guide.
- Five-day synthetic regression tests are run in `scripts/test_day_audit.js`, alongside existing choice, venue, routing and subway tests, as part of the Pages deployment workflow.

**Important:** transfer estimates and venue hours are not live guarantees. Protected bookings survive conflicts, which are flagged for human resolution. Choice history and personal stops sync only after both devices join the same encrypted shared room; before pairing, all data stays on each device.

## Final-day coach, sunrise and encrypted checklists

- **Friday 27 November:** breakfast at the hotel from 07:00 to 10:00; check out **before 12:00**, leaving suitcases with hotel reception. The booked group transfer is by coach with a French-speaking guide, **approximately 17:00** from the hotel to JFK Terminal 1. The planner puts guests in the lobby by 16:45. This supersedes the earlier speculative noon/15:50 pickup. The private encrypted itinerary retains actual flight booking details.
- **Brooklyn Bridge sunrise:** a non-ticketed photo-and-walking excursion can be selected for **Wednesday** (default, approximately 06:54 sunrise), **Friday** (approximately 06:56) or skipped. The proposed DUMBO waterfront photo session leads into a Brooklyn → Manhattan pedestrian bridge crossing; travel and dawn weather need rechecking.
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