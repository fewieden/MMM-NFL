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
        } else if (notification === 'STATISTICS') {
            await this.getStatistics(payload.type);
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

    async getStatistics(type) {
        try {
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

    stop() {
        clearInterval(this.liveInterval);
        clearInterval(this.reloadInterval);
    }
});
