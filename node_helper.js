/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

const request = require('request');
const parser = require('xml2js').parseString;
const moment = require('moment-timezone');
const StatisticsAPI = require("./StatisticsAPI.js");
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({

    urls: {
        regular: "http://www.nfl.com/liveupdate/scorestrip/ss.xml",
        post: "http://www.nfl.com/liveupdate/scorestrip/postseason/ss.xml"
    },
    mode: "regular",
    scores: [],
    details: {},
    nextMatch: null,
    live: {
        state: false,
        matches: []
    },

    start: function() {
        console.log("Starting module: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if(notification === 'CONFIG'){
            this.config = payload;
            this.getData();
            setInterval(() => {
                this.getData();
            }, this.config.reloadInterval);
            setInterval(() => {
                this.fetchOnLiveState();
            }, 60*1000);
        } else if(notification === "GET_STATISTICS"){
            this.getStatistics(payload);
        }
    },

    getData: function() {
        request({url: this.urls[this.mode]}, (error, response, body) => {
            if (response.statusCode === 200) {
                parser(body, (err, result) => {
                    if(err) {
                        console.log(err);
                    } else if(result.hasOwnProperty('ss')){
                        this.scores = result.ss.gms[0].g;
                        this.details = result.ss.gms[0].$;
                        this.setMode();
                        this.sendSocketNotification("SCORES", {scores: this.scores, details: this.details});
                        return;
                    } else {
                        console.log("Error no NFL data");
                    }
                });
            } else {
                console.log("Error getting NFL scores " + response.statusCode);
            }
        });
    },

    getStatistics: function(type){
        StatisticsAPI.getStats(type, (err, stats) => {
            if (err) {
                console.log("MMM-NFL: Error => " + err);
                this.sendSocketNotification("ERROR", {error: "Statistics for " + type + " not found!"});
            } else {
                this.sendSocketNotification("STATISTICS", stats);
            }
        });
    },

    setMode: function(){
        var current_date = new Date();
        if(this.mode === "regular" && this.details.w > 17 && (current_date.getMonth() < 1 || current_date.getMonth() > 10)){
            this.mode = "post";
            this.getData();
            return;
        } else if(this.mode === "post" && current_date.getMonth() >= 5){
            this.mode = "regular";
            this.getData();
            return;
        }

        var all_ended = true;
        var next = null;
        var now = Date.now();
        var in_game = ['1', '2', '3', '4', 'H', 'OT'];
        var ended = ['F', 'FO', 'T'];
        for(var i = 0; i < this.scores.length; i++) {
            var temp = this.scores[i].$;
            this.scores[i].$.starttime = moment.tz(
                temp.eid.slice(0, 4) + "-" + temp.eid.slice(4, 6) + "-" + temp.eid.slice(6, 8) + " " + ("0" + (12 + parseInt(temp.t.split(':')[0])) + temp.t.slice(-3)).slice(-5),
                "America/New_York"
            );
            if(this.scores[i].$.q === "P"){
                all_ended = false;
                if(next === null){
                    next = this.scores[i].$;
                }
            } else if((in_game.indexOf(this.scores[i].$.q) !== -1 || Date.parse(this.scores[i].$.starttime) > now) && this.live.matches.indexOf(this.scores[i].$.gsis) === -1){
                all_ended = false;
                this.live.matches.push(this.scores[i].$.gsis);
                this.live.state = true;
            } else if(ended.indexOf(this.scores[i].$.q) !== -1 && (index = this.live.matches.indexOf(this.scores[i].$.gsis)) !== -1){
                this.live.matches.splice(index, 1);
                if(this.live.matches.length === 0){
                    this.live.state = false;
                }
            }
        }

        for(var i = this.scores.length - 2; i >= 0; i--){
            var previous = this.scores[i].$.starttime;
            var match = this.scores[i + 1].$.starttime;
            if(previous.diff(match) > 0){
                previous.subtract(12, 'hours');
            }
        }

        if(all_ended === true){
            this.nextMatch = null;
        }

        if(this.nextMatch === null && all_ended === false || this.live.state === true){
            this.nextMatch = {
                id: next.gsis,
                time: next.starttime
            }
        }
    },

    fetchOnLiveState: function(){
        if(this.live.state === true){
            this.getData();
        }
    }
});
