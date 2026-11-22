# NOUX | Full Pre-Departure Technical & Functional Audit
Date: 22 November 2026
Scope: repository main branch, public first-party frontend modules, approved five-day sightseeing source, published booking and food records, Cloudflare sync design, GitHub Pages build, mobile integration, offline assets, and synthetic regressions.

## Executive verdict

**CONDITIONAL GO.** The approved plan is internally consistent across the public application modules, but source-level regression tests cannot prove that the latest site is deployed and operates correctly on both actual iPhones or laptops. The precise cruise departure pier, as printed on the ticket, remains unverified. Ticket and reservation purchases must not be assumed.

This review does not claim to have inspected the plaintext of the original React app embedded inside the AES-GCM encrypted vault. The encrypted envelope and its metadata were inspected, and the publicly versioned modules that integrate with that app were audited. The approved sightseeing plan is independently accessible as a public JavaScript asset and is NOT confidential.

## Quantitative baseline

| Indicator | Confirmed in source |
| --- | ---: |
| Approved dates | 23, 24, 25, 26 and 27 November 2026 |
| Approved itinerary events | 53 (Mon 8, Tue 10, Wed 14, Thu 10, Fri 11) |
| Booking desk records | 16; every record maps to a real approved event |
| Curated Food profiles | 15, including Sadie's and Golden Diner |
| Scheduled event IDs with missing venue location | 0 |
| Scheduled place IDs missing route-guide notes, before audit | 4 |
| Scheduled place IDs missing route-guide notes, after audit | 0 |
| New automated integrity gate | scripts/test_integrity_audit.js |
| Public vault encryption metadata | AES-256-GCM, PBKDF2 with 320,000 iterations |

Counts represent repository content, not independently observed live sessions, completed visits or purchased tickets.

## Component audit and decisions

| Component | Verdict | Evidence and limitation |
| --- | --- | --- |
| Login and recovery | Source regression passed | 700 ms/40-character false failures and repeating basic-mode recovery retired. A read-only decrypted schedule exists. Real Safari/Chrome deployment unverified |
| Overview | NEEDS PRIVATE APP UPDATE | React vault still shows language about jointly changing decisions in real time and the old one-cruise highlight. Decisions are retired; source cannot be safely edited via a public overlay without re-encrypting the original private bundle |
| Five-day itinerary | PASS, subject to voucher data | Five approved days installed automatically after unlock, Friday DUMBO/Bridge fixed, no import or obsolete decision required |
| Explore | FIXED | Approved-mode branch now shows scheduled days, the next planned stop, booking checks and links to native Map, Wishlist, Routes and Tickets. No stale pace, second chances or fictional completion metrics |
| All-stops Map | SOURCE TEST PASS | Scheduled/All filter retains native map, distinguishes explicitly optional markers even if co-located with an approved stop. Real iPhone map pin identity and route display require smoke test |
| Walking/transit routes | CONDITIONAL | Event-to-event movement is based on geographic heuristics, not real door-to-door arrival predictions. Google Maps opens user-initiated current directions |
| Cruise departure | BLOCKED BY VOUCHER | A published map coordinate is explicitly an approximate placeholder, not a verified boarding pier. The route guide now suppresses invented estimated legs to that destination. Exact pier and boarding cutoff must be sourced from the ticket |
| Tickets and reservations | FUNCTIONAL, CONTENT INCOMPLETE | 16 entries match approved event IDs. Previously booked/arranged records are protected; new reservations are manual. Do not infer purchases from the route |
| Wishlist / Food | SOURCE TEST PASS | 15 address-level curated profiles, mapped priority days; existing user wishes and alternatives preserved; posted hours and holiday details are not live opening claims |
| Venue context | FIXED | Added notes to Times Square, Los Tacos, Dear Irving and Mable's. All scheduled venue IDs now have route-guide context |
| Official live MTA | DEPENDENCY | Native MTA feed uses a Cloudflare Worker and can supply real-time arrivals only when live provider and Worker are available. Route estimates must not be described as live |
| Shared device sync | SOURCE TEST PASS | Pairing and cached synced records use locally derived AES-GCM, and the worker stores an opaque document. Local packing ticks and stop edits are reconciled. A real two-device post-deployment trial is still required |
| Departure and gifts | SOURCE TEST PASS | Separate encrypted packing and souvenir data, saved local state and shared sync integration. No data reset was introduced |
| Offline essentials | FIXED | Readiness now verifies all required public assets AND the encrypted vault. It no longer reports Ready merely because the shell page plus vault exist. Browser Cache Storage can still be evicted |
| Settings UX | FIXED | The contextual Sync shortcut has been moved within the tappable viewport rather than above the native Settings modal near an iPhone notch |
| Build and privacy | CONDITIONAL | GitHub Actions gates synthetic tests; latest deployed result not independently certified. Public approved-week.js discloses travel venue names, dates and approximate times; robots.txt disallow is not confidentiality. No package-lock.json is versioned, so transitive npm resolution is less reproducible |

