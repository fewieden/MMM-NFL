/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

/* eslint-env node */

const request = require('request');
const parser = require('xml2js').parseString;
const moment = require('moment-timezone');

const NodeHelper = require('node_helper');

const ESPN = require('./espn');
const StatisticsAPI = require('./StatisticsAPI');

module.exports = NodeHelper.create({

    urls: {
        regular: 'http://static.nfl.com/liveupdate/scorestrip/ss.xml',
        post: 'http://static.nfl.com/liveupdate/scorestrip/postseason/ss.xml'
    },
    mode: 'regular',
    scores: [],
    details: {},
    nextMatch: null,
    live: {
        state: false,
        matches: []
    },

    start() {
        console.log(`Starting module: ${this.name}`);
    },

    socketNotificationReceived(notification, payload) {
        if (notification === 'CONFIG') {
            this.config = payload;
            this.getData();
            setInterval(() => {
                this.getData();
            }, this.config.reloadInterval);
            // setInterval(() => {
            //     this.fetchOnLiveState();
            // }, 60 * 1000);
        } else if (notification === 'GET_STATISTICS') {
            this.getStatistics(payload);
        }
    },

    async getData() {
        // request({ url: this.urls[this.mode] }, (error, response, body) => {
        //     if (response.statusCode === 200) {
        //         parser(body, (err, result) => {
        //             if (err) {
        //                 console.log(err);
        //             } else if (Object.prototype.hasOwnProperty.call(result, 'ss')) {
        //                 this.scores = result.ss.gms[0].g;
        //                 this.details = result.ss.gms[0].$;
        //                 this.setMode();
        //                 this.sendSocketNotification('SCORES', { scores: this.scores, details: this.details });
        //             } else {
        //                 console.log('Error no NFL data');
        //             }
        //         });
        //     } else {
        //         console.log(`Error getting NFL scores ${response.statusCode}`);
        //     }
        // });

        try {
            const data = await ESPN.getData();
            this.sendSocketNotification('SCORES', data);
        } catch (error) {
            console.log(`Error getting NFL scores ${error}`);
        }
    },

    getStatistics(type) {
        StatisticsAPI.getStats(type, (err, stats) => {
            if (err) {
                console.log(`MMM-NFL: Error => ${err}`);
                this.sendSocketNotification('ERROR', { error: `Statistics for ${type} not found!` });
            } else {
                this.sendSocketNotification('STATISTICS', stats);
            }
        });
    },

    setMode() {
        let allEnded = true;
        let next = null;
        const now = Date.now();
        const inGame = ['1', '2', '3', '4', 'H', 'OT'];
        const ended = ['F', 'FO', 'T'];
        for (let i = 0; i < this.scores.length; i += 1) {
            const temp = this.scores[i].$;
            this.scores[i].$.starttime = moment.tz(
                `${temp.eid.slice(0, 4)}-${temp.eid.slice(4, 6)}-${temp.eid.slice(6, 8)} ${(`0${12 + parseInt(temp.t.split(':')[0])}${temp.t.slice(-3)}`).slice(-5)}`,
                'America/New_York'
            );
            const index = this.live.matches.indexOf(this.scores[i].$.gsis);
            if (this.scores[i].$.q === 'P') {
                allEnded = false;
                if (next === null) {
                    next = this.scores[i].$;
                }
            } else if ((inGame.includes(this.scores[i].$.q) || Date.parse(this.scores[i].$.starttime) > now) &&
                !this.live.matches.includes(this.scores[i].$.gsis)) {
                allEnded = false;
                this.live.matches.push(this.scores[i].$.gsis);
                this.live.state = true;
            } else if (ended.indexOf(this.scores[i].$.q) !== -1 && index !== -1) {
                this.live.matches.splice(index, 1);
                if (this.live.matches.length === 0) {
                    this.live.state = false;
                }
            }
        }

        const currentDate = new Date();
        if (this.mode === 'regular' && this.details.w >= 17 && (currentDate.getMonth() < 5 || currentDate.getMonth() > 10) && allEnded) {
            this.mode = 'post';
            this.getData();
            return;
        } else if (this.mode === 'post' && currentDate.getMonth() >= 5) {
            this.mode = 'regular';
            this.getData();
            return;
        }

        for (let i = this.scores.length - 2; i >= 0; i -= 1) {
            const previous = this.scores[i].$.starttime;
            const match = this.scores[i + 1].$.starttime;
            if (previous.diff(match) > 0) {
                previous.subtract(12, 'hours');
            }
        }

        if (allEnded === true) {
            this.nextMatch = null;
        }

        if ((this.nextMatch === null && allEnded === false) || this.live.state === true) {
            this.nextMatch = {
                id: next.gsis,
                time: next.starttime
            };
        }
    },

    fetchOnLiveState() {
        if (this.live.state === true) {
            this.getData();
        }
    }
});
