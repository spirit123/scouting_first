# 2026 FRC Las Vegas Regional - Complete Event Guide

**Event:** 2026 Las Vegas Regional (2026nvlv)
**Dates:** April 8-11, 2026 (COMPLETED)
**Venue:** UNLV Thomas & Mack Center, Las Vegas, NV
**Teams:** 44 registered
**Game:** REBUILT (presented by Haas) | **Season:** FIRST AGE (presented by Qualcomm)

**Prediction data snapshot:** March 20, 2026
**Actual results updated:** April 15, 2026

---

## Table of Contents

1. [Data Sources & Links](#data-sources--links)
2. [FRC Expert Agent](#frc-expert-agent)
3. [REBUILT Game Rules](#rebuilt-game-rules)
4. [Strategic Analysis](#strategic-analysis)
5. [Teams Data & Scouting](#teams-data--scouting)
6. [Prediction Model & Methodology](#prediction-model--methodology)
7. [Predicted Rankings](#predicted-rankings)
8. [Actual Results](#actual-results)
9. [Prediction Accuracy](#prediction-accuracy)
10. [Alliance Selections: Predicted vs Actual](#alliance-selections-predicted-vs-actual)
11. [Playoff Results](#playoff-results)
12. [Awards](#awards)
13. [Team Deep Dives](#team-deep-dives)
14. [Pittsburgh Regional Preview](#pittsburgh-regional-preview)

---

## Data Sources & Links

### Event Pages

| Source | URL | Data |
|--------|-----|------|
| The Blue Alliance - Event | [thebluealliance.com/event/2026nvlv](https://www.thebluealliance.com/event/2026nvlv) | OPR, rankings, matches, alliances |
| FIRST Events | [frc-events.firstinspires.org/2026/NVLV](https://frc-events.firstinspires.org/2026/NVLV) | Official FIRST event page |
| FIRST Rankings | [frc-events.firstinspires.org/2026/NVLV/rankings](https://frc-events.firstinspires.org/2026/NVLV/rankings) | Official qualification rankings |
| FIRST Playoffs | [frc-events.firstinspires.org/2026/NVLV/playoffs](https://frc-events.firstinspires.org/2026/NVLV/playoffs) | Alliance selections & bracket |
| FIRST Awards | [frc-events.firstinspires.org/2026/NVLV/awards](https://frc-events.firstinspires.org/2026/NVLV/awards) | Official award listings |

### TBA API Endpoints (require [API key](https://www.thebluealliance.com/account) via `X-TBA-Auth-Key` header)

| Endpoint | URL |
|----------|-----|
| Rankings | `https://www.thebluealliance.com/api/v3/event/2026nvlv/rankings` |
| Alliances | `https://www.thebluealliance.com/api/v3/event/2026nvlv/alliances` |
| Awards | `https://www.thebluealliance.com/api/v3/event/2026nvlv/awards` |
| OPR / DPR / CCWM | `https://www.thebluealliance.com/api/v3/event/2026nvlv/oprs` |
| Match Results | `https://www.thebluealliance.com/api/v3/event/2026nvlv/matches` |
| Teams | `https://www.thebluealliance.com/api/v3/event/2026nvlv/teams` |

### Prior Event Data Sources

| Event | Key | URL |
|-------|-----|-----|
| Canadian Pacific Regional | 2026bcvi | [thebluealliance.com/event/2026bcvi](https://www.thebluealliance.com/event/2026bcvi) |
| Arizona North Regional | 2026azfg | [thebluealliance.com/event/2026azfg](https://www.thebluealliance.com/event/2026azfg) |
| Greater Pittsburgh Regional | 2026paca | [thebluealliance.com/event/2026paca](https://www.thebluealliance.com/event/2026paca) |
| Finger Lakes Regional | 2026nyrr | [thebluealliance.com/event/2026nyrr](https://www.thebluealliance.com/event/2026nyrr) |
| Istanbul Regional | 2026tuis | [thebluealliance.com/event/2026tuis](https://www.thebluealliance.com/event/2026tuis) |

### Official Resources

| Resource | URL |
|----------|-----|
| Game Manual PDF | [firstfrc.blob.core.windows.net/frc2026/Manual/2026GameManual.pdf](https://firstfrc.blob.core.windows.net/frc2026/Manual/2026GameManual.pdf) |
| FIRST Inspires Game & Season | [firstinspires.org/robotics/frc/game-and-season](https://www.firstinspires.org/robotics/frc/game-and-season) |
| FRC Manual Online | [frcmanual.com/2026/game-details](https://www.frcmanual.com/2026/game-details) |
| Points Calculator | [dunkirk.sh/blog/frc-rebuilt-calculator/](https://dunkirk.sh/blog/frc-rebuilt-calculator/) |

> **Dynamic data:** All TBA API endpoints can be queried programmatically with a [TBA API key](https://www.thebluealliance.com/account). FIRST event pages are publicly accessible.

---

## FRC Expert Agent

This document was generated with assistance from the **FRC 2026 REBUILT Expert Agent** -- a specialized Claude Code skill for FRC analysis.

### What the Agent Knows

The expert agent has deep knowledge of:
1. **Game Rules** -- Scoring, penalties, match structure, field elements
2. **Strategy** -- Alliance strategies, autonomous routines, teleop tactics, endgame optimization
3. **Robot Design** -- Mechanisms for FUEL handling, Tower climbing, obstacle traversal
4. **Team Analysis** -- Performance data, OPR, strengths/weaknesses, scouting insights
5. **Event Predictions** -- Rankings, alliance selection, playoff outcomes

### How to Use It

Invoke the agent with `/frc-expert` followed by your question:

```
/frc-expert What is the best climbing strategy for REBUILT?
/frc-expert Analyze team 7426's chances at Las Vegas
/frc-expert Explain the shift mechanic and its strategic implications
/frc-expert Compare 3990 vs 4421 head-to-head
```

### Knowledge Base Files

| File | Path | Content |
|------|------|---------|
| Game Rules | `.claude/skills/frc-expert/game-rules.md` | Complete REBUILT rules, scoring, penalties, dimensions |
| Strategies | `.claude/skills/frc-expert/strategies.md` | Robot archetypes, shift tactics, alliance strategy |
| Teams Data | `.claude/skills/frc-expert/teams-data.md` | All 44 team profiles, OPR, scouting notes, metric glossary |
| Skill Config | `.claude/skills/frc-expert/SKILL.md` | Agent behavior and tool configuration |

### Tools Available to the Agent

The expert agent can use: `Read`, `Grep`, `Glob`, `WebFetch`, `WebSearch` -- allowing it to read its knowledge base, search the codebase, and fetch live data from the web when needed.

---

## REBUILT Game Rules

### Game Overview

**REBUILT** is the 2026 FIRST Robotics Competition game, presented by Haas. It is part of the **FIRST AGE** season (presented by Qualcomm), inspired by archaeology. Two alliances of three robots each compete to **score FUEL into their HUB**, **cross obstacles**, and **climb the TOWER**.

**Game Reveal:** January 10, 2026 (Kickoff)

### Match Structure

**Total match time: 2 minutes 40 seconds (160 seconds)**

| Phase | Duration | Description |
|-------|----------|-------------|
| **Autonomous** | 20 seconds | Robots operate without driver input |
| **Transition Shift** | 10 seconds | Both HUBs active; determines shift order |
| **Teleop Shift 1** | 25 seconds | First teleop shift |
| **Teleop Shift 2** | 25 seconds | Second teleop shift |
| **Teleop Shift 3** | 25 seconds | Third teleop shift |
| **Teleop Shift 4** | 25 seconds | Fourth teleop shift |
| **Endgame** | 30 seconds | Final climbing opportunity |

### Field Elements

**HUB**
- Each alliance has its own HUB where FUEL (balls) are scored
- HUBs alternate between "active" and "inactive" states during teleop
- FUEL can ONLY be scored in an ACTIVE HUB
- Both HUBs active during: Auto, Transition Shift, and Endgame

**TOWER**
- Vertical climbing structure, 32.25 inches wide
- Three rungs:
  - **LOW RUNG:** 27 inches high
  - **MID RUNG:** 45 inches high
  - **HIGH RUNG:** 63 inches high
- Rungs are 18 inches apart

**BUMP** -- 6.5 inches tall, 73 inches wide (obstacle robots drive OVER)

**TRENCH** -- 40.25 inches tall, 65.65 inches wide (obstacle robots drive UNDER)

**DEPOT** -- Stores 24 FUEL. Teams can preload up to 8 FUEL per robot.

### Scoring

#### Autonomous Period

| Action | Points |
|--------|:------:|
| FUEL scored in HUB | 1 pt each |
| Tower Climb Level 1 | 15 pts (max 2 robots in auto) |

#### Teleoperational Period

| Action | Points |
|--------|:------:|
| FUEL scored in HUB | 1 pt each |

#### Endgame / Tower Climbing

| Level | Points | Requirement |
|-------|:------:|-------------|
| Level 1 | 10 pts | Robot no longer touching CARPET or tower base |
| Level 2 | 20 pts | Robot bumpers completely above LOW RUNG (27") |
| Level 3 | 30 pts | Robot bumpers completely above MID RUNG (45"), contacting rungs or uprights |

**Notes:**
- FUEL scored continues to be assessed for up to 3 seconds after auto timer hits 0:00
- Both HUBs are active during Endgame
- All 3 robots on an alliance CAN climb simultaneously

### HUB Active/Inactive Mechanic (KEY STRATEGY ELEMENT)

This is the most unique and strategically important rule in REBUILT:

1. During **Auto** and the **Transition Shift**: Both alliance HUBs are **ACTIVE**
2. The alliance that scores **MORE FUEL in Auto** has their HUB go **INACTIVE first**
   - Their HUB: INACTIVE in Shifts 1 & 3, ACTIVE in Shifts 2 & 4
3. The alliance that scores **LESS FUEL in Auto** gets their HUB **ACTIVE first**
   - Their HUB: ACTIVE in Shifts 1 & 3, INACTIVE in Shifts 2 & 4
4. If Auto scoring is **tied**, FMS randomly selects the starting shift order
5. Both HUBs are ACTIVE during **Endgame**

**Strategic implication:** Winning auto gives your opponents the first active shift! This creates a fascinating tradeoff where teams may strategically choose to score slightly less in auto to get the favorable shift order.

### Ranking Points (RP) - Qualification Matches

| RP Source | Requirement | RP Earned |
|-----------|-------------|:---------:|
| **Match Win** | Win the match | 3 RP |
| **Match Tie** | Tie the match | 1 RP |
| **Energized Bonus** | Alliance scores 100+ FUEL in HUB | +1 RP |
| **Supercharged Bonus** | Alliance scores 360+ FUEL in HUB | +1 RP |
| **Traversal Bonus** | Alliance earns 50+ Tower points | +1 RP |

**Maximum RP per match: 6 RP** (3 win + 3 bonus)

#### Traversal Bonus Examples (50+ Tower points)
- Three Level 2 climbs: 60 pts (qualifies)
- One Level 3 + one Level 2: 50 pts (qualifies)
- Two Level 3 climbs: 60 pts (qualifies)
- Practical minimum: Level 3 (30) + Level 2 (20) = 50 pts

#### Ranking Order
1. Total Ranking Points (cumulative across all qual matches)
2. Average RP per match (tiebreaker)
3. Additional tiebreakers per FRC rules

### Alliance Selection & Playoffs

**Alliance Selection Process:**
1. After qualification matches, teams ranked by cumulative RP
2. Top 8 ranked teams become **Alliance Captains** (Alliance 1 through 8)
3. Serpentine draft format:
   - Round 1: Alliance 1 picks first, then 2, 3... 8
   - Round 2: Alliance 8 picks first, then 7, 6... 1
4. Each alliance has 3 teams total (captain + 2 picks)

**Playoff Format: Double Elimination**
- 8 alliances compete in double-elimination bracket
- ~13 matches + finals, approximately 3.5 hours
- **Upper Bracket**: Win = stay in Upper; Lose = drop to Lower
- **Lower Bracket**: Lose = eliminated from tournament
- Last remaining alliance from each bracket meets in **Finals**
- First alliance to win **2 Finals matches** = **Event Champion**

**Upper Bracket Matchups (Round 1):**
- Match 1: Alliance 1 vs Alliance 8
- Match 2: Alliance 2 vs Alliance 7
- Match 3: Alliance 3 vs Alliance 6
- Match 4: Alliance 4 vs Alliance 5

### Robot Constraints

| Constraint | Value |
|-----------|:-----:|
| Maximum height | 30 inches |
| Maximum frame perimeter | 110 inches |
| Maximum weight (without bumpers) | 115 lbs |
| Maximum weight (with bumpers) | 135 lbs |
| Maximum FUEL preload | 8 per robot |

### Penalties

| Type | Effect |
|------|--------|
| Standard Foul | Opponent receives **5 points** |
| Tech Foul (Major) | Opponent receives **15 points** |
| Yellow Card | Warning; accumulates through day |
| Red Card | 2 Yellow Cards = disqualification from that match |

**Common Fouls:** Contacting opponent's HUB, exceeding frame perimeter, pinning >5 seconds, entering protected zones, unsafe behavior.

### Key Dimensions Summary

| Element | Dimension |
|---------|-----------|
| Tower width | 32.25" |
| Low Rung height | 27" |
| Mid Rung height | 45" |
| High Rung height | 63" |
| Rung spacing | 18" |
| Bump height | 6.5" |
| Bump width | 73" |
| Trench height | 40.25" |
| Trench width | 65.65" |
| Robot max height | 30" |
| Robot max perimeter | 110" |

---

## Strategic Analysis

### Robot Archetypes

#### A. FUEL Scoring Specialist ("Shooter")
- **Focus:** Maximize FUEL scored per match
- **Mechanism:** Flywheel shooter, catapult, or linear puncher aimed at HUB
- **Intake:** Wide ground intake or human player station pickup
- **Cycle time target:** <5 seconds per FUEL cycle
- **Strengths:** High OPR contribution, helps earn Energized/Supercharged RP
- **Weaknesses:** Dependent on HUB active/inactive timing, less endgame contribution
- **Strategic value:** VERY HIGH
- **Design notes:** Must handle shift mechanic; storage capacity matters for dump scoring during active shifts; accuracy vs speed tradeoff

#### B. Tower Climber Specialist ("Climber")
- **Focus:** Maximize Tower climb level
- **Mechanism:** Hook arms, telescoping elevator, or winch system
- **Target:** Level 3 climb (30 pts) consistently
- **Strengths:** Reliable endgame points, contributes to Traversal RP
- **Weaknesses:** Climbing mechanisms add weight and complexity
- **Strategic value:** HIGH
- **Design notes:** Must fit under 30" height limit while reaching 45"+ (Level 3); weight budget critical (115 lbs); climb must fit in 30-second endgame

#### C. All-Rounder ("Flex Bot")
- **Focus:** Score FUEL + climb Tower
- **Mechanism:** Combined intake/shooter + climbing arms
- **Target:** 50-80 FUEL + Level 2 or 3 climb
- **Strengths:** Versatile, most desirable for alliance selection
- **Weaknesses:** Jack of all trades, master of none
- **Strategic value:** HIGH
- **Design notes:** Packaging challenge (shooter + climber in 110" perimeter, under 30"); weight management is biggest challenge

#### D. Defensive Bot ("Blocker")
- **Focus:** Prevent opponents from scoring during their active shifts
- **Mechanism:** Robust drivetrain, wide profile, pushing power
- **Strengths:** Can neutralize top shooters, minimal design complexity
- **Weaknesses:** Low OPR, risky against foul calls, doesn't earn bonus RPs
- **Strategic value:** SITUATIONAL (useful in playoffs against dominant shooters)
- **Design notes:** Avoid fouls (pinning >5 sec, protected zones); ideally can do Level 1 climb (10 pts)

#### E. Obstacle Specialist ("Traverser")
- **Focus:** Navigate BUMP and TRENCH efficiently
- **Mechanism:** Low-profile drivetrain, adjustable ground clearance
- **Strengths:** Faster field traversal, better cycle times
- **Strategic value:** MODERATE (supplements other roles)

### The Shift Mechanic - Deep Strategic Analysis

The HUB active/inactive shift system is the defining strategic element of REBUILT.

#### Auto Scoring Dilemma

| Option | Pros | Cons | Best When |
|--------|------|------|-----------|
| **Win Auto Aggressively** | Score more auto points, demonstrate dominance | Opponents get first active shift (Shift 1) | Your teleop scoring rate is high enough to catch up in Shifts 2 & 4 |
| **Strategic Auto Restraint** | Get first active shift (Shift 1), more favorable timing | Sacrifice auto points | Your alliance has dominant teleop capability |
| **Match Auto (Force Tie)** | Random = unpredictable but fair | Extremely difficult to execute | Not practical |

#### Shift Timing Optimization
- Each shift is 25 seconds. With ~5-second FUEL cycle:
- **Maximum cycles per shift:** ~5 (perfect efficiency)
- **Realistic cycles per shift:** 3-4 (accounting for travel, intake, aiming)
- **Alliance total per shift (3 robots):** 9-12 FUEL per active shift
- **Total across 2 active shifts:** 18-24 FUEL per alliance from teleop shifts alone

#### Storage Strategy
Since HUBs go inactive, robots benefit from:
- **Pre-loading during inactive shifts:** Collect FUEL while HUB is inactive
- **Dump scoring at shift start:** Unload stored FUEL immediately when HUB activates
- **High-capacity storage:** Hold 4-8 FUEL to maximize active-shift scoring
- **Fast dump mechanism:** Score stored FUEL quickly, then cycle more

### Ranking Point Strategies

#### Energized Bonus (100+ FUEL) -- Moderate difficulty
- At least 2 strong shooters on alliance
- 100 FUEL across auto + 4 shifts + endgame: 3 robots averaging 33 each = achievable
- Top alliances score 150-250+ FUEL

#### Supercharged Bonus (360+ FUEL) -- VERY HARD
- Requires elite alliance with all 3 robots scoring heavily
- 360 FUEL = 120 per robot average; top robots: ~100-180 OPR
- Only achievable by top-tier alliances (~10-20% of matches)

#### Traversal Bonus (50+ Tower Points) -- Moderate-Hard
- At least 2 robots with Level 2+ climbing
- Minimum combo: Level 3 (30) + Level 2 (20) = 50 pts
- Easier combo: 2x Level 2 (40) + Level 1 (10) = 50 pts
- Best combo: 3x Level 3 = 90 pts (rare)
- **Key insight:** Having 3 reliable climbers is very valuable

### Alliance Selection Strategy

#### What Alliance Captains Want (priority order)
1. **High OPR shooter** -- maximizes FUEL scoring
2. **Reliable Level 3 climber** -- ensures Traversal RP
3. **Good auto routine** -- consistent auto scoring
4. **Versatility** -- can score FUEL AND climb
5. **Reliability** -- doesn't break down, consistent performance

#### Ideal Alliance Composition
- **Robot 1 (Captain):** Elite FUEL scorer + Level 2+ climber
- **Robot 2 (1st Pick):** Strong FUEL scorer + Level 3 climber
- **Robot 3 (2nd Pick):** Solid FUEL scorer + reliable Level 1-2 climber
- **Alternative:** Two elite shooters + one dedicated Level 3 climber

#### Common Alliance Selection Mistakes
- Picking 3 shooters with no climbing ability (miss Traversal RP)
- Picking 3 climbers with weak shooting (miss Energized RP)
- Ignoring auto capability (shift order matters)
- Not scouting reliability (a broken robot scores 0)

### Match Strategy

**Pre-Match:** Agree on auto routines, decide shift strategy, assign roles, plan defense.

**Autonomous:** Prioritize consistent scoring over risky autos. Pre-loaded FUEL (up to 8) should be scored efficiently. Auto Tower climb (15 pts/Level 1) is valuable but risky.

**Teleoperational:**
- Active shifts: Score as fast as possible, dump stored FUEL first
- Inactive shifts: Collect FUEL, reposition, prepare
- Defense timing: Defend during opponent's active shifts
- Drivers must coordinate positioning

**Endgame (Last 30 Seconds):**
- Both HUBs active -- final scoring push
- Begin climbing with ~20 seconds remaining
- Prioritize highest reliable climb level
- One robot can "hold" the tower while others climb

### Scouting Priorities (in order)

1. **FUEL scored per match** -- total and per phase
2. **Climb level achieved** -- consistency > peak
3. **Auto routine** -- what, how many FUEL, do they climb?
4. **Cycle time** -- seconds per FUEL cycle
5. **Reliability** -- breakdowns?
6. **Defense capability**
7. **Obstacle navigation** -- BUMP? TRENCH?
8. **Penalties** -- foul rate

### Key Metrics

| Metric | Description |
|--------|-------------|
| **OPR** | Offensive Power Rating -- estimated individual scoring contribution |
| **DPR** | Defensive Power Rating -- how much team reduces opponent score |
| **CCWM** | Calculated Contribution to Winning Margin (OPR - DPR) |
| **Avg RP/Match** | Consistency in earning bonus RPs |
| **Win Rate** | Overall competitive success |

### Common Robot Mechanisms for REBUILT

**FUEL Intake:** Over-the-bumper roller (most common), under-bumper, funnel intake

**FUEL Shooter:** Single flywheel (simple), dual flywheel (consistent), catapult/puncher (high throughput close range), gravity dump (simplest, close range only)

**FUEL Storage/Indexer:** Belt indexer (sequential), rotary magazine (rapid-fire), gravity hopper (simple)

**Climbing Mechanism:** Telescoping arm + hook, pivot arm, continuous elevator, winch system, passive hooks + drive

**Drivetrain:** Swerve (best maneuverability, preferred for fast cycles), West Coast/Tank (reliable, good pushing), Mecanum (omnidirectional, less pushing)

---

## Teams Data & Scouting

### Metric Glossary

#### OPR (Offensive Power Rating) -- Weight: 35%
Estimates each team's individual scoring contribution per match. FRC matches are 3-on-3 with a single combined score. OPR uses least-squares regression across all matches to isolate individual contributions. Scale: elite = 150-180+, solid mid-tier = 50-100, near zero = adds nothing, negative = teams score fewer points with this robot.

**Limitations:** Does NOT capture defense. Assumes additive contributions. Affected by schedule strength.

#### Win Rate % -- Weight: 20%
Formula: `(wins + 0.5 * ties) / total_matches * 100`. Imperfect because quals partners are randomly assigned -- a mediocre team can win with strong partners.

#### Average Alliance Score -- Weight: 15%
Mean total score of the 3-robot alliance. Read with OPR: high score + high OPR = genuine contributor; high score + low OPR = carried by partners.

#### Rank Percentile -- Weight: 10%
`(1 - (rank-1)/(num_teams-1)) * 100`. Normalizes across events of different sizes.

#### Average RP per Match -- Weight: 10%
Average ranking points earned per match. Two 7-2-0 teams can rank differently based on bonus RPs. High avg RP = wins often AND alliance hits bonus thresholds.

#### Experience -- Weight: 5%
`2026 - rookie_year`. Veterans have established infrastructure. But only 5% because talented rookies can beat veterans.

#### Events Played -- Weight: 5%
Teams improve 10-30% between events. More events = more iteration.

#### Composite Score (0-100)
`OPR(35%) + WinRate(20%) + AvgScore(15%) + RankPct(10%) + AvgRP(10%) + Experience(5%) + Events(5%)`

Each component normalized to 0-100 before weighting. No-data teams get conservative defaults (~22-35) with rookie penalties.

#### Tiers

| Tier | Composite | Meaning | LV Teams |
|------|:---------:|---------|----------|
| **Elite** | 70+ | Alliance captains, event win contenders | 7426, 4421, 3990, 4270 |
| **Strong** | 55-69 | 1st-round picks, competitive | 9406, 991, 6479, 987 |
| **Average** | 40-54 | 2nd-round picks, solid contributors | 10183, 60, 7425, 6413, 9059, 8338, 8717 |
| **Below Avg** | 25-39 | Developing, or no-data veterans | 4253, 8503, 9233, 3009, 9534, 1165, 10905 + many estimated |
| **Developing** | <25 | Rookies, very limited data | Primarily 2025-2026 teams with no events |

### Important Caveats

- **Defense is invisible:** No metric captures defensive play. A lockdown defender scores 0 but can swing a match by 50+.
- **Playoffs vs. quals:** All data is from quals. 6413 went 4-5-0 in quals but made the FINALS at AZ North.
- **Second-event improvement:** Teams improve 10-30% between events.
- **Half the field is unknown:** 22 of 44 teams had no 2026 data. Their composites were educated guesses.
- **Data freshness:** Prediction snapshot was March 19-20, 2026. Las Vegas was April 8-11.

---

### Teams with Prior 2026 Event Data

#### ELITE TIER (Composite 70+)

**Team 7426 - PAIR OF DICE ROBOTICS**
| Field | Value |
|-------|-------|
| Location | Las Vegas, NV (LOCAL) |
| Rookie Year | 2019 |
| Source Event | Arizona North Regional (55 teams) - completed |
| Record | 8-1-0 (88.9% win rate) |
| Ranking | 2nd of 55 |
| OPR | **182.30** (HIGHEST among LV teams) |
| Avg Score | 209.56 |
| Avg RP/Match | 3.33 |
| Playoffs | **TOURNAMENT WINNER** (with 2122, 2478, 7755) |
| Composite | ~88 |
| Scouting | Dominant FUEL scorer, event winner. The clear team to beat. |

**Team 4421 - FORGE Robotics**
| Field | Value |
|-------|-------|
| Location | Surrey, BC |
| Rookie Year | 2012 |
| Source Event | Canadian Pacific Regional (44 teams) - completed |
| Record | 8-2-0 (80% win rate) |
| Ranking | 3rd of 44 |
| OPR | 148.00 |
| Avg Score | 219.30 |
| Avg RP/Match | **3.40** (HIGHEST of any LV team) |
| Composite | 83.4 |
| Scouting | Best RP economy in the field. Consistent high performer. |

**Team 3990 - Tech for Kids**
| Field | Value |
|-------|-------|
| Location | Montreal, QC |
| Rookie Year | 2012 |
| Source Event | Can. Pacific + Pittsburgh (2 events) |
| Record | 10-4-0 overall in 2026 |
| Ranking | 4th of 44 (Can. Pacific), 4th of 50 (Pittsburgh) |
| OPR | 153.09 (Can. Pacific) -> 165.41 (Pittsburgh, +8%) |
| Avg Score | 249.00 (HIGHEST avg among LV teams) |
| Avg RP/Match | 3.20 -> 3.67 (Pittsburgh) |
| Playoffs | Alliance 2, 1st Pick at Can. Pacific (eliminated DE Round 5) |
| Award | Team Sustainability Award (Dow) |
| Composite | 83.3 |
| Scouting | Elite scorer. Highest avg match score. 14 years experience. Multi-event advantage. |

**Team 4270 - Crusaders**
| Field | Value |
|-------|-------|
| Location | Surrey, BC |
| Rookie Year | 2012 |
| Source Event | Canadian Pacific Regional - completed |
| Record | 7-3-0 (70% win rate) |
| Ranking | 6th of 44 |
| OPR | 111.07 |
| Avg Score | 173.40 |
| Avg RP/Match | 3.10 |
| Composite | 70.7 |

**Team 9406 - TechJunior**
| Field | Value |
|-------|-------|
| Location | Vancouver, BC |
| Rookie Year | 2023 |
| Source Event | Can. Pacific + Pittsburgh (2 events) |
| Record | 12-3-0 overall in 2026 |
| OPR | 114.68 (Can. Pacific) -> 128.43 (Pittsburgh, +12%) |
| Avg RP/Match | 3.00 -> 3.50 (Pittsburgh) |
| Composite | 70.4 |
| Scouting | Impressive for a 3rd-year team. Strong and rising. |

#### STRONG TIER (Composite 55-69)

**Team 991 - BroncoBots**
| Field | Value |
|-------|-------|
| Location | Montrose, CO | Rookie: 2002 |
| Source | Arizona North | OPR: 81.37 | Record: 6-3-0 | Rank: 10/55 |
| Composite | ~57 |
| Scouting | Surged from rank 22 mid-event to rank 10. Late-event improvement. 24 years experience. |

**Team 10183 - ARC**
| Field | Value |
|-------|-------|
| Location | Las Vegas, NV | Rookie: 2025 |
| Source | Arizona North | OPR: 58.70 | Record: 6-3-0 | Rank: 9/55 |
| Composite | ~57 |
| Scouting | Only a 2nd-year team but performing well above expectations. |

**Team 6479 - AZTECH Robotics**
| Field | Value |
|-------|-------|
| Location | Phoenix, AZ | Rookie: 2017 |
| Source | Arizona North | OPR: 46.94 | Record: 7-2-0 | Rank: 5/55 |
| Composite | ~56 |
| Scouting | The "OPR Paradox" -- great record but moderate OPR. Jumped from rank 11 to 5. Possibly a strong defender. |

#### AVERAGE TIER (Composite 40-54)

| Team | Name | Location | OPR | Record | Rank | Source | Composite | Notes |
|:----:|------|----------|:---:|:------:|:----:|--------|:---------:|-------|
| 987 | HIGHROLLERS | Las Vegas, NV | 69.75 | 5-4-0 | 14/55 | AZ North | ~52 | Local veteran, 24 yrs |
| 60 | The Bionic Bulldogs | Kingman, AZ | 34.77 | 6-3-0 | 11/55 | AZ North | ~54 | Oldest team in field (29 yrs) |
| 7425 | Green Valley Robotics | Henderson, NV | 70.22 | 6-3-0 | 12/55 | AZ North | ~50 | Big OPR jump from 44 to 70 |
| 6413 | Degrees of Freedom | Las Vegas, NV | 53.89 | 4-5-0 | 23/55 | AZ North | ~44 | FINALIST despite sub-.500 quals |
| 9059 | COLTech Robotics | Las Vegas, NV | 14.92 | 5-4-0 | 29/55 | AZ North | ~42 | Low OPR, carried by partners |
| 8338 | Bear Force | Victoria, BC | 32.27 | 5-5-0 | 20/44 | Can. Pacific | ~42 | |
| 8717 | Cyber Vipers | Las Vegas, NV | 22.07 | 4-5-0 | 32/55 | AZ North | ~39 | |

#### BELOW AVERAGE TIER (Composite 25-39)

| Team | Name | Location | OPR | Record | Rank | Source | Composite | Notes |
|:----:|------|----------|:---:|:------:|:----:|--------|:---------:|-------|
| 4253 | Raid Zero | Taipei, TW | ~25 est | 4-5-0 | 37/50 | Finger Lakes | ~35 | Woodie Flowers Finalist Award |
| 8503 | Raid One | Taipei, TW | ~35 est | 6-6-0 | 22/50 | Finger Lakes | ~40 | 12 matches, .500 record |
| 9233 | Luminous Robotics | Istanbul, TR | ~30 est | 7-10-0 | 25/44 | Istanbul | ~35 | Alliance 3 1st pick at Istanbul |
| 3009 | High Scalers | Boulder City, NV | 2.17 | 1-8-0 | 55/55 | AZ North | ~27 | |
| 9534 | Wolves Robotics | Henderson, NV | -4.55 | 2-7-0 | 51/55 | AZ North | ~26 | |
| 1165 | Team Paradise | Paradise, NV | -12.28 | 2-7-0 | 53/55 | AZ North | ~27 | OPR improved from -24 to -12 |
| 10905 | Team LOVE | Phoenix, AZ | -22.28 | 3-6-0 | 47/55 | AZ North | ~24 | ROOKIE (2026), robot "Genesis" |

#### NO 2026 DATA (Default estimates)

| Team | Name | Location | Rookie Year | Est. Composite | Notes |
|:----:|------|----------|:----------:|:--------------:|-------|
| 988 | Steel Phoenix | Phoenix, AZ | 2002 | ~35 | 24 yrs experience |
| 1011 | CRUSH | Glendale, AZ | 2003 | ~35 | 23 yrs experience |
| 1726 | N.E.R.D.S. | Reno, NV | 2006 | ~34 | 20 yrs |
| 2375 | Dragon Robotics | Las Vegas, NV | 2008 | ~34 | 18 yrs |
| 2438 | 'Iobotics | Honolulu, HI | 2008 | ~34 | At Hawaii Regional (Mar 19-22) |
| 3577 | Saint's Robotics | Yuma, AZ | 2011 | ~33 | 15 yrs |
| 3882 | Lunas | Honolulu, HI | 2011 | ~33 | At Hawaii Regional (Mar 19-22) |
| 5049 | Minerbots | Las Vegas, NV | 2014 | ~33 | Local, 12 yrs |
| 6824 | LVA Robot Pigeons | Las Vegas, NV | 2018 | ~32 | 8 yrs |
| 7183 | W.A.R. | Kaneohe, HI | 2018 | ~32 | 8 yrs |
| 7654 | Robot In Shed | Henderson, NV | 2019 | ~32 | 7 yrs |
| 8005 | Mega MeadowBots | Las Vegas, NV | 2020 | ~31 | At Hawaii + Idaho before LV |
| 8229 | Balikbayan Bots | Las Vegas, NV | 2020 | ~31 | At Idaho before LV |
| 8387 | MECH Mavericks | Las Vegas, NV | 2020 | ~31 | Local |
| 9002 | Falcon Dynamics | Henderson, NV | 2023 | ~30 | 3 yrs |
| 9018 | ElRobotiKO | Elko, NV | 2023 | ~30 | 3 yrs |
| 9037 | HHS Black Ops | Henderson, NV | 2023 | ~30 | 3 yrs |
| 9151 | RoboLynx | Las Vegas, NV | 2023 | ~30 | 3 yrs |
| 9426 | CLAWBOTICS | Reno, NV | 2024 | ~29 | 2 yrs |
| 10186 | feenx | Reno, NV | 2025 | ~25 | 2nd year |
| 10903 | The Ionizers | Reno, NV | 2026 | ~22 | ROOKIE, at Idaho before LV |
| 11235 | Golden Ratio | N. Las Vegas, NV | 2026 | ~22 | ROOKIE |

---

## Prediction Model & Methodology

### Model Weights

| Component | Weight | Description |
|-----------|:------:|-------------|
| OPR | 35% | Offensive Power Rating -- individual scoring contribution |
| Win Rate | 20% | Percentage of matches won |
| Average Score | 15% | Mean alliance score |
| Rank Percentile | 10% | Normalized ranking vs field size |
| Average RP/Match | 10% | Bonus RP earning ability |
| Experience | 5% | Years since rookie year |
| Events Played | 5% | Multi-event iteration bonus |

### Handling Missing Data
- **No OPR available:** Estimated from rank percentile with 60% conservative scaling
- **No 2026 data:** Median-based default score (50th percentile, 50% reduction). Rookie penalty for 2025-2026 teams.

### Playoff Prediction
- **Alliance Selection:** Top 8 by composite are captains. Serpentine draft of remaining teams by composite score.
- **Bracket Simulation:** Double elimination. Match winner predicted by total alliance OPR.

### Data Sources Used
- Canadian Pacific (completed), Arizona North (completed)
- Pittsburgh (in progress, 49/63 quals as of March 20)
- Finger Lakes (partial), Istanbul (partial)
- Snapshot date: March 20, 2026

---

## Predicted Rankings

| Pred. Rank | Team # | Team Name | Composite | Tier |
|:---:|:---:|---|:---:|---|
| 1 | 3990 | Tech for Kids | 88.2 | Elite |
| 2 | 7426 | PAIR OF DICE ROBOTICS | 86.6 | Elite |
| 3 | 4421 | FORGE Robotics | 80.5 | Elite |
| 4 | 9406 | TechJunior | 77.0 | Elite |
| 5 | 4270 | Crusaders | 68.3 | Strong |
| 6 | 991 | BroncoBots | 58.4 | Strong |
| 7 | 6479 | AZTECH Robotics | 53.8 | Average |
| 8 | 987 | HIGHROLLERS | 53.7 | Average |
| 9 | 10183 | ARC | 53.3 | Average |
| 10 | 60 | The Bionic Bulldogs | 52.8 | Average |

---

## Actual Results

### Actual Qualification Rankings (Top 25)

| Rank | Team # | Team Name | Ranking Score | Record |
|:---:|:---:|---|:---:|:---:|
| 1 | 7426 | PAIR OF DICE ROBOTICS | 4.60 | 10-0-0 |
| 2 | 4421 | FORGE Robotics | 3.50 | 8-2-0 |
| 3 | 987 | HIGHROLLERS | 3.20 | 7-3-0 |
| 4 | 8503 | Raid One | 3.20 | 7-2-1 |
| 5 | 8005 | Mega MeadowBots | 3.20 | 7-3-0 |
| 6 | 991 | BroncoBots | 3.20 | 7-2-1 |
| 7 | 9406 | TechJunior | 3.10 | 7-3-0 |
| 8 | 3882 | Lunas | 3.10 | 7-3-0 |
| 9 | 6413 | Degrees of Freedom | 3.10 | 7-3-0 |
| 10 | 7425 | Green Valley Robotics | 2.90 | 7-3-0 |
| 11 | 2438 | 'Iobotics | 2.80 | 6-4-0 |
| 12 | 3990 | Tech for Kids | 2.70 | 6-4-0 |
| 13 | 7183 | W.A.R. | 2.60 | 6-4-0 |
| 14 | 3009 | High Scalers | 2.50 | 6-4-0 |
| 15 | 5851 | Striking Vikings | 2.50 | 6-4-0 |
| 16 | 4270 | Crusaders | 2.40 | 5-5-0 |
| 17 | 9037 | HHS Black Ops | 2.40 | 6-4-0 |
| 18 | 6824 | LVA Robot Pigeons | 2.40 | 5-4-1 |
| 19 | 10903 | The Ionizers | 2.30 | 5-5-0 |
| 20 | 2375 | Dragon Robotics | 2.20 | 5-5-0 |
| 21 | 6479 | AZTECH Robotics | 2.20 | 5-5-0 |
| 22 | 8387 | MECH Mavericks | 2.20 | 5-5-0 |
| 23 | 3577 | Saint's Robotics | 2.20 | 5-5-0 |
| 24 | 9233 | Luminous Robotics Team | 2.10 | 5-5-0 |
| 25 | 10905 | Team LOVE | 2.10 | 4-5-1 |

---

## Prediction Accuracy

| Metric | Value |
|--------|-------|
| Average Rank Error | **9.1 positions** |
| Top 8 Overlap | **5/8** teams predicted correctly |
| Champion Prediction | **WRONG** (predicted 3990, actual 7426) |
| Finalist Prediction | **WRONG** (predicted 7426, actual 4421) |

### Predicted vs Actual Comparison

| Pred. Rank | Actual Rank | Diff | Team # | Team Name | Tier | Accuracy |
|:---:|:---:|:---:|:---:|---|---|---|
| 1 | 12 | -11 | 3990 | Tech for Kids | Elite | Off by 11 |
| 2 | 1 | +1 | 7426 | PAIR OF DICE ROBOTICS | Elite | Accurate |
| 3 | 2 | +1 | 4421 | FORGE Robotics | Elite | Accurate |
| 4 | 7 | -3 | 9406 | TechJunior | Elite | Close |
| 5 | 16 | -11 | 4270 | Crusaders | Strong | Off by 11 |
| 6 | 6 | 0 | 991 | BroncoBots | Strong | **EXACT** |
| 7 | 21 | -14 | 6479 | AZTECH Robotics | Average | Off by 14 |
| 8 | 3 | +5 | 987 | HIGHROLLERS | Average | Close |
| 9 | -- | -- | 10183 | ARC | Average | N/A |
| 10 | -- | -- | 60 | The Bionic Bulldogs | Average | N/A |
| 11 | 10 | +1 | 7425 | Green Valley Robotics | Average | Accurate |
| 15 | 8 | +7 | 3882 | Lunas | Below Avg | Off by 7 |
| 17 | 9 | +8 | 6413 | Degrees of Freedom | Below Avg | Off by 8 |

**Key takeaways:**
- The model correctly identified 7426, 4421, 991 at or near their actual positions
- **3990's biggest miss:** Predicted #1, finished #12. Multi-event data overweighted their improvement curve.
- **6479 confirmed the OPR Paradox:** Predicted #7 on strong win rate, finished #21 -- OPR was the better predictor.
- **987 outperformed:** Predicted #8, finished #3. The veteran home-field advantage was underestimated.
- **No-data teams surprised:** 3882 (predicted #15, actual #8) and 8005 (no ranking prediction, actual #5) had no prior data but performed strongly.

---

## Alliance Selections: Predicted vs Actual

### Predicted Alliances

| # | Captain | 1st Pick | 2nd Pick | Total OPR |
|:---:|---|---|---|:---:|
| 1 | 3990 Tech for Kids | 10183 ARC | 6824 LVA Robot Pigeons | 251.1 |
| 2 | 7426 PAIR OF DICE ROBOTICS | 60 The Bionic Bulldogs | 9233 Luminous Robotics | 249.0 |
| 3 | 4421 FORGE Robotics | 7425 Green Valley Robotics | 5049 Minerbots | 245.2 |
| 4 | 9406 TechJunior | 8503 Raid One | 3882 Lunas | 203.2 |
| 5 | 4270 Crusaders | 6413 Degrees of Freedom | 3577 Saint's Robotics | 191.9 |
| 6 | 991 BroncoBots | 8338 Bear Force | 2438 'Iobotics | 140.6 |
| 7 | 6479 AZTECH Robotics | 988 Steel Phoenix | 2375 Dragon Robotics | 100.8 |
| 8 | 987 HIGHROLLERS | 1011 CRUSH | 1726 N.E.R.D.S. | 123.6 |

### Actual Alliances

| # | Captain | 1st Pick | 2nd Pick | Result |
|:---:|---|---|---|---|
| **1** | **7426 PAIR OF DICE ROBOTICS** | **987 HIGHROLLERS** | **1165 Team Paradise** | **EVENT WINNER** |
| **2** | **4421 FORGE Robotics** | **10183 ARC** | **8005 Mega MeadowBots** | **FINALIST** |
| 3 | 8503 Raid One | 9406 TechJunior | 9059 COLTech Robotics | |
| 4 | 991 BroncoBots | 3990 Tech for Kids | 6479 AZTECH Robotics | |
| 5 | 3882 Lunas | 4253 Raid Zero | 4270 Crusaders | |
| 6 | 6413 Degrees of Freedom | 7183 W.A.R. | 5851 Striking Vikings | |
| 7 | 2375 Dragon Robotics | 7425 Green Valley Robotics | 2438 'Iobotics | |
| 8 | 3009 High Scalers | 10903 The Ionizers | 8229 Balikbayan Bots | |

### Alliance Captain Comparison

| Alliance | Pred. Captain | Actual Captain | Match? |
|:---:|:---:|:---:|:---:|
| 1 | 3990 | 7426 | NO |
| 2 | 7426 | 4421 | NO |
| 3 | 4421 | 8503 | NO |
| 4 | 9406 | 991 | NO |
| 5 | 4270 | 3882 | NO |
| 6 | 991 | 6413 | NO |
| 7 | 6479 | 2375 | NO |
| 8 | 987 | 3009 | NO |

> Many of the same teams captained in both prediction and reality (7426, 4421, 991, 6413, 2375, 3009), but the ranking-to-captain-number mapping differed entirely due to the #1 seed shift (7426 was actual #1 instead of predicted 3990).

---

## Playoff Results

**Finals:** Alliance 1 defeated Alliance 2 in two straight matches: **372-171** and **380-204**

| | Predicted | Actual | Correct? |
|---|---|---|:---:|
| **Champion** | Alliance 1 (Capt: 3990) | Alliance 1 (Capt: 7426) | NO |
| **Finalist** | Alliance 2 (Capt: 7426) | Alliance 2 (Capt: 4421) | NO |

---

## Awards

| Award | Team(s) |
|-------|---------|
| **Regional Winners** | 7426 PAIR OF DICE ROBOTICS, 987 HIGHROLLERS, 1165 Team Paradise |
| **Regional Finalists** | 4421 FORGE Robotics, 8005 Mega MeadowBots, 10183 ARC |
| Regional FIRST Impact Award | 4253 Raid Zero |
| Regional Engineering Inspiration Award (SpaceX) | 7426 PAIR OF DICE ROBOTICS |
| Rookie All Star Award | 10903 The Ionizers |
| Rising All-Star Award | 9233 Luminous Robotics Team |
| Autonomous Award (Google.org) | 4421 FORGE Robotics |
| Creativity Award (Rockwell Automation) | 987 HIGHROLLERS |
| Excellence in Engineering Award (Littelfuse) | 6413 Degrees of Freedom |
| Industrial Design Award | 991 BroncoBots |
| Innovation in Control Award (nVent) | 10183 ARC |
| Quality Award | 8005 Mega MeadowBots |
| Team Sustainability Award (Dow) | 3990 Tech for Kids |
| Team Spirit Award | 5851 Striking Vikings |
| Gracious Professionalism Award | 4270 Crusaders |
| Imagery Award (Jack Kamen) | 2375 Dragon Robotics |
| Judges' Award | 6479 AZTECH Robotics |
| Woodie Flowers Finalist Award | 7183 W.A.R. |
| FIRST Leadership Award Finalist | 10903 The Ionizers, 8005 Mega MeadowBots |
| Volunteer of the Year | 987 HIGHROLLERS (Marc Rogers) |

---

## Team Deep Dives

### Team 3990 - Tech for Kids

| Field | Value |
|-------|-------|
| Location | Montreal, QC, Canada |
| Rookie Year | 2012 (14 years experience) |
| 2026 Schedule | Can. Pacific -> Pittsburgh -> Las Vegas -> FIRST Championship (Houston) |

#### Canadian Pacific Regional (Event 1 - Completed)
- **Record:** 7-3-0 (70% win rate)
- **Ranking:** 4th of 44 teams (90.7th percentile)
- **OPR:** 153.09 -- 2nd highest among LV-bound teams
- **Avg Alliance Score:** 249.00 -- HIGHEST among all LV teams; contributed ~61%
- **Avg RP/Match:** 3.20
- **Playoff:** Alliance 2, 1st Pick. Eliminated in DE Round 5.
- **Award:** Team Sustainability Award (Dow)

#### Greater Pittsburgh Regional (Event 2 - Completed)
- **Record:** 5-1-0 (83.3%) at 49/63 snapshot
- **Ranking:** 4th of 50
- **OPR:** 165.41 -- up from 153.09 (+8%)
- **Avg RP/Match:** 3.67

#### Las Vegas Prediction vs Actual
| | Predicted | Actual |
|---|---|---|
| Rank | #1 | #12 |
| Alliance | Captain, Alliance 1 | Pick on Alliance 4 (by 991) |
| Playoff | CHAMPION | Eliminated before finals |
| Award | -- | Team Sustainability Award (Dow) |

#### Strengths
- Elite OPR (153-165), highest avg alliance score, proven playoff team, 14 years experience, multi-event advantage, strong RP economy (3.20-3.67)

#### Head-to-Head Context
- **vs 7426:** OPR gap ~29 pts. 7426 won their event -- 3990's biggest challenge.
- **vs 4421:** Nearly identical composite (0.2 pts apart). Coin flip on paper.
- **vs 4270:** Clear 42-point OPR advantage.

---

### Team 9406 - TechJunior

| Field | Value |
|-------|-------|
| Location | Vancouver, BC, Canada |
| Rookie Year | 2023 (3 years experience) |

#### Key Stats
- **Can. Pacific:** 7-2-0, Rank 7/44, OPR 114.68, 77.8% win rate (best at event)
- **Pittsburgh:** 5-1-0, Rank 5/50, OPR 128.43 (+12%)
- **LV Predicted:** #4 | **LV Actual:** #7 (off by 3 -- close)
- Outstanding for age. ~66% alliance contribution. Steep improvement curve.

---

### Team 7426 - PAIR OF DICE ROBOTICS

| Field | Value |
|-------|-------|
| Location | Las Vegas, NV (LOCAL) |
| Rookie Year | 2019 (7 years experience) |

#### Key Stats
- **AZ North:** 8-1-0, Rank 2/55, OPR 182.30 (HIGHEST), **TOURNAMENT WINNER**
- **Avg Alliance Score:** 209.56 -- contributed ~87% of alliance total
- **LV Predicted:** #2 | **LV Actual:** #1 (10-0-0 perfect record)
- **LV Result:** **EVENT WINNER** (372-171, 380-204 in finals)
- **LV Awards:** Regional Winner, Engineering Inspiration Award (SpaceX)

#### The Story
The clear favorite heading in, 7426 exceeded even high expectations. A perfect 10-0-0 quals record and dominant finals wins cemented them as the class of the field. Home field advantage + highest OPR + event-winner experience = the full package.

---

### Team 4421 - FORGE Robotics

| Field | Value |
|-------|-------|
| Location | Surrey, BC, Canada |
| Rookie Year | 2012 (14 years experience) |

#### Key Stats
- **Can. Pacific:** 8-2-0, Rank 3/44, OPR 148.00, Avg RP 3.40 (HIGHEST)
- **LV Predicted:** #3 | **LV Actual:** #2
- **LV Result:** **EVENT FINALIST** (Alliance 2 captain)
- **LV Awards:** Autonomous Award (Google.org), Regional Finalist

#### The Story
The most consistent elite team. Best RP economy in the field. Made it to the finals as Alliance 2 captain -- the model was close but underestimated their playoff ceiling.

---

### Team 991 - BroncoBots

| Field | Value |
|-------|-------|
| Location | Montrose, CO |
| Rookie Year | 2002 (24 years experience) |

- **AZ North:** 6-3-0, Rank 10/55, OPR 81.37. Surged from rank 22 to 10.
- **LV Predicted:** #6 | **LV Actual:** #6 (**EXACT MATCH** -- model's best prediction)
- **LV Alliance:** Captain of Alliance 4 (picked 3990 and 6479)
- **LV Award:** Industrial Design Award

---

### Team 4270 - Crusaders

| Field | Value |
|-------|-------|
| Location | Surrey, BC |
| Rookie Year | 2012 (14 years) |

- **Can. Pacific:** 7-3-0, Rank 6/44, OPR 111.07
- **LV Predicted:** #5 | **LV Actual:** #16 (off by 11 -- model overestimated)
- **LV Award:** Gracious Professionalism Award

---

### Team 6479 - AZTECH Robotics

| Field | Value |
|-------|-------|
| Location | Phoenix, AZ |
| Rookie Year | 2017 (9 years) |

- **AZ North:** 7-2-0, Rank 5/55, OPR 46.94 (the "OPR Paradox")
- **LV Predicted:** #7 | **LV Actual:** #21 (off by 14 -- model's biggest miss)
- **Verdict:** The OPR Paradox resolved toward OPR. Win rate was schedule/partner inflated.
- **LV Award:** Judges' Award

---

### Team 987 - HIGHROLLERS

| Field | Value |
|-------|-------|
| Location | Las Vegas, NV (LOCAL) |
| Rookie Year | 2002 (24 years) |

- **AZ North:** 5-4-0, Rank 14/55, OPR 69.75
- **LV Predicted:** #8 | **LV Actual:** #3 (major outperformance, +5 ranks)
- **LV Alliance:** 1st Pick on winning Alliance 1 (picked by 7426)
- **LV Result:** **EVENT WINNER**
- **LV Awards:** Regional Winner, Creativity Award, Volunteer of the Year
- **The Story:** The veteran home-field team delivered when it mattered most. Modest AZ North results masked a team that stepped up at their home event and was picked by the dominant 7426 to form the winning alliance.

---

## Pittsburgh Regional Preview

**Event:** 2026 Greater Pittsburgh Regional (2026paca)
**Dates:** March 18-21, 2026
**Venue:** David L. Lawrence Convention Center
**Teams:** 50
**Data as of:** March 20, 2026 (49/63 quals complete)

### Tracked Teams

**3990 Tech for Kids:** Record 5-1-0 (83.3%), Rank 4/50, OPR 165.41 (up from 153.09). Performing as expected.

**9406 TechJunior:** Record 5-1-0 (83.3%), Rank 5/50, OPR 128.43 (up from 114.68). Exceeding expectations.

### Live Top 10 Leaderboard

| # | Team | OPR | Record | Rank | Notes |
|:---:|------|:---:|:------:|:----:|-------|
| 1 | 3015 Ranger Robotics | 250.33 | 5-1-0 | 3 | HIGHEST OPR, confirmed elite |
| 2 | 4028 The Beak Squad | 222.03 | 5-0-0 | 1 | Biggest surprise -- no prior data, perfect |
| 3 | 340 G.R.R. | 203.92 | 5-0-0 | 2 | Undefeated, 200+ OPR |
| 4 | 3990 Tech for Kids | 165.41 | 5-1-0 | 4 | Tracked team |
| 5 | 117 Steel Dragons | 143.60 | 3-2-0 | 13 | OPR >> record (bad luck partners) |
| 6 | 4027 Centre Punch | 136.36 | 3-2-0 | 17 | High OPR, underrated by record |
| 7 | 9406 TechJunior | 128.43 | 5-1-0 | 5 | Tracked team |
| 8 | 4467 Titanium Titans | 98.82 | 3-3-0 | 21 | Mid-tier |
| 9 | 3173 IgKnighters | 95.73 | 4-2-0 | 10 | Improved from Finger Lakes |
| 10 | 1511 Rolling Thunder | 80.25 | 5-1-0 | 7 | Great record, lower OPR than expected |

### Pittsburgh Surprises
- **4028 The Beak Squad:** Zero prior data, now 5-0-0 with OPR 222. 2nd-best robot at the event.
- **117 Steel Dragons:** OPR 143.60 is elite but record is only 3-2-0. Smart captains will see past the record.
- **3504 Girls of Steel:** OPR -14.62 despite 3-3-0. Winning without contributing scoring.
- **3015 vs 4028:** Class of the field (OPR 250 and 222). If same alliance, dominant. If opposing captains, that's the finals matchup.

### Pittsburgh Predicted Rankings (Top 10)

| Rank | Team # | Name | Score | Tier |
|:---:|:---:|---|:---:|---|
| 1 | 3015 | Ranger Robotics | 92.9 | Elite |
| 2 | 340 | G.R.R. | 92.1 | Elite |
| 3 | 4028 | The Beak Squad | 91.2 | Elite |
| 4 | 3990 | Tech for Kids | 79.7 | Elite |
| 5 | 9406 | TechJunior | 68.8 | Strong |
| 6 | 117 | Steel Dragons | 67.3 | Strong |
| 7 | 1511 | Rolling Thunder | 64.8 | Strong |
| 8 | 3173 | IgKnighters | 60.8 | Strong |
| 9 | 4027 | Centre Punch | 59.8 | Strong |
| 10 | 2656 | Quasics | 58.0 | Strong |

---

## All Registered Teams

| Team # | Name | Location | Rookie Year |
|:------:|------|----------|:----------:|
| 60 | The Bionic Bulldogs | Kingman, AZ | 1997 |
| 987 | HIGHROLLERS | Las Vegas, NV | 2002 |
| 988 | Steel Phoenix | Phoenix, AZ | 2002 |
| 991 | BroncoBots | Montrose, CO | 2002 |
| 1011 | CRUSH | Glendale, AZ | 2003 |
| 1165 | Team Paradise | Paradise, NV | 2003 |
| 1726 | N.E.R.D.S. | Reno, NV | 2006 |
| 2375 | Dragon Robotics | Las Vegas, NV | 2008 |
| 2438 | 'Iobotics | Honolulu, HI | 2008 |
| 3009 | High Scalers | Boulder City, NV | 2009 |
| 3577 | Saint's Robotics | Yuma, AZ | 2011 |
| 3882 | Lunas | Honolulu, HI | 2011 |
| 3990 | Tech for Kids | Montreal, QC | 2012 |
| 4253 | Raid Zero | Taipei, TW | 2012 |
| 4270 | Crusaders | Surrey, BC | 2012 |
| 4421 | FORGE Robotics | Surrey, BC | 2012 |
| 5049 | Minerbots | Las Vegas, NV | 2014 |
| 6413 | Degrees of Freedom | Las Vegas, NV | 2017 |
| 6479 | AZTECH Robotics | Phoenix, AZ | 2017 |
| 6824 | LVA Robot Pigeons | Las Vegas, NV | 2018 |
| 7183 | W.A.R. | Kaneohe, HI | 2018 |
| 7425 | Green Valley Robotics | Henderson, NV | 2019 |
| 7426 | PAIR OF DICE ROBOTICS | Las Vegas, NV | 2019 |
| 7654 | Robot In Shed | Henderson, NV | 2019 |
| 8005 | Mega MeadowBots | Las Vegas, NV | 2020 |
| 8229 | Balikbayan Bots | Las Vegas, NV | 2020 |
| 8338 | Bear Force | Victoria, BC | 2020 |
| 8387 | MECH Mavericks | Las Vegas, NV | 2020 |
| 8503 | Raid One | Taipei, TW | 2020 |
| 8717 | Cyber Vipers | Las Vegas, NV | 2021 |
| 9002 | Falcon Dynamics | Henderson, NV | 2023 |
| 9018 | ElRobotiKO | Elko, NV | 2023 |
| 9037 | HHS Black Ops | Henderson, NV | 2023 |
| 9059 | COLTech Robotics | Las Vegas, NV | 2023 |
| 9151 | RoboLynx | Las Vegas, NV | 2023 |
| 9233 | Luminous Robotics | Istanbul, TR | 2023 |
| 9406 | TechJunior | Vancouver, BC | 2023 |
| 9426 | CLAWBOTICS | Reno, NV | 2024 |
| 9534 | Wolves Robotics | Henderson, NV | 2024 |
| 10183 | ARC | Las Vegas, NV | 2025 |
| 10186 | feenx | Reno, NV | 2025 |
| 10903 | The Ionizers | Reno, NV | 2026 |
| 10905 | Team LOVE | Phoenix, AZ | 2026 |
| 11235 | Golden Ratio | N. Las Vegas, NV | 2026 |

---

*Generated by `frc_vegas_prediction.py` and the FRC 2026 REBUILT Expert Agent (`/frc-expert`).*
*Source code: [frc_vegas_prediction.py](frc_vegas_prediction.py) | Knowledge base: [.claude/skills/frc-expert/](.claude/skills/frc-expert/)*
