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

    urls: {
        regular: "http://www.nfl.com/liveupdate/scorestrip/ss.xml",
        post: "http://www.nfl.com/liveupdate/scorestrip/postseason/ss.xml"
    },

    mode: "regular",

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
        } 
    },

    getData: function() {
        var options = {url: this.urls[this.mode]};
        request(options, (error, response, body) => {
            if (response.statusCode === 200) {
                parser(body, (err, result) => {
                    if(err) {
                        console.log(err);
                    }
                    this.setMode(result.ss.gms[0].$);
                    this.sendSocketNotification("SCORES", {scores: result.ss.gms[0].g, details: result.ss.gms[0].$});
                });
            } else {
            console.log("Error getting nfl scores " + response.statusCode);
            }
        });
    },

    setMode: function(details){
	console.log(details);
        var current_date = new Date();
        if(this.mode === "regular" && details.w >= 17 && (current_date.getMonth() < 1 || current_date.getMonth() > 10)){
            this.mode = "post";
            this.getData();
        } else if(this.mode === "post" && current_date.getMonth() >= 5){
            this.mode = "regular";
            this.getData();
        }

    }
});