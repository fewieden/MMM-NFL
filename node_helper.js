/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

/* eslint-env node */

const NodeHelper = require('node_helper');

const ESPN = require('./espn');

module.exports = NodeHelper.create({
    socketNotificationReceived(notification, payload) {
        if (notification === 'CONFIG') {
            this.config = payload;
            this.getData();
            setInterval(() => {
                this.getData();
            }, this.config.reloadInterval);
        }
    },

    async getData() {
        try {
            const data = await ESPN.getData();
            this.sendSocketNotification('SCORES', data);
        } catch (error) {
            console.log(`Error getting NFL scores ${error}`);
        }
    }
});
