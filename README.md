# Phoenix Field Live

Build "PSI Games Live Crew Control" — a mobile-first production-operations PWA for a three-person documentary crew (Mojo Phoenix Productions) covering PSI Games 2026 at The Westin Charlotte, July 31 – August 2, 2026.

This is a working field instrument used one-handed in a crowded ballroom. Not a dashboard, not a spreadsheet on a phone.

THIS TURN: build the foundation, design system, time engine, travel engine, and the Live screen. Stub the Timeline/Interviews/Log/Wrap routes only.

## Branding
Dark charcoal base (#0E1013 background, #171A1F surfaces, #333A45 borders), warm phoenix-gold accent (#E9A13B, bright #FFC768), white text (#F1F3F5), muted #98A1AC. Green (#2FCF7C) ONLY for confirmed/complete. Red (#FF5257) ONLY for critical conflicts, missing releases, or unsafe media. No gradients, no decorative animation. All times, countdowns and durations use a tabular-numeral monospace face; body text in the system sans stack. Small gold phoenix mark in the header that never takes working space.

Priority pills: MUST = solid gold. HIGH = gold outline. OPTIONAL = muted grey. BACKUP = dashed dim grey.

## Time engine (get this exactly right)
The crew's phones may be in any timezone but the event runs on America/New_York. Compute current Charlotte wall-clock time with Intl.DateTimeFormat({timeZone:'America/New_York'}) and formatToParts — never rely on the device timezone or raw Date arithmetic. Represent schedule times as minutes-from-midnight integers. Add a time simulator (ms offset plus a jump-to-time input) so the crew can rehearse a block, with a SIM badge in the header when the offset is non-zero.

## Travel engine (the app's signature feature)
The crew sleep in three different buildings. Hard-code these verified coordinates:
- The Westin Charlotte (venue), 601 S College St — 35.2221036, -80.8472698
- JW Marriott Charlotte (Duane), 600 S College St — 35.2223858, -80.8481961
- Element by Marriott Charlotte Uptown (Jesse), 650 S Caldwell St — 35.2199832, -80.8460039
- Home2 Suites by Hilton Charlotte Uptown (Brad), 610 S Caldwell St — 35.2201969, -80.8453622

Building-to-building minutes = haversine distance x gridFactor 1.4, divided by walk speed (62 m/min carrying camera gear, 80 m/min light), plus exitBuilding 2 min, plus enterVenue 3 min when the destination is the Westin (finding a 2nd-level meeting room) or enterLobby 2 min otherwise, plus 2 min contingency only when the walk itself exceeds 3 min. These should produce roughly: Jesse Element to Westin 13 min with the rig, Brad Home2 to Westin 14 min, Duane JW to Westin 7 min light, Element to Home2 6 min. Verify your implementation lands on those numbers.

Inside the Westin use a room-to-room minutes matrix over the nodes Main Stage, Promenade, Tryon, Harris, Trade, Kings, Lobby, Staging, Outdoor — default 3 min, with Main Stage/Promenade 4, Main Stage/Kings 4, Main Stage/Staging 2, the Tryon-Harris-Trade cluster 2 between each, Kings/Lobby 3, Lobby/Staging 2, anything/Outdoor 5-6. Add 1 min hallway congestion whenever the room actually changes. Then add setup time: full rig 6 min, run-and-gun 2 min, formal interview 8 min, teardown 4 min.

Map raw room strings onto those nodes: anything containing "Duane" resolves to the JW Marriott BUILDING (Duane's room is not in the Westin — this matters a lot), "Element" to Element, "Home2" to Home2, "Platinum" or "outdoor" to Outdoor, bare "Westin" to Lobby.

Every travel estimate must return a readable breakdown array (label plus minutes per leg) because the crew need to see WHY the app says 13 minutes.

Put all these constants in an editable settings object with a UI to change them. The crew will walk the routes on arrival and calibrate. Every warning in the app depends on these numbers, so say that in the settings UI.

## Data model
TypeScript types for ScheduleItem: id, date, startMin, endMin, startLabel, endLabel, title, presenter?, roomOfficial, room, priority ('MUST'|'HIGH'|'OPTIONAL'|'BACKUP'), kind ('official'|'crew'), jesse?, duane?, brad?, goal?, release?, minors?, incomplete?, move?, soft?, and commit: {jesse:boolean, duane:boolean, brad:boolean}.

The commit flags matter enormously. Crew assignment text is often advisory ("Possible scout", "Cover only if access is approved", "Do not leave Main Stage unless reassigned"). Advisory lines are OPTIONS, not commitments, and must never raise a conflict later. Only real commitments do.

Crew: Jesse Cudworth (lead cinematographer, owns camera and technical feasibility, sleeps at the Element), Duane Mantey (documentary lead, owns story priority, sleeps at the JW Marriott), Brad (operations, owns logistics, changes, interview coordination and releases, sleeps at Home2).

Statuses: Pending, In Position, Filming, Complete, Changed, Skipped.

## Persistence
Local-first this turn: persist crew state (statuses, live changes, notes, positions) to IndexedDB or localStorage so it survives closing the app and works with no signal. Put the data layer behind a clean repository interface so Supabase can be added later without redesigning the UI. Do not add Supabase yet.

## Non-negotiable product rule
Official program values are never silently overwritten. When anything changes, store the original official value AND the current operational value, plus editor, timestamp and reason. Every change must be revertible back to the official value.

## Live screen (the app opens here, focused on the current block)
- Sticky header: phoenix mark, "PSI GAMES LIVE", Mojo Phoenix plus day label, live ET clock with seconds, role switcher (Jesse / Duane / Brad), sync state chip, warning-count button.
- NOW card: priority pill, room pill, official time range, a large countdown to end of block that turns red under 5 minutes, progress bar, session title, presenter, capture goal, all three crew assignments with the active role highlighted, and release requirement. Overdue banner when a MUST item has been running over 5 minutes and is still Pending.
- Up to five breakout rooms run at once, so pick ONE lead item for the NOW card (prefer items the active role is assigned to, then by priority, then earliest start) and list the rest under "Also running now" as tappable rows.
- Status buttons: all six, one tap each, 44px minimum tap targets, two rows of three.
- Quick actions: Ops decision, Log change, Reassign crew, Interview now, Release needed, Gear/card.
- "LEAVE BY" card — the signature element. For the active crew member find their next assigned item in a different room, compute travel plus setup, and show a leave-by clock time and a live "LEAVE IN Xm" countdown that turns gold at 5 minutes and red when negative ("LEAVE NOW · 3m LATE"). Show the full per-leg breakdown underneath.
- Crew position strip: Jesse / Duane / Brad each with current room, current task, and a dropdown to set position manually (a manual position wins for 90 minutes, otherwise infer from the schedule). Footer line showing the three hotel walk times.
- "Next three for [role]" then the rest of the day as compact tappable cards with inline In Position / Filming / done buttons.

Handle gaps gracefully: at 3:25 PM Friday and a few other transition moments nothing is scheduled, so show a clean "No scheduled block — next: ..." state rather than an empty screen.

## Navigation
Five bottom-nav destinations: Live, Timeline, Interviews, Log, Wrap. Settings and import/export in a header menu. No horizontal scrolling at 380px width. Respect prefers-reduced-motion.

## Seed data for this turn
Create src/data/schedule.ts exporting a typed SCHEDULE array seeded with these real Friday 2026-07-31 rows so the app is alive immediately. More days get added next turn, so keep the file trivially extensible.

1. 8:00-9:00 AM, room "Element to Westin", MUST, crew, move:true, title "Crew prep: Jesse breakfast, gear check, walk to Westin; verify credentials and filming restrictions", jesse "Full kit ready; confirm access" (commit), goal "Ready-to-shoot kit; organizer contact confirmed"
2. 9:00-10:30 AM, Promenade, MUST, official, "Registration & Badge Pickup (2nd level promenade)", jesse "Primary coverage: signage, arrivals, vendors, crowd" (commit), goal "Opening montage + venue establishing shots", release "General crowd coverage"
3. 10:30-11:00 AM, Main Stage, MUST, official, "Welcome Remarks", presenter "Hakim Isler, Anne Palmer", jesse "Clean stage + audience reactions" (commit), goal "Event framing and founder remarks", release "Track Hakim interview opportunity"
4. 11:00-11:45 AM, Main Stage, HIGH, official, "Keynote: From Practice to Theory: What Psi Reveals About the Nature of Reality", presenter "Dr. Simon Duan", jesse "Approved stage coverage + transitions" (commit)
5. 11:45 AM-12:30 PM, Main Stage, HIGH, official, "Keynote Fireside Chat", presenter "Anne Palmer + Laura Lynne Jackson", jesse "Stage, audience, entrances/exits" (commit)
6. 12:30-1:15 PM, Main Stage, HIGH, official, "Presentation", presenter "Thomas Campbell", jesse "Recommended primary room" (advisory, commit false)
7. 12:30-1:15 PM, Tryon, BACKUP, official, "The Science Behind Energy Healing: From Practice to the Lab", presenter "John Kruth", jesse "Cover only if story/access outweighs Main Stage" (advisory)
8. 12:30-1:15 PM, Harris, OPTIONAL, official, "Born Already Perceiving: What Children Know Before the World Teaches Them to Doubt It", presenter "Dr. Iya Whiteley", minors:true
9. 12:30-1:15 PM, Trade, OPTIONAL, official, "Behind the Curtain: Lessons from Practical Remote Viewing Work", presenter "Jana Rogge"
10. 3:30-4:15 PM, Main Stage, MUST, official, "Presentation", presenter "Chris Bledsoe", jesse "Primary professional coverage" (commit), duane "Story observation; potential follow-up" (advisory), brad "Audience reactions + names/timing" (commit), goal "High-value speaker anchor"
11. 6:00-6:30 PM, Main Stage, HIGH, official, "Kids Panel: Next Generation of Psioneers", presenter "Nicola Farmer, Theo Kowalski, Dalbus Jordan, Axel Desbien, Nikhila Mhetre", minors:true, brad "Primary backup coverage; track guardian releases" (commit), release "Guardian release required for minors"
12. 6:00-6:30 PM, Trade, MUST, official, "The Magic of Plasma & Consciousness", presenter "Dana Kippel", jesse "Recommended primary coverage" (commit), duane "Interview / relationship priority" (commit), goal "Priority Dana Kippel session + interview lead"
13. 6:30-8:00 PM, Main Stage, MUST, official, "COMMUNITY EVENT: Superhuman 2 Film Screening + Panel Discussion", jesse "Permitted screening/panel coverage" (commit)

Make it obviously correct and obviously fast. Clean component boundaries, no dead code.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1569aa47-0a6f-4049-884f-ddd0d17ab704).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
