# NOUX · Daily Itinerary Photograph Reconciliation

Date: 23 November 2026  
Scope: **every individual fixed Daily Itinerary event** across Monday to Friday, including transfers, breakfast, check-in, nightclub and departure events.

## Root cause and repair

Previously the GitHub Actions photo test checked downloaded assets and location keys, **not the actual `.event-thumb` rendered by the private React app**. The React image component could therefore display the decorative New York placeholder despite successful photo downloads. `day-photos.js` now maps all fixed event IDs explicitly and styles the existing thumbnail (including its old fallback) with the correct, downloaded local asset **after image-load verification**. It never inserts React-managed children or changes personal storage.

## Corrected mismatches

- Golden Hour harbour cruise at 16:00: the **cruise photo** replaces the Pier 79 terminal photograph. Transfer and boarding still use **Pier 79**.
- Central Park lunch/transfer: **Central Park scenery** replaces the Guggenheim exterior. The actual Guggenheim visit retains its museum photo.
- Transfer to Rockefeller Center: **Rockefeller Center** replaces the Rough Trade record-shop photograph. Rough Trade shopping retains its shop photo.
- Transfers and other context-dependent events use a real venue/area photo of the intended destination; this does not imply every illustrated landmark is itself an additional planned stop.

## Event-by-event inventory

### Monday 23 November

| Time | Scheduled event | Local photograph | Relationship |
| --- | --- | --- | --- |
| 10:55 | JFK arrival · immigration and baggage | `jfk.jpg` · JFK Airport · Terminal 1 departures hall | Venue or location photo |
| 13:30 | Hotel luggage drop · check-in if available | `hotel.jpg` · Sanctuary Hotel | Venue or location photo |
| 14:15 | Travel to Pier 79 · West 39th Street | `pier79.jpg` · Pier 79 · NY Waterway W 39th Street terminal | Venue or location photo |
| 15:25 | Pier 79 · Slip 2 · meet 15:40 | `pier79.jpg` · Pier 79 · NY Waterway W 39th Street terminal | Venue or location photo |
| 16:00 | Golden Hour harbour cruise | `cruise.jpg` · NYC Golden Hour Cruise | Related/illustrative photo |
| 19:30 | Times Square · first evening walk | `times.jpg` · Times Square · Manhattan evening lights | Venue or location photo |
| 20:00 | Quick dinner · Food wishlist choice | `tacos.jpg` · Los Tacos No. 1 · NYC restaurant counter | Related/illustrative photo |
| 21:15 | Dear Irving on Hudson · cocktails | `dear.jpg` · Dear Irving on Hudson · actual cocktail lounge | Venue or location photo |

### Tuesday 24 November

| Time | Scheduled event | Local photograph | Relationship |
| --- | --- | --- | --- |
| 09:00 | Hotel breakfast · included | `hotel.jpg` · Sanctuary Hotel | Venue or location photo |
| 10:30 | AMNH · Davis Family Butterfly Vivarium | `butterfly.jpg` · Davis Family Butterfly Vivarium | Venue or location photo |
| 12:00 | Lunch and transfer across Central Park | `oak.jpg` · Oak Bridge, Central Park | Venue or location photo |
| 13:30 | Solomon R. Guggenheim Museum | `guggenheim.jpg` · Guggenheim Museum exterior | Venue or location photo |
| 14:55 | Villa Albertine & Albertine Books | `albertine.jpg` · Albertine Books, 972 Fifth Avenue | Venue or location photo |
| 15:25 | Transfer to Hudson VU | `hudsonvu.jpg` · Hudson VU · skyline rooftop | Venue or location photo |
| 16:30 | Hudson VU · rooftop views | `hudsonvu.jpg` · Hudson VU · skyline rooftop | Venue or location photo |
| 17:15 | Return downtown / freshen up if practical | `bluenote.jpg` · Blue Note New York | Venue or location photo |
| 18:30 | Blue Note · arrive, take seats and dine | `bluenote.jpg` · Blue Note New York | Venue or location photo |
| 20:00 | Reuben James · live at Blue Note | `bluenote.jpg` · Blue Note New York | Venue or location photo |

### Wednesday 25 November

