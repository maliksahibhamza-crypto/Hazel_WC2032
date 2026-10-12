"use strict";

/* =========================================================
   HAZEL T20 WORLD CUP 2032
   Complete browser-based tournament engine.

   Features:
   - Automatic qualifier progression
   - Automatic group standings
   - Automatic Super 16 qualification
   - Automatic knockout progression
   - Automatic points and NRR
   - LocalStorage persistence
   - Backup export/import
   - Downstream result invalidation
   ========================================================= */

const STORAGE_KEY = "hazel_t20_world_cup_2032_v1";

const GROUPS = {
    A: ["India", "Pakistan", "USA", "Qualifier 1 Winner"],
    B: ["England", "Canada", "Italy", "Qualifier 2 Winner"],
    C: ["Australia", "Afghanistan", "Hong Kong", "Qualifier 3 Winner"],
    D: ["New Zealand", "Papua New Guinea", "UAE", "Qualifier 4 Winner"],
    E: ["South Africa", "Uganda", "Namibia", "Qualifier 5 Winner"],
    F: ["West Indies", "Zimbabwe", "Oman", "Qualifier 6 Winner"],
    G: ["Bangladesh", "Scotland", "Nepal", "Qualifier 7 Winner"],
    H: ["Sri Lanka", "Ireland", "Netherlands", "Qualifier 8 Winner"]
};

const FLAGS = {
    "India": "🇮🇳",
    "Pakistan": "🇵🇰",
    "USA": "🇺🇸",
    "England": "🏴",
    "Canada": "🇨🇦",
    "Italy": "🇮🇹",
    "Australia": "🇦🇺",
    "Afghanistan": "🇦🇫",
    "Hong Kong": "🇭🇰",
    "New Zealand": "🇳🇿",
    "Papua New Guinea": "🇵🇬",
    "UAE": "🇦🇪",
    "South Africa": "🇿🇦",
    "Uganda": "🇺🇬",
    "Namibia": "🇳🇦",
    "West Indies": "🏏",
    "Zimbabwe": "🇿🇼",
    "Oman": "🇴🇲",
    "Bangladesh": "🇧🇩",
    "Scotland": "🏴",
    "Nepal": "🇳🇵",
    "Sri Lanka": "🇱🇰",
    "Ireland": "🇮🇪",
    "Netherlands": "🇳🇱",
    "Malaysia": "🇲🇾",
    "Kuwait": "🇰🇼",
    "Spain": "🇪🇸",
    "Bahrain": "🇧🇭",
    "Qatar": "🇶🇦",
    "Jersey": "🇯🇪",
    "Saudi Arabia": "🇸🇦",
    "Bermuda": "🇧🇲",
    "Kenya": "🇰🇪",
    "Tanzania": "🇹🇿",
    "Portugal": "🇵🇹",
    "Guernsey": "🇬🇬",
    "Denmark": "🇩🇰",
    "Germany": "🇩🇪",
    "Cayman Islands": "🇰🇾",
    "Nigeria": "🇳🇬",

    "Qualifier Team A": "🏏",
    "Qualifier Team B": "🏏",
    "Qualifier Team C": "🏏",
    "Qualifier Team D": "🏏",
    "Qualifier Team E": "🏏",
    "Qualifier Team F": "🏏",
    "Qualifier Team G": "🏏",
    "Qualifier Team H": "🏏",
    "Qualifier Team I": "🏏",
    "Qualifier Team J": "🏏",
    "Qualifier Team K": "🏏",
    "Qualifier Team L": "🏏",
    "Qualifier Team M": "🏏",
    "Qualifier Team N": "🏏",
    "Qualifier Team O": "🏏",
    "Qualifier Team P": "🏏"
};

const $ = id => document.getElementById(id);

const state = {
    matches: [],
    nextId: 1
};

/*
    Knockout structure:

    8 qualifiers
    48 group matches
    8 Super 16 matches (Round of 16)
    4 Quarter-Finals
    2 Semi-Finals
    1 Final

    Total: 71 matches.
*/

/* =========================================================
   1. FIXTURE GENERATION
   ========================================================= */

function addMatch(stage, date, teamA, teamB, group = null, label = "") {
    state.matches.push({
        id: state.nextId++,
        stage,
        date,
        teamA,
        teamB,
        group,
        label,
        status: "upcoming",
        scoreA: null,
        scoreB: null,
        winner: null,
        resultText: ""
    });
}