## Verified public-event facts

1. Blue Note's official 24 November Reuben James page confirms an 20:00 performance, doors at 18:00, a $20 minimum per person, and first-come-first-served seating. The chosen 18:30 dinner arrival may not secure first-choice seats.
   Source: https://www.bluenotejazz.com/nyc/tm-event/reuben-james-featuring-chris-dave-and-david-dj-ginyard/
2. Resident Advisor lists Louie Vega at Superior Ingredients on Wednesday 25 November from 22:00 to 04:00, so 00:45 in the selected itinerary is the travellers' intended departure, not the official end.
   Source: https://ra.co/events/2567360
3. The Seaport confirms Sadie's Thanksgiving brunch on Thursday 26 November from 10:00 to 15:00, consistent with the planned 13:20 lunch; a table is not automatically reserved.
   Source: https://theseaport.nyc/events/thanksgiving/

The selected schedule was not re-optimised. The boarding window at the hotel around 17:00 on Friday is not a 25-minute journey to the airport; this has been clarified in the event description.

## Priority issues not yet resolved

### P0 | Before leaving

1. **Cruise voucher:** verify the exact boarding pier, terminal, check-in deadline and transport route. Do not use the approximate map pin as navigation.
2. **Booking checks:** purchase or verify required admissions and venue bookings independently. The tracker can record confirmation but does not buy tickets. Key planned events include Butterfly Vivarium, Guggenheim, Blue Note, Whitney, Louie Vega, Mercer Labs, DAYDREAM, and rooftop seating where required.
3. **Production smoke test:** open the *latest deployment* on both phones, unlock, confirm all five approved days, verify the correct Friday DUMBO-to-Bridge route and confirm Explore and the Map filter work without a blue recovery screen.
4. **Transfer and flight:** confirm the operator's exact Friday lobby time and retain travel documentation. The approved schedule aims for the hotel lobby before 17:00.
5. **Offline test:** on each phone individually, save a complete encrypted offline pack, verify the app reports all required assets, then test re-opening while in airplane mode. Never clear Safari's website data to force recovery.

### P1 | Privacy and operational reliability

6. The public approved-week sightseeing schedule is readable without the private passphrase; this contradicts an expectation of a fully confidential itinerary. To correct it fully, migrate the approved data into an encrypted private bundle and re-encrypt with the owner's key. Do not paste the passphrase into GitHub.
7. The private React Overview still contains outdated copy and visuals from earlier choices. Updating it properly requires a controlled private-vault source release, not public DOM manipulation.
8. Map filtering depends partly on the original MapLibre marker classes and geographic coordinates. Synthetic tests cover co-located options, but iPhone browser acceptance is still required.
9. Venue holiday openings remain uncertain for some optional stops, notably Colbo Next Door and certain Friday dining options. Present these as conditional rather than guaranteed.

### P2 | After the trip or once stable

10. Reduce public legacy source modules that remain for compatibility despite the fixed plan. Do not remove them immediately before departure without browser regression coverage.
11. Introduce a version-controlled lockfile and use reproducible dependency installation for GitHub Pages builds.
12. Improve permanent source-of-truth ownership across approved-week.js, booking-desk.js, food-wishlist.js and route-guide.js, generating consistent derived content rather than duplicating manually updated details.
13. Test accessibility beyond mobile CSS: reduced-motion, keyboard focus return, screen-reader modal focus trapping and 320 px portrait layout.

## Fixes made during this audit

- Rebuilt Explore's approved-plan content to replace retired decisions and approximate Wishlist-completion metrics with actual scheduled days and booking checks.
- Completed contextual route notes for four scheduled destinations that were missing them.
- Corrected the offline-ready test to check every required cached public asset, with an explicit missing-unlock-script regression.
- Moved the iPhone Settings Sync shortcut away from the notch/toolbar unsafe area.
- Clarified in the approved plan that 00:45 on Louie Vega night is the planned departure and Friday's hotel coach block is boarding, not a 25-minute drive.
- Prevented a co-located optional map pin from incorrectly appearing in Scheduled mode.
- Prevented the route guide from offering a fabricated journey estimate to the unverified cruise pier.
- Updated stale README descriptions of the approved trip, current Food catalogue and archived Decisions.
- Added a source consistency gate that validates 53 event IDs, all 16 booking references, all route-guide context keys, 15 Food profiles, fixed Friday and public-source privacy exclusions.

## Explicit limits and release sign-off

No assertion is made that a green GitHub Pages workflow, a complete airport transfer, real-time subway arrival, booked admission or a currently open restaurant has been personally verified merely by code inspection. No contact with real iPhone browser sessions was possible in this source audit. The encrypted private React bundle was not decrypted. The public itinerary and approximate event dates are already visible in the repository.

**Recommendation:** deploy the audited source and run the five-step phone smoke test. With a verified cruise pier, required tickets, working login, current itinerary and correct settings/sync states, NOUX can be treated as suitable for trip use. Until then, the release remains CONDITIONALLY READY rather than fully signed off.
