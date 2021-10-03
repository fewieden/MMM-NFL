const fetch = require('node-fetch');

const BASE_URL = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl';

const seasonTypeMapping = {
    1: 'P',
    2: 'R',
    3: 'POST',
    4: 'OFF',
};

const teamNameMapping = {
    LAR: 'LA',
    WSH: 'WAS',
};

function getGameStatus(status = {}) {
    if (status.type?.state === 'pre') {
        return 'P';
    } else if (status.type?.state === 'post') {
        return 'F';
    }

    return status.period;
}

function getTeamName(competitor = {}) {
    const team = competitor.team?.abbreviation;

    return teamNameMapping[team] || team;
}

function mapEventEntry(event = {}) {
    const ongoing = !['pre', 'post'].includes(event.status?.type?.state);
    const remainingTime = ongoing && event.status?.displayClock;

    return {
        $: {
            h: getTeamName(event.competitions?.[0]?.competitors?.[0]),
            hs: event.competitions?.[0]?.competitors?.[0]?.score,
            q: getGameStatus(event.status),
            starttime: event.date,
            v: getTeamName(event.competitions?.[0]?.competitors?.[1]),
            vs: event.competitions?.[0]?.competitors?.[1]?.score,
            k: remainingTime
        }
    };
}

async function getData() {
    const response = await fetch(`${BASE_URL}/scoreboard`);

    if (!response.ok) {
        throw new Error('failed to fetch scoreboard');
    }

    const parsedResponse = await response.json();

    const details = {
        w: parsedResponse?.week?.number,
        y: parsedResponse?.season?.year,
        t: seasonTypeMapping[parsedResponse?.season?.type]
    };

    const events = parsedResponse?.events || [];

    const scores = events.map(mapEventEntry).sort((a, b) => {
        if (a.$.starttime === b.$.starttime) {
            return 0;
        }

        return a.$.starttime > b.$.starttime ? 1 : -1
    });

    return {details, scores};
}

module.exports = {getData};
