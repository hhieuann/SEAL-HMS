# Actors & Features

## The five actors

There are only **four account roles** (`ADMIN`, `STAFF`, `LECTURER`, `STUDENT`), but five actors —
because *Judge* and *Mentor* are not accounts. They are per-event responsibilities a lecturer is
assigned to (`AssignmentRole` = `JUDGE` | `MENTOR`).

```
Account role                    Per-event responsibility          Actor at review time
────────────                    ────────────────────────          ────────────────────
ADMIN ──────────────────────────────────────────────────────────> Admin
STAFF ─────────────────> assigned to an event ─────────────────-> Event Staff
                    ┌──> JUDGE assignment on a track ──────────-> Judge
LECTURER ───────────┤
                    └──> MENTOR assignment on a team ──────────-> Mentor
STUDENT ────────────────────────────────────────────────────────> Participant
```

Why model it this way: the same lecturer commonly judges one hackathon and mentors in another, and a
faculty member is not "a judge" as a permanent identity. Tying the job to the event also makes the
conflict-of-interest rule expressible — see [Conflict of interest](#conflict-of-interest).

---

## Admin — `ADMIN`

| Feature | Notes |
|---|---|
| Account management | Approve/reject pending registrations, change roles, disable accounts |
| Event configuration | Create/edit an event with its tracks, rounds and scoring criteria |
| Criteria enforcement | Every round **must** have criteria whose weights total 100% — the form blocks saving otherwise |
| Track draw | Balanced random draw: teams go to the least-loaded track that still has capacity |
| Assignment matrix | Assign lecturers as judges (per track) and mentors (per team) |
| Round advancement | Promote the top N of each track to the next round, apply penalties, disqualify |
| Chapter management | Create/edit/delete chapters and their manual bonus/penalty points |
| Prizes | Record event winners |
| Announcements | Broadcast to everyone or to one audience (students / judges / mentors / lecturers / staff) |
| Audit log | Read the trail of who changed what |

## Event Staff — `STAFF`

Same event-operations surface as Admin, but scoped: staff only see and act on the events they have
been assigned to (`event_staff`). They cannot manage accounts, chapters, or global settings.

## Judge — `LECTURER` with a `JUDGE` assignment

| Feature | Notes |
|---|---|
| See assigned tracks | The Judging tab of the expert dashboard lists one workspace per assigned track |
| Score submissions | Enter a score per criterion for each team in that track, plus a comment |
| Weighted scoring | Round score = Σ (score / maxScore × weight); averaged across all judges of the track |
| Complete scoring | Mark the track done so the coordinator can advance the round |

One judge may score **many tracks**. A judge can only grade submissions from a track they are
actually assigned to — the API rejects anything else, regardless of what the request body claims.

## Mentor — `LECTURER` with a `MENTOR` assignment

| Feature | Notes |
|---|---|
| See assigned teams | The Mentoring tab lists one workspace per event, naming the teams |
| Team chat | Persistent conversation with each assigned team |

One mentor may support **many teams**, but a team has exactly **one** mentor — enforced at schema
level, since the `mentor` join table keys on `team_id`.

## Participant — `STUDENT`

| Feature | Notes |
|---|---|
| Browse & register | See open events with a live countdown to the registration deadline |
| Team formation | Create a team (creator becomes leader) or join one with an invite code |
| Chapter opt-in | On creation the leader picks one chapter, or none — "none" means the team is ranked inside the event only |
| Workspace | Track and problem statement, round timer, teammates, shared resources |
| Submission | **Leader only** may submit or update; other members have read-only access |
| Scores & results | Per-criterion breakdown, judge feedback, track standing, promotion status |
| Chapter leaderboard | Year-long standings, visible to every student |
| Mentor support | Chat with the team's assigned mentor |
| Announcements | Posts targeted at students or at everyone |

---

## Conflict of interest

> A lecturer who mentors a team must not judge the track that team competes in — and the reverse.

Enforced on the three paths that can create the conflict:

| Path | Behaviour |
|---|---|
| Assign a lecturer as **judge** of a track | Rejected if they already mentor a team in that track |
| Assign a lecturer as **mentor** of a team | Rejected if they already judge that team's track |
| Move a team to **another track** | A mentor who would now conflict is cleared automatically |

Still allowed, deliberately: judging Track A while mentoring a team in Track B of the same event.
The rule is about the *teams you score*, not about holding both jobs.

---

## Ranking — three levels

| Level | Stored in | Computed from | Lifetime |
|---|---|---|---|
| **Round** | `round_ranking` | Weighted judge scores, minus penalties | Source of truth |
| **Event** | `team.eventScore` / `eventRank` | Σ round scores of that team | One hackathon |
| **Chapter** | derived on read | Placements of the chapter's teams + manual bonus | One calendar year |

Chapter points per event: **champion +20 · runner-up +15 · third +10**, plus any manual
bonus/penalty an admin sets.

Ties use **dense ranking**: equal totals share a rank, and the next lower total takes the
immediately following rank — so `30, 25, 25, 15` ranks as `#1, #2, #2, #3`, not `#4`. This applies at
every rank level, not just the podium.

Derived values are only ever written by the ranking code, never edited by hand.

---

## Status lifecycles

Each state machine is an enum plus a `status` column, with illegal jumps rejected in the service:

| Entity | States |
|---|---|
| `Event` | PLANNED → UPCOMING → ONGOING → COMPLETED (or CANCELLED) |
| `Round` | CREATED → ACTIVE → SCORING → UNDER_REVIEW → COMPLETED |
| `Submission` | DRAFT → LOCKED → SCORING → EVALUATED |
| `Team` | CREATED → REGISTERED → CONFIRMED → IN_PROGRESS → COMPLETED, plus REJECTED / WITHDRAWN / DISQUALIFIED / ELIMINATED |
| `TeamMember` | INVITED → ACCEPTED / DECLINED / WITHDRAWN |
| `Account` | PENDING → ACTIVE / DISABLED |