function makeRoundRobin(teams, group, startDate) {
    const base = new Date(startDate + "T12:00:00Z");

    const pairs = [
        [0, 1],
        [2, 3],
        [0, 2],
        [1, 3],
        [0, 3],
        [1, 2]
    ];

    pairs.forEach((pair, index) => {
        const date = new Date(base);

        date.setUTCDate(date.getUTCDate() + index);

        addMatch(
            "Group Stage",
            date.toISOString().slice(0, 10),
            teams[pair[0]],
            teams[pair[1]],
            group,
            `Group ${group} • Match ${index + 1}`
        );
    });
}

function generateFixtures() {
    state.matches = [];
    state.nextId = 1;

    /*
       QUALIFIERS
       Each qualifier winner enters its designated group.
    */

    const qualifierPairs = [
    ["Malaysia", "Kuwait"],
    ["Spain", "Bahrain"],
    ["Qatar", "Jersey"],
    ["Saudi Arabia", "Bermuda"],
    ["Kenya", "Tanzania"],
    ["Portugal", "Guernsey"],
    ["Denmark", "Germany"],
    ["Cayman Islands", "Nigeria"]
];

    qualifierPairs.forEach((pair, index) => {
        addMatch(
            "Qualifier",
            `2032-09-${String(index + 1).padStart(2, "0")}`,
            pair[0],
            pair[1],
            null,
            `Qualifier ${index + 1}`
        );
    });

    /*
       GROUP STAGE
       8 groups × 4 teams × 6 matches per group = 48.
    */

    Object.entries(GROUPS).forEach(([group, teams], index) => {
        const day = 10 + index * 3;

        makeRoundRobin(
            teams,
            group,
            `2032-09-${String(day).padStart(2, "0")}`
        );
    });

    /*
       SUPER 16
       Eight Round-of-16 matches.
       The top two teams from each group enter these slots.
    */

    const roundOf16Pairs = [
        ["A1", "B2"],
        ["C1", "D2"],
        ["E1", "F2"],
        ["G1", "H2"],
        ["B1", "A2"],
        ["D1", "C2"],
        ["F1", "E2"],
        ["H1", "G2"]
    ];

    roundOf16Pairs.forEach((pair, index) => {
        addMatch(
            "Super 16",
            `2032-10-${String(15 + index).padStart(2, "0")}`,
            `Group ${pair[0][0]} ${pair[0][1] === "1" ? "Winner" : "Runner-up"}`,
            `Group ${pair[1][0]} ${pair[1][1] === "1" ? "Winner" : "Runner-up"}`,
            null,
            `Round of 16 Match ${index + 1}`
        );
    });

    /*
       QUARTER-FINALS
       Winners of Round-of-16 matches advance automatically.
    */

    for (let i = 1; i <= 4; i++) {
        addMatch(
            "Quarter-Final",
            `2032-11-${String(8 + i).padStart(2, "0")}`,
            `Super 16 Winner ${i * 2 - 1}`,
            `Super 16 Winner ${i * 2}`,
            null,
            `Quarter-Final ${i}`
        );
    }

    /*
       SEMI-FINALS
    */

    addMatch(
        "Semi-Final",
        "2032-11-13",
        "Quarter-Final 1 Winner",
        "Quarter-Final 2 Winner",
        null,
        "Semi-Final 1"
    );

    addMatch(
        "Semi-Final",
        "2032-11-14",
        "Quarter-Final 3 Winner",
        "Quarter-Final 4 Winner",
        null,
        "Semi-Final 2"
    );

    /*
       FINAL
    */

    addMatch(
        "Final",
        "2032-11-16",
        "Semi-Final 1 Winner",
        "Semi-Final 2 Winner",
        null,
        "Grand Final"
    );
}

/* =========================================================
   2. GENERAL HELPERS
   ========================================================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function flag(team) {
    return FLAGS[team] || "🏏";
}

function teamLabel(team) {
    return `
        <span class="team-identity">
            <span class="flag">${flag(team)}</span>
            <span class="team-name">${escapeHTML(team)}</span>
        </span>
    `;
}

function formatDate(date) {
    if (!date) return "Date TBC";

    const parsed = new Date(date + "T12:00:00Z");

    return parsed.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    });
}

function stageShort(stage) {
    return stage;
}

function scoreText(score) {
    if (!score) return "—";

    return `${score.runs}/${score.wickets} (${score.overs} ov)`;
}

function getMatchByLabel(stage, label) {
    return state.matches.find(
        match => match.stage === stage && match.label === label
    ) || null;
}

/* =========================================================
   3. SCORE AND WINNER HELPERS
   ========================================================= */

function matchHasResult(match) {
    return Boolean(
        match &&
        match.status === "completed" &&
        match.scoreA &&
        match.scoreB &&
        match.scoreA.runs !== match.scoreB.runs
    );
}

