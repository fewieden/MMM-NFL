const fetch = require('node-fetch');

const seasonStageMapping = {
    1: 'PRE',
    2: 'REG',
    3: 'POST',
    4: 'OFF',
};

const teamNameMapping = {
    LAR: 'LA',
    WSH: 'WAS',
};

const statisticTypes = [
    'passingYards',
    'rushingYards',
    'receivingYards',
    'totalTackles',
    'sacks',
    'kickoffYards',
    'interceptions',
    'passingTouchdowns',
    'quarterbackRating',
    'rushingTouchdowns',
    'receptions',
    'receivingTouchdowns',
    'totalPoints',
    'totalTouchdowns',
    'puntYards',
    'passesDefended'
];

function getFullUrl(apiVersion, path) {
    return `https://site.api.espn.com/apis/site/${apiVersion}/sports/football/nfl${path}`;
}

function getGameStatus(status = {}) {
    if (status.type?.state === 'pre') {
        return 'pregame';
    } else if (status.type?.name === 'STATUS_HALFTIME') {
        return 'halftime';
    } else if (status.type?.state === 'post') {
        if (status.period > 4) {
            return 'final-overtime';
        }

        return 'final';
    } else if (status.period > 4) {
        return 'overtime';
    }

    return status.period;
}

function getTeamName(competitor = {}) {
    const team = competitor.team?.abbreviation;

    return teamNameMapping[team] || team;
}

function mapEventEntry(event = {}) {
    const ongoing = !['pre', 'post'].includes(event.status?.type?.state);

    const possessionTeamId = event.competitions?.[0]?.situation?.possession;
    const possessionTeam = event.competitions?.[0]?.competitors?.find(c => c.id === possessionTeamId);

    return {
        timestamp: event.date,
        status: getGameStatus(event.status),
        remainingTime: ongoing && event.status?.displayClock,
        ballPossession: getTeamName(possessionTeam),
        inRedZone: event.competitions?.[0]?.situation?.isRedZone,
        homeTeam: getTeamName(event.competitions?.[0]?.competitors?.[0]),
        homeScore: event.competitions?.[0]?.competitors?.[0]?.score,
        homeLogo: event.competitions?.[0]?.competitors?.[0]?.team?.logo,
        awayTeam: getTeamName(event.competitions?.[0]?.competitors?.[1]),
        awayScore: event.competitions?.[0]?.competitors?.[1]?.score,
        awayLogo: event.competitions?.[0]?.competitors?.[1]?.team?.logo
    };
}

async function getData() {
    const response = await fetch(getFullUrl('v2', '/scoreboard'));

    if (!response.ok) {
        throw new Error('failed to fetch scoreboard');
    }

    const parsedResponse = await response.json();

    const details = {
        week: parsedResponse?.week?.number,
        season: parsedResponse?.season?.year,
        stage: seasonStageMapping[parsedResponse?.season?.type]
    };

    const events = parsedResponse?.events || [];

    const scores = events.map(mapEventEntry).sort((a, b) => {
        if (a.timestamp === b.timestamp) {
            return 0;
        }

        return a.timestamp > b.timestamp ? 1 : -1
    });

    return { details, scores };
}

function mapPlayerEntry(player = {}) {
    return {
        value: player.displayValue,
        name: player.athlete.fullName,
        avatar: player.athlete.headshot.href,
        team: getTeamName(player),
        logo: player?.team?.logos?.[0]?.href,
    };
}

async function getStatistics(type) {
    if (!statisticTypes.includes(type)) {
        throw new Error(`Unsupported statistic type: ${type}`);
    }

    const response = await fetch(getFullUrl('v3', '/leaders'));

    if (!response.ok) {
        throw new Error('failed to fetch scoreboard');
    }

    const parsedResponse = await response.json();

    const category = parsedResponse?.leaders?.categories?.find(c => c.name === type);

    const players = category?.leaders || [];

    const leaders = players.map(mapPlayerEntry);

    return leaders;
}

module.exports = { getData, getStatistics };
