/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

/* eslint-env node */

const NodeHelper = require('node_helper');

const ESPN = require('./espn');

const ONE_MINUTE = 60 * 1000;

module.exports = NodeHelper.create({
    scores: [],

    socketNotificationReceived(notification, payload) {
        if (notification === 'CONFIG') {
            this.config = payload;
            this.getData();
            setInterval(() => {
                this.getData();
            }, this.config.reloadInterval);
            setInterval(() => {
                this.fetchOnLiveState();
            }, ONE_MINUTE);
        }
    },

    async getData() {
        try {
            const data = await ESPN.getData();
            this.scores = data.scores;
            this.sendSocketNotification('SCORES', data);
        } catch (error) {
            console.log(`Error getting NFL scores ${error}`);
        }
    },

    fetchOnLiveState() {
        const currentTime = new Date().toISOString();

        const endStates = ['final', 'final-overtime'];
        const liveMatch = this.scores.find(match => currentTime > match.timestamp && !endStates.includes(match.status));

        if (liveMatch) {
            this.getData();
        }
    }
});