function getMatchWinner(match) {
    if (!matchHasResult(match)) return null;

    const teamA = resolveTeamName(match.teamA);
    const teamB = resolveTeamName(match.teamB);

    return match.scoreA.runs > match.scoreB.runs
        ? teamA
        : teamB;
}

/*
    A no-result match never produces a knockout winner.
    A tied score is not treated as a winner.
    This version does not simulate Super Overs.
*/

/* =========================================================
   4. CRICKET OVERS AND NRR
   ========================================================= */

function parseOvers(value) {
    const text = String(value).trim();

    const match = text.match(/^(\d{1,2})(?:\.([0-5]))?$/);

    if (!match) {
        throw new Error(
            "Overs format invalid. Use 19.4 for 19 overs and 4 balls."
        );
    }

    const wholeOvers = Number(match[1]);
    const balls = Number(match[2] || 0);

    if (wholeOvers > 20 || (wholeOvers === 20 && balls > 0)) {
        throw new Error("A T20 innings cannot exceed 20 overs.");
    }

    const totalBalls = wholeOvers * 6 + balls;

    if (totalBalls <= 0) {
        throw new Error("Overs must be greater than zero.");
    }

    return {
        notation: `${wholeOvers}.${balls}`,
        balls: totalBalls
    };
}

function getScoreFromForm(prefix) {
    const runs = Number($(`runs${prefix}`).value);
    const wickets = Number($(`wickets${prefix}`).value);
    const oversInfo = parseOvers($(`overs${prefix}`).value);

    if (!Number.isInteger(runs) || runs < 0 || runs > 999) {
        throw new Error("Runs must be a whole number from 0 to 999.");
    }

    if (!Number.isInteger(wickets) || wickets < 0 || wickets > 10) {
        throw new Error("Wickets must be between 0 and 10.");
    }

    return {
        runs,
        wickets,
        overs: oversInfo.notation,
        balls: oversInfo.balls,
        allOut: wickets === 10
    };
}

/*
    For NRR, a team dismissed all out before 20 overs
    is treated as having faced its full 20-over allocation.
*/

function ballsForNRR(score) {
    if (score.wickets === 10 && score.balls < 120) {
        return 120;
    }

    return score.balls;
}

/* =========================================================
   5. AUTOMATIC QUALIFIER PROGRESSION
   ========================================================= */

/*
    Qualifier 1 Winner -> Group A
    Qualifier 2 Winner -> Group B
    ...
    Qualifier 8 Winner -> Group H
*/

function getQualifierWinner(number) {
    const match = getMatchByLabel("Qualifier", `Qualifier ${number}`);

    if (!matchHasResult(match)) return null;

    return getMatchWinner(match);
}

/* =========================================================
   6. GROUP STANDINGS
   ========================================================= */

function resolvedGroupTeams(group) {
    return (GROUPS[group] || []).map(resolveTeamName);
}

function calculateStandings(group) {
    const teams = resolvedGroupTeams(group);

    const table = teams.map(team => ({
        team,
        group,
        played: 0,
        won: 0,
        lost: 0,
        noResult: 0,
        points: 0,
        runsFor: 0,
        runsAgainst: 0,
        ballsFor: 0,
        ballsAgainst: 0,
        nrr: 0
    }));

    const byTeam = Object.fromEntries(
        table.map(row => [row.team, row])
    );

    state.matches.forEach(match => {
        if (
            match.stage !== "Group Stage" ||
            match.group !== group ||
            (match.status !== "completed" &&
             match.status !== "no-result")
        ) {
            return;
        }

        const teamA = resolveTeamName(match.teamA);
        const teamB = resolveTeamName(match.teamB);

        const a = byTeam[teamA];
        const b = byTeam[teamB];

        if (!a || !b) return;

        a.played++;
        b.played++;

        if (match.status === "no-result") {
            a.noResult++;
            b.noResult++;

            a.points += 1;
            b.points += 1;

            // NRR unchanged for a no-result match.
            return;
        }

        if (!match.scoreA || !match.scoreB) return;

        a.runsFor += match.scoreA.runs;
        a.runsAgainst += match.scoreB.runs;

        a.ballsFor += ballsForNRR(match.scoreA);
        a.ballsAgainst += ballsForNRR(match.scoreB);

        b.runsFor += match.scoreB.runs;
        b.runsAgainst += match.scoreA.runs;

        b.ballsFor += ballsForNRR(match.scoreB);
        b.ballsAgainst += ballsForNRR(match.scoreA);

        if (match.scoreA.runs > match.scoreB.runs) {
            a.won++;
            b.lost++;
            a.points += 2;
        } else if (match.scoreB.runs > match.scoreA.runs) {
            b.won++;
            a.lost++;
            b.points += 2;
        }
    });

    table.forEach(row => {
        if (row.ballsFor > 0 && row.ballsAgainst > 0) {
            const runRateFor =
                row.runsFor / (row.ballsFor / 6);

            const runRateAgainst =
                row.runsAgainst / (row.ballsAgainst / 6);

            row.nrr = runRateFor - runRateAgainst;
        }
    });

    /*
       Sort:
       1. Points
       2. NRR
       3. Wins
       4. Team name as deterministic fallback
    */

    table.sort((a, b) =>
        b.points - a.points ||
        b.nrr - a.nrr ||
        b.won - a.won ||
        a.team.localeCompare(b.team)
    );

    return table;
}

