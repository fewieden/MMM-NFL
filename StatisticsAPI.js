/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

/* eslint-env node */

const jsdom = require('jsdom');

module.exports = {

    URL: 'http://www.espn.com/nfl/statistics',
    CACHE_TIME: 2 * 60 * 1000, // 2 minutes

    statistics: {
        timestamp: null,
        data: {}
    },

    getStats(type, callback) {
        const time = Date.now();
        if (!this.statistics.timestamp || this.statistics.timestamp < time - this.CACHE_TIME ||
            !Object.prototype.hasOwnProperty.call(this.statistics.data, type.toUpperCase())) {
            jsdom.env({
                url: this.URL,
                done: (err, window) => {
                    if (err) {
                        callback(err, null);
                    } else {
                        const statistics = {};
                        const statisticsWrapper = window.document.querySelector('#my-players-table');
                        if (statisticsWrapper) {
                            const teams = [statisticsWrapper.children[0], statisticsWrapper.children[1]];
                            for (let i = 0; i < teams.length; i += 1) {
                                const types = teams[i].children;
                                for (let n = 0; n < types.length; n += 1) {
                                    const rows = types[n].querySelector('tbody').children;
                                    if (rows) {
                                        statistics[rows[0].children[0].textContent] = {
                                            unit: rows[0].children[1].textContent,
                                            players: []
                                        };
                                        for (let x = 1; x < rows.length - 1; x += 1) {
                                            const text = rows[x].children[rows[x].children.length - 2].textContent;
                                            statistics[rows[0].children[0].textContent].players.push({
                                                position: text[0],
                                                player: text.slice(3, text.lastIndexOf(',')),
                                                team: text.slice(text.lastIndexOf(',') + 2) === 'WSH' ? 'WAS' : text.slice(text.lastIndexOf(',') + 2),
                                                value: rows[x].children[rows[x].children.length - 1].textContent
                                            });
                                        }
                                    }
                                }
                            }

                            window.close();

                            this.statistics = {
                                timestamp: time,
                                data: statistics
                            };

                            if (Object.prototype.hasOwnProperty.call(this.statistics.data, type.toUpperCase())) {
                                callback(null, { type, data: this.statistics.data[type.toUpperCase()] });
                            } else {
                                callback(`Statistics for ${type} not found!`, null);
                            }
                        } else {
                            callback('Source changed site layout!', null);
                        }
                    }
                }
            });
        } else {
            callback(null, { type, data: this.statistics.data[type.toUpperCase()] });
        }
    }
};
