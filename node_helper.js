/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

const request = require('request');
const parser = require('xml2js').parseString;
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting module: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if(notification === 'CONFIG'){
            this.config = payload;
            this.getData({url: "http://www.nfl.com/liveupdate/scorestrip/ss.xml"});
            setInterval(() => {
                this.getData({url: "http://www.nfl.com/liveupdate/scorestrip/ss.xml"});
        }, this.config.reloadInterval);
        } 
    },

    getData: function(options) {
        request(options, (error, response, body) => {
            if (response.statusCode === 200) {
            parser(body, (err, result) => {
                if(err) {
                    console.log(err);
                }
                this.sendSocketNotification("SCORES", {scores: result.ss.gms[0].g, details: result.ss.gms[0].$});
            });
        } else {
            console.log("Error getting nfl scores " + response.statusCode);
        }
    });
    }
});