function getGroupPosition(group, position) {
    const table = calculateStandings(group);

    return table[position - 1]?.team || null;
}

/* =========================================================
   7. AUTOMATIC ROUND PROGRESSION
   ========================================================= */

function resolveTeamName(rawTeam) {
    if (!rawTeam) return "TBC";

    /*
       Qualifier winner.
    */

    let match = rawTeam.match(/^Qualifier (\d+) Winner$/);

    if (match) {
        const winner = getQualifierWinner(Number(match[1]));

        return winner || rawTeam;
    }

    /*
       Group winner / runner-up.
    */

    match = rawTeam.match(/^Group ([A-H]) (Winner|Runner-up)$/);

    if (match) {
        const position = match[2] === "Winner" ? 1 : 2;

        return getGroupPosition(match[1], position) || rawTeam;
    }

    /*
       Super 16 winner -> Quarter-Final.
    */

    match = rawTeam.match(/^Super 16 Winner (\d+)$/);

    if (match) {
        const number = Number(match[1]);

        const winner = getMatchByLabel(
            "Super 16",
            `Round of 16 Match ${number}`
        );

        return getMatchWinner(winner) || rawTeam;
    }

    /*
       Quarter-Final winner -> Semi-Final.
    */

    match = rawTeam.match(/^Quarter-Final (\d+) Winner$/);

    if (match) {
        const winner = getMatchByLabel(
            "Quarter-Final",
            `Quarter-Final ${Number(match[1])}`
        );

        return getMatchWinner(winner) || rawTeam;
    }

    /*
       Semi-Final winner -> Final.
    */

    match = rawTeam.match(/^Semi-Final (\d+) Winner$/);

    if (match) {
        const winner = getMatchByLabel(
            "Semi-Final",
            `Semi-Final ${Number(match[1])}`
        );

        return getMatchWinner(winner) || rawTeam;
    }

    return rawTeam;
}

function displayTeam(match, side) {
    const rawTeam = side === "A" ? match.teamA : match.teamB;

    return resolveTeamName(rawTeam);
}

function getQualificationStatus(team, group, position) {
    const table = calculateStandings(group);

    const index = table.findIndex(row => row.team === team);

    if (index < 0) return "—";

    if (index === 0) return "Group Winner";
    if (index === 1) return "Runner-up";

    return "—";
}

/* =========================================================
   8. INVALIDATE DOWNSTREAM RESULTS
   ========================================================= */

/*
    If an earlier round is changed, later results can become
    invalid because their participants may change.

    Qualifier changed:
        Clear the corresponding group's results and all knockout results.

    Group Stage changed:
        Clear Super 16 and all knockout results.

    Super 16 changed:
        Clear Quarter-Finals, Semi-Finals and Final.

    Quarter-Final changed:
        Clear Semi-Finals and Final.

    Semi-Final changed:
        Clear Final.
*/

function clearResult(match) {
    match.status = "upcoming";
    match.scoreA = null;
    match.scoreB = null;
    match.winner = null;
    match.resultText = "";
}

function clearStages(stages) {
    state.matches.forEach(match => {
        if (stages.includes(match.stage)) {
            clearResult(match);
        }
    });
}

function invalidateDownstream(match) {
    if (match.stage === "Qualifier") {
        const number = Number(
            (match.label.match(/\d+/) || [0])[0]
        );

        const group = String.fromCharCode(64 + number);

        state.matches.forEach(item => {
            if (
                item.stage === "Group Stage" &&
                item.group === group
            ) {
                clearResult(item);
            }
        });

        clearStages([
            "Super 16",
            "Quarter-Final",
            "Semi-Final",
            "Final"
        ]);

        return;
    }

    if (match.stage === "Group Stage") {
        clearStages([
            "Super 16",
            "Quarter-Final",
            "Semi-Final",
            "Final"
        ]);

        return;
    }

    if (match.stage === "Super 16") {
        clearStages([
            "Quarter-Final",
            "Semi-Final",
            "Final"
        ]);

        return;
    }

    if (match.stage === "Quarter-Final") {
        clearStages([
            "Semi-Final",
            "Final"
        ]);

        return;
    }

    if (match.stage === "Semi-Final") {
        clearStages(["Final"]);
    }
         }


