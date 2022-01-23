const fetch = require('node-fetch');

const BASE_URL = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl';

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
        homeTeam: getTeamName(event.competitions?.[0]?.competitors?.[0]),
        homeScore: event.competitions?.[0]?.competitors?.[0]?.score,
        status: getGameStatus(event.status),
        timestamp: event.date,
        awayTeam: getTeamName(event.competitions?.[0]?.competitors?.[1]),
        awayScore: event.competitions?.[0]?.competitors?.[1]?.score,
        remainingTime: ongoing && event.status?.displayClock,
        inRedZone: event.competitions?.[0]?.situation?.isRedZone,
        ballPossession: getTeamName(possessionTeam)
    };
}

async function getData() {
    const response = await fetch(`${BASE_URL}/scoreboard`);

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

    return {details, scores};
}

module.exports = {getData};
