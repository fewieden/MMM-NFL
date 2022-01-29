/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

/* eslint-env node */

const NodeHelper = require('node_helper');
const Log = require('logger');

const ESPN = require('./espn');

const ONE_MINUTE = 60 * 1000;

const commandStatisticMapping = {
    passingTouchdowns: ['PASSING', 'TOUCHDOWNS'],
    rushingTouchdowns: ['RUSHING', 'TOUCHDOWNS'],
    receivingTouchdowns: ['RECEIVING', 'TOUCHDOWNS'],
    totalTouchdowns: ['TOTAL', 'TOUCHDOWNS'],
    passingYards: ['PASSING', 'YARDS'],
    rushingYards: ['RUSHING', 'YARDS'],
    receivingYards: ['RECEIVING', 'YARDS'],
    sacks: ['SACKS'],
    interceptions: ['INTERCEPTIONS'],
    totalTackles: ['TACKLES'],
    quarterbackRating: ['QUARTERBACK', 'RATING'],
    receptions: ['RECEPTIONS'],
    passesDefended: ['PASSES', 'DEFENDED'],
    totalPoints: ['TOTAL', 'POINTS'],
    puntYards: ['PUNT', 'YARDS'],
    kickoffYards: ['KICKOFF', 'YARDS']
};

module.exports = NodeHelper.create({
    requiresVersion: '2.15.0',

    scores: [],
    reloadInterval: null,
    liveInterval: null,

    async socketNotificationReceived(notification, payload) {
        if (notification === 'CONFIG') {
            this.config = payload;
            this.reloadInterval = setInterval(() => {
                this.getData();
            }, this.config.reloadInterval);
            this.liveInterval = setInterval(() => {
                this.fetchOnLiveState();
            }, ONE_MINUTE);
            await this.getData();
        } else if (notification === 'VOICE_COMMAND') {
            await this.handleVoiceCommand(payload);
        } else if (notification === 'SUSPEND') {
            this.stop();
        }
    },

    async getData() {
        try {
            const data = await ESPN.getData();
            this.scores = data.scores;
            this.sendSocketNotification('SCORES', data);
        } catch (error) {
            Log.error(`Error getting NFL scores ${error}`);
        }
    },

    async getStatisticsFromVoiceCommand(command) {
        try {
            let type = Object.keys(commandStatisticMapping)[0];
            for (const statisticType in commandStatisticMapping) {
                const matching = commandStatisticMapping[statisticType].every(word => command.includes(word));
                if (matching) {
                    type = statisticType;
                    break;
                }
            }
            const statistics = await ESPN.getStatistics(type);
            this.sendSocketNotification('STATISTICS', {type, statistics});
        } catch (error) {
            Log.error(`Error getting NFL statistics ${error}`);
        }
    },

    fetchOnLiveState() {
        const currentTime = new Date().toISOString();

        const endStates = ['final', 'final-overtime'];
        const liveMatch = this.scores.find(match => currentTime > match.timestamp && !endStates.includes(match.status));

        if (liveMatch) {
            this.getData();
        }
    },

    shouldCloseOpenModal(command) {
        return command.includes('HELP') && command.includes('CLOSE') || command.includes('STATISTIC') && command.includes('HIDE');
    },

    shouldShowHelpModal(command) {
        return command.includes('HELP') && command.includes('OPEN');
    },

    shouldShowStatisticModal(command) {
        return command.includes('SHOW') && command.includes('STATISTIC');
    },

    async handleVoiceCommand(command = '') {
        if (this.shouldCloseOpenModal(command)) {
            this.sendSocketNotification('CLOSE_MODAL');
        } else if (this.shouldShowHelpModal(command)) {
            this.sendSocketNotification('OPEN_HELP_MODAL');
        } else if (this.shouldShowStatisticModal(command)) {
            await this.getStatisticsFromVoiceCommand(command);
        }
    },

    stop() {
        clearInterval(this.liveInterval);
        clearInterval(this.reloadInterval);
    }
});