/* =========================================================
   9. STORAGE AND MIGRATION
   ========================================================= */

function saveState() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                version: 2,
                matches: state.matches,
                nextId: state.nextId
            })
        );

        return true;
    } catch (error) {
        showToast(
            "Could not save data. Browser storage may be disabled or full."
        );

        return false;
    }
}

function copyOldResults(oldMatches) {
    if (!Array.isArray(oldMatches)) return;

    const oldResults = new Map();

    oldMatches.forEach(match => {
        if (!match || !match.stage || !match.label) return;

        oldResults.set(
            `${match.stage}::${match.label}`,
            match
        );
    });

    state.matches.forEach(match => {
        /*
           Keep existing qualifier and group results.
           Old Super 16/knockout matches used a different structure,
           so those results are intentionally not transferred.
        */

        if (
            match.stage !== "Qualifier" &&
            match.stage !== "Group Stage"
        ) {
            return;
        }

        const old = oldResults.get(
            `${match.stage}::${match.label}`
        );

        if (!old) return;

        if (
            old.status === "completed" &&
            old.scoreA &&
            old.scoreB
        ) {
            match.status = "completed";
            match.scoreA = old.scoreA;
            match.scoreB = old.scoreB;
            match.winner = old.winner || null;
            match.resultText = old.resultText || "";
        } else if (old.status === "no-result") {
            match.status = "no-result";
            match.scoreA = null;
            match.scoreB = null;
            match.winner = null;
        }
    });
}

function loadState() {
    let saved = null;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (raw) {
            saved =
JSON.parse(raw);
        }
    } catch (error) {
        saved = null;
    }

    /*
       Always generate the latest canonical schedule first.
    */

    generateFixtures();

    if (saved && Array.isArray(saved.matches)) {
        const isNewSchedule = saved.matches.some(
            match => match.label === "Round of 16 Match 1"
        );

        if (isNewSchedule) {
            state.matches = saved.matches;
            state.nextId = Number(saved.nextId) ||
                Math.max(0, ...state.matches.map(m => Number(m.id) || 0)) + 1;
        } else {
            copyOldResults(saved.matches);
            saveState();

            showToast(
                "Tournament updated. Qualifier and group results were preserved."
            );
        }
    } else {
        saveState();
    }
}

/* =========================================================
   10. RENDER STATS
   ========================================================= */

function matchStatusLabel(match) {
    if (match.status === "completed") return "Completed";
    if (match.status === "no-result") return "No result";

    return "Upcoming";
}

function matchStatusClass(match) {
    if (match.status === "completed") return "complete";
    if (match.status === "no-result") return "no-result";

    return "";
}

function matchResultText(match) {
    if (match.status === "no-result") {
        return "No result • 1 point each";
    }

    if (!matchHasResult(match)) {
        return "Match not played";
    }

    return `${getMatchWinner(match)} won`;
}

function renderStats() {
    $("totalMatches").textContent = state.matches.length;

    $("completedMatches").textContent = state.matches.filter(
        match =>
            match.status === "completed" ||
            match.status === "no-result"
    ).length;

    $("upcomingMatches").textContent = state.matches.filter(
        match => match.status === "upcoming"
    ).length;

    $("totalTeams").textContent =
        Object.values(GROUPS).flat().length;
}

/* =========================================================
   11. LATEST RESULTS
   ========================================================= */

function renderLatestResults() {
    const completed = state.matches
        .filter(match =>
            match.status === "completed" ||
            match.status === "no-result"
        )
        .slice()
        .reverse()
        .slice(0, 3);

    if (!completed.length) {
        $("latestResults").innerHTML = `
            <div class="empty-state">
                No results recorded yet. Use Play Match to enter the first score.
            </div>
        `;

        return;
    }

    $("latestResults").innerHTML = completed.map(match => `
        <article class="result-card">

            <div class="result-meta">
                <span>${escapeHTML(stageShort(match.stage))}</span>

                <span class="badge ${matchStatusClass(match)}">
                    ${escapeHTML(matchStatusLabel(match))}
                </span>
            </div>

            <div class="result-team">
                ${teamLabel(displayTeam(match, "A"))}

                <span class="result-score">
                    ${escapeHTML(scoreText(match.scoreA))}
                </span>
            </div>

            <div class="result-team">
                ${teamLabel(displayTeam(match, "B"))}

                <span class="result-score">
                    ${escapeHTML(scoreText(match.scoreB))}
                </span>
            </div>

            <div class="result-footer">
                ${escapeHTML(matchResultText(match))}
            </div>

        </article>
    `).join("");
}