| Time | Scheduled event | Local photograph | Relationship |
| --- | --- | --- | --- |
| 09:00 | Hotel breakfast · included | `hotel.jpg` · Sanctuary Hotel | Venue or location photo |
| 10:00 | NYPL Schwarzman Building | `nypl.jpg` · NYPL, Rose Main Reading Room | Venue or location photo |
| 11:00 | Bryant Park Winter Village | `bryant.jpg` · Bryant Park Winter Village · skating pavilion | Venue or location photo |
| 11:30 | Travel from Midtown to Chelsea | `lobsterplace.jpg` · Chelsea Market · The Lobster Place oyster bar | Venue or location photo |
| 12:15 | Chelsea Market · lobster roll lunch | `lobsterplace.jpg` · Chelsea Market · The Lobster Place oyster bar | Venue or location photo |
| 13:10 | Whitney Museum | `whitney.jpg` · Whitney Museum · official entrance | Venue or location photo |
| 14:35 | Little Island | `little.jpg` · Little Island · architectural waterfront view | Venue or location photo |
| 15:00 | Transfer to Williamsburg | `domino.jpg` · Domino Park, Williamsburg | Venue or location photo |
| 15:50 | Domino Park · Manhattan skyline | `domino.jpg` · Domino Park, Williamsburg | Venue or location photo |
| 16:45 | Awoke Vintage | `awoke.jpg` · Awoke Vintage · Williamsburg shop interior | Venue or location photo |
| 17:30 | Stella Dallas · vintage shopping | `stella.jpg` · 10 ft Single by Stella Dallas · Williamsburg storefront | Venue or location photo |
| 18:30 | Dinner in Williamsburg · Mable's option | `mables.jpg` · Mable's Smokehouse · Williamsburg restaurant exterior | Venue or location photo |
| 19:30 | Williamsburg · music / drinks / explore | `domino.jpg` · Domino Park, Williamsburg | Venue or location photo |
| 22:00 | Louie Vega · Flashback at The Room | `superior.jpg` · Superior Ingredients indoor dancefloor (venue, not 25/26 Nov set) | Venue or location photo |

### Thursday 26 November

| Time | Scheduled event | Local photograph | Relationship |
| --- | --- | --- | --- |
| 09:00 | Hotel breakfast · included | `hotel.jpg` · Sanctuary Hotel | Venue or location photo |
| 10:00 | Grand Central Terminal | `grandcentral.jpg` · Grand Central Terminal | Venue or location photo |
| 10:40 | Travel to Lower Manhattan | `mercer.jpg` · Mercer Labs, Volumetric | Venue or location photo |
| 11:30 | Mercer Labs · immersive art | `mercer.jpg` · Mercer Labs, Volumetric | Venue or location photo |
| 13:20 | Sadie's Seaport · lunch | `sadies.jpg` · Sadie's Seaport · official restaurant dining room | Venue or location photo |
| 14:30 | DAYDREAM · Balloon Museum | `daydream.jpg` · Balloon Museum · DAYDREAM art installation | Venue or location photo |
| 16:00 | Seaport → Lower East Side | `colbo.jpg` · Colbo Next Door · Lower East Side listening bar / boutique | Venue or location photo |
| 17:00 | Colbo Next Door · listening & natural wine | `colbo.jpg` · Colbo Next Door · Lower East Side listening bar / boutique | Venue or location photo |
| 18:10 | Transfer to NoMad and light dinner | `nubeluz.jpg` · Nubeluz, The Ritz-Carlton NoMad | Venue or location photo |
| 19:30 | Nubeluz · panoramic cocktails | `nubeluz.jpg` · Nubeluz, The Ritz-Carlton NoMad | Venue or location photo |

### Friday 27 November

| Time | Scheduled event | Local photograph | Relationship |
| --- | --- | --- | --- |
| 09:00 | Breakfast · check-out · leave luggage | `hotel.jpg` · Sanctuary Hotel | Venue or location photo |
| 10:00 | Subway to DUMBO | `dumbo.jpg` · DUMBO Washington Street · Manhattan Bridge view | Venue or location photo |
| 10:40 | DUMBO · Washington Street / waterfront | `dumbo.jpg` · DUMBO Washington Street · Manhattan Bridge view | Venue or location photo |
| 11:40 | Walk to Brooklyn Bridge pedestrian access | `bridge.jpg` · Brooklyn Bridge · pedestrian promenade | Venue or location photo |
| 12:00 | Walk Brooklyn Bridge toward Manhattan | `bridge.jpg` · Brooklyn Bridge · pedestrian promenade | Venue or location photo |
| 13:00 | Golden Diner · lunch | `golden.jpg` · Golden Diner · named restaurant's signature food | Venue or location photo |
| 14:00 | Transfer to Rockefeller Center | `rockefeller.jpg` · Rockefeller Center | Related/illustrative photo |
| 14:35 | Rough Trade Below · Rockefeller / last shops | `rough.jpg` · Rough Trade Below · Rockefeller Center record shop | Venue or location photo |
| 16:15 | Collect luggage at the hotel | `hotel.jpg` · Sanctuary Hotel | Venue or location photo |
| 16:45 | Group coach boarding · hotel lobby meeting | `hotel.jpg` · Sanctuary Hotel | Venue or location photo |
| 21:30 | Flight departure from JFK | `jfk.jpg` · JFK Airport · Terminal 1 departures hall | Venue or location photo |

## Release acceptance criteria

- Every approved event ID is mapped, exactly once, to a named `assets/photos/*.jpg` file whose image bytes, provenance and source were checked in the build.
- The card-level renderer is regression-tested with a synthetic DOM on all five days; it must paint the image over the placeholder and correctly update when days change.
- Private custom stops are not assigned an arbitrary fixed-itinerary photograph.
- The offline pack now includes the three additional event-specific photo files (cruise, Central Park and Rockefeller), as well as every venue photo required by the scheduled plan.
- A successful build does **not** constitute a real iPhone/Safari visual inspection. Validate after deployment on the actual device without deleting browser data.