/* =========================================================
   12. FIXTURE LIST
   ========================================================= */

function renderFixtures() {
    const search = $("fixtureSearch").value.trim().toLowerCase();
    const stage = $("stageFilter").value;
    const status = $("statusFilter").value;

    const filtered = state.matches.filter(match => {
        const teamA = displayTeam(match, "A");
        const teamB = displayTeam(match, "B");

        const searchable = [
            teamA,
            teamB,
            match.label,
            match.stage,
            match.group || ""
        ].join(" ").toLowerCase();

        const matchesSearch = searchable.includes(search);

        const matchesStage =
            stage === "all" || match.stage === stage;

        let matchesStatus = true;

        if (status === "upcoming") {
            matchesStatus = match.status === "upcoming";
        }

        if (status === "completed") {
            matchesStatus = match.status === "completed";
        }

        if (status === "no-result") {
            matchesStatus = match.status === "no-result";
        }

        return matchesSearch && matchesStage && matchesStatus;
    });

    if (!filtered.length) {
        $("fixtureList").innerHTML = `
            <div class="empty-state">
                No matches match your filters.
            </div>
        `;

        return;
    }

    $("fixtureList").innerHTML = filtered.map(match => `
        <article class="fixture-card">

            <div class="fixture-meta">
                <div>
                    <strong>
                        ${escapeHTML(match.label || match.stage)}
                    </strong>

                    ${escapeHTML(formatDate(match.date))}
                </div>

                <span class="badge ${matchStatusClass(match)}">
                    ${escapeHTML(matchStatusLabel(match))}
                </span>
            </div>

            <div class="fixture-teams">
                ${teamLabel(displayTeam(match, "A"))}

                <span class="versus">VS</span>

                ${teamLabel(displayTeam(match, "B"))}
            </div>

            <div class="fixture-result">

                <strong>
                    ${
                        match.status === "upcoming"
                            ? "Match scheduled"
                            : `${escapeHTML(scoreText(match.scoreA))} · ${escapeHTML(scoreText(match.scoreB))}`
                    }
                </strong>

                <small>
                    ${escapeHTML(matchResultText(match))}
                </small>

                <div style="margin-top:8px">
                    <button
                        class="btn btn-light edit-match"
                        data-id="${match.id}">
                        ${match.status === "upcoming" ? "Enter Score" : "Edit Result"}
                    </button>
                </div>

            </div>
        </article>
    `).join("");
}

/* =========================================================
   13. POINTS TABLE
   ========================================================= */

function renderPointsTable() {
    const selectedGroup = $("pointsGroup").value;

    const groups = selectedGroup === "all"
        ? Object.keys(GROUPS)
        : [selectedGroup];

    let html = "";

    groups.forEach(group => {
        const table = calculateStandings(group);

        table.forEach((row, index) => {
            const qualified = index < 2;

            html += `
                <tr class="${qualified ? "qualify" : ""}">

                    <td>${index + 1}</td>

                    <td>
                        <span class="team-cell">
                            <span class="flag">${flag(row.team)}</span>
                            ${escapeHTML(row.team)}
                        </span>

                        <small style="display:block;color:#708096">
                            Group ${group}
                        </small>
                    </td>

                    <td>${row.played}</td>
                    <td>${row.won}</td>
                    <td>${row.lost}</td>
                    <td>${row.noResult}</td>

                    <td class="points-value">
                        ${row.points}
                    </td>

                    <td>${row.nrr.toFixed(3)}</td>

                    <td>
                        ${
                            qualified
                                ? '<span class="qualify-label">Top 2</span>'
                                : "—"
                        }
                    </td>

                </tr>
            `;
        });
    });

    $("pointsBody").innerHTML = html;
}

/* =========================================================
   14. TEAM LIST
   ========================================================= */

function renderTeams() {
    const teams = Object.entries(GROUPS).flatMap(([group, list]) =>
        list.map(rawTeam => ({
            group,
            team: resolveTeamName(rawTeam)
        }))
    );

    $("teamGrid").innerHTML = teams.map(item => `
        <article class="team-card">

            <span class="flag">
                ${flag(item.team)}
            </span>

            <div>
                <strong>${escapeHTML(item.team)}</strong>
                <small>Group ${item.group}</small>
            </div>

        </article>
    `).join("");
}

/* =========================================================
   15. PLAY MATCH SELECTOR
   ========================================================= */

function renderMatchSelect() {
    const previous = $("matchSelect").value;

    $("matchSelect").innerHTML = state.matches.map(match => `
        <option value="${match.id}">
            ${escapeHTML(match.label || match.stage)}
            — ${escapeHTML(displayTeam(match, "A"))}
            vs ${escapeHTML(displayTeam(match, "B"))}
            (${escapeHTML(formatDate(match.date))})
        </option>
    `).join("");

    if (state.matches.some(match => String(match.id) === previous)) {
        $("matchSelect").value = previous;
    }

    updateSelectedMatch();
}

function selectedMatch() {
    return state.matches.find(
        match => match.id === Number($("matchSelect").value)
    ) || null;
}

function updateSelectedMatch() {
    const match = selectedMatch();

    if (!match) {
        $("selectedMatchInfo").textContent = "No fixture selected.";
        return;
    }

    const teamA = displayTeam(match, "A");
    const teamB = displayTeam(match, "B");

    $("teamAHeading").textContent = `${flag(teamA)} ${teamA}`;
    $("teamBHeading").textContent = `${flag(teamB)} ${teamB}`;

    $("selectedMatchInfo").textContent =
        `${match.label || match.stage} • ${formatDate(match.date)} • ${matchStatusLabel(match)}`;

    $("runsA").value = match.scoreA?.runs ?? "";
    $("wicketsA").value = match.scoreA?.wickets ?? "";
    $("oversA").value = match.scoreA?.overs ?? "";

    $("runsB").value = match.scoreB?.runs ?? "";
    $("wicketsB").value = match.scoreB?.wickets ?? "";
    $("oversB").value = match.scoreB?.overs ?? "";

    $("matchStatus").value =
        match.status === "no-result" ? "no-result" : "completed";

    $("formMessage").textContent = "";
    $("formMessage").className = "form-message";
}

function clearScoreForm() {
    $("runsA").value = "";
    $("wicketsA").value = "";
    $("oversA").value = "";

    $("runsB").value = "";
    $("wicketsB").value = "";
    $("oversB").value = "";

    $("matchStatus").value = "completed";

    $("formMessage").textContent = "";
    $("formMessage").className = "form-message";
}

function showFormMessage(message, type = "success") {
    $("formMessage").textContent = message;
    $("formMessage").className = `form-message ${type}`;
    }

/* =========================================================
   16. SAVE MATCH RESULT
   ========================================================= */

function saveMatchResult(event) {
    event.preventDefault();

    const match = selectedMatch();

    if (!match) {
        showFormMessage("Please select a fixture first.", "error");
        return;
    }

    /*
       Do not record a result if a knockout slot has no actual team.
       This prevents accidentally advancing placeholder names.
    */

    const actualTeamA = displayTeam(match, "A");
    const actualTeamB = displayTeam(match, "B");

    const unresolved = [
        "Qualifier",
        "Winner",
        "Runner-up",
        "TBC",
        "Super 16"
    ];

    const hasUnresolvedTeam = [actualTeamA, actualTeamB].some(team =>
        unresolved.some(word => team.includes(word))
    );

    if (hasUnresolvedTeam) {
        showFormMessage(
            "This match is waiting for the previous round to finish. Record the earlier results first.",
            "error"
        );

        return;
    }

    /*
       No-result handling.
    */

    if ($("matchStatus").value === "no-result") {
        invalidateDownstream(match);

        match.status = "no-result";
        match.scoreA = null;
        match.scoreB = null;
        match.winner = null;
        match.resultText = "No result — one point each.";

        saveState();
        renderAll();

        showFormMessage(
            "No result saved. Both teams receive one point. NRR is unchanged.",
            "success"
        );

        showToast("No-result match saved.");
        return;
    }

    try {
        const scoreA = getScoreFromForm("A");
        const scoreB = getScoreFromForm("B");

        if (scoreA.runs === scoreB.runs) {
            throw new Error(
                "Scores are level. This version does not simulate a Super Over. Enter the final score after applying your chosen tie-break rule."
            );
        }

        /*
           Clear dependent matches BEFORE saving the new result.
        */

        invalidateDownstream(match);

        match.status = "completed";
        match.scoreA = scoreA;
        match.scoreB = scoreB;

        match.winner = scoreA.runs > scoreB.runs
            ? actualTeamA
            : actualTeamB;

        match.resultText = `${match.winner} won.`;

        const saved = saveState();

        renderAll();

        showFormMessage(
            `Result saved! ${match.winner} won. The next-round fixtures have been recalculated.`,
            "success"
        );

        if (saved) {
            showToast("Result saved. Tournament progression updated.");
        }
    } catch (error) {
        showFormMessage(
            error.message || "Please check the score values.",
            "error"
        );
    }
}

/* =========================================================
   17. OPEN FIXTURE FOR EDITING
   ========================================================= */

function openMatchForEditing(id) {
    const match = state.matches.find(
        item => item.id === Number(id)
    );

    if (!match) return;

    $("matchSelect").value = String(match.id);

    updateSelectedMatch();

    $("play").scrollIntoView({
        behavior: "smooth"
    });
}

/* =========================================================
   18. TOAST MESSAGE
   ========================================================= */

let toastTimer;

function showToast(message) {
    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

/* =========================================================
   19. EXPORT BACKUP
   ========================================================= */

function exportBackup() {
    const backup = {
        app: "HAZEL T20 WORLD CUP 2032",
        version: 2,
        exportedAt: new Date().toISOString(),
        matches: state.matches,
        nextId: state.nextId
    };

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "hazel-t20-world-cup-2032-backup.json";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast("Tournament backup exported.");
}

/* =========================================================
   20. IMPORT BACKUP
   ========================================================= */

function importBackup(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);

            if (!data || !Array.isArray(data.matches)) {
                throw new Error(
                    "This file is not a valid tournament backup."
                );
            }

            const valid = data.matches.every(match =>
                match &&
                Number.isInteger(Number(match.id)) &&
                typeof match.teamA === "string" &&
                typeof match.teamB === "string" &&
                typeof match.stage === "string"
            );

            if (!valid) {
                throw new Error(
                    "The backup contains invalid match records."
                );
            }

            const hasRequiredFixture = data.matches.some(
                match => match.label === "Round of 16 Match 1"
            );

            if (!hasRequiredFixture) {
                throw new Error(
                    "This backup uses an older fixture format. Restore a backup created by the updated version."
                );
            }

            const confirmed = confirm(
                "Import this backup? Your current tournament data will be replaced."
            );

            if (!confirmed) return;

            state.matches = data.matches;
            state.nextId = Number(data.nextId) ||
                Math.max(0, ...state.matches.map(m => Number(m.id) || 0)) + 1;

            saveState();
            renderAll();

            showToast("Backup imported successfully.");
        } catch (error) {
            showToast(error.message || "Could not import backup.");
        } finally {
            $("importFile").value = "";
        }
    };

    reader.onerror = () => {
        showToast("Could not read the selected file.");
    };

    reader.readAsText(file);
}

/* =========================================================
   21. RESET TOURNAMENT
   ========================================================= */

function resetTournament() {
    const confirmed = confirm(
        "Reset all tournament results? This cannot be undone unless you have a backup."
    );

    if (!confirmed) return;

    generateFixtures();

    saveState();
    renderAll();
    clearScoreForm();

    showToast("Tournament reset. All results cleared.");
}

/* =========================================================
   22. NAVIGATION
   ========================================================= */

function setupNavigation() {
    $("menuToggle").addEventListener("click", () => {
        $("mainNav").classList.toggle("open");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => {
            document.querySelectorAll(".nav-link").forEach(item =>
                item.classList.remove("active")
            );

            link.classList.add("active");
            $("mainNav").classList.remove("open");
        });
    });
}

/* =========================================================
   23. EVENT LISTENERS
   ========================================================= */

function setupEvents() {
    $("scoreForm").addEventListener(
        "submit",
        saveMatchResult
    );

    $("matchSelect").addEventListener(
        "change",
        updateSelectedMatch
    );

    $("resetScore").addEventListener(
        "click",
        clearScoreForm
    );

    $("fixtureSearch").addEventListener(
        "input",
        renderFixtures
    );

    $("stageFilter").addEventListener(
        "change",
        renderFixtures
    );

    $("statusFilter").addEventListener(
        "change",
        renderFixtures
    );

    $("pointsGroup").addEventListener(
        "change",
        renderPointsTable
    );

    $("fixtureList").addEventListener("click", event => {
        const button = event.target.closest(".edit-match");

        if (button) {
            openMatchForEditing(button.dataset.id);
        }
    });

    $("exportData").addEventListener(
        "click",
        exportBackup
    );

    $("importButton").addEventListener("click", () => {
        $("importFile").click();
    });

    $("importFile").addEventListener("change", event => {
        importBackup(event.target.files[0]);
    });

    $("resetTournament").addEventListener(
        "click",
        resetTournament
    );
}

/* =========================================================
   24. RENDER EVERYTHING
   ========================================================= */

function renderAll() {
    /*
       Progression is resolved from the current saved results
       every time the interface renders.
    */

    renderStats();
    renderLatestResults();
    renderFixtures();
    renderPointsTable();
    renderTeams();
    renderMatchSelect();
}

/* =========================================================
   25. INITIALISE
   ========================================================= */

function init() {
    loadState();

    setupNavigation();
    setupEvents();

    renderAll();
}

document.addEventListener("DOMContentLoaded", init);
