const jsdom = require("jsdom");

module.exports = {

    URL: "http://www.espn.com/nfl/statistics",
    CACHE_TIME: 2*60*1000, //2 minutes

    statistics: {
        timestamp: null,
        data: {}
    },

    getStats: function(type, callback){
        var time = Date.now();
        if(!this.statistics.timestamp || this.statistics.timestamp < time - this.CACHE_TIME || !this.statistics.data.hasOwnProperty(type)){
            jsdom.env({
                url: this.URL,
                done: (err, window) => {
                    if(err){
                        callback(err, null);
                    } else {
                        var statistics = {};
                        var statisticsWrapper = window.document.querySelector("#my-players-table");
                        if(statisticsWrapper){
                            var teams = [statisticsWrapper.children[0], statisticsWrapper.children[1]];
                            for(var i = 0; i < teams.length; i++){
                                var types = teams[i].children;
                                for(var n = 0; n < types.length; n++){
                                    var rows = types[n].querySelector("tbody").children;
                                    statistics[rows[0].children[0].innerText] = {unit: rows[0].children[1].innerText, players: []};
                                    var positionRegExp = /(.*?)\. .*,( [A-Z]+)?/ig;
                                    var playerRegExp = /[1-5]\. (.*?),( [A-Z]+)?/ig;
                                    var teamRegExp = /[1-5]\. .*,(.*?)$/ig;
                                    for(var x = 1; x < rows.length - 1; x++){
                                        statistics[rows[0].children[0].innerText].players.push({
                                            position: positionRegExp.exec(rows[x].children[rows[x].children.length - 2])[1],
                                            player: playerRegExp.exec(rows[x].children[rows[x].children.length - 2])[1],
                                            team: teamRegExp.exec(rows[x].children[rows[x].children.length - 2])[1].trim(),
                                            value: rows[x].children[rows[x].children.length - 1]
                                        });
                                    }
                                }
                            }

                            window.close();

                            this.statistics = {
                                timestamp: time,
                                data: statistics
                            };

                            if(this.statistics.data.hasOwnProperty(type)){
                                callback(null, {type: type, data: this.statistics.data[type]});
                            } else {
                                callback("Statistics for " + type + " not found!", null);
                            }
                        } else {
                            callback("Source changed site layout!", null);
                        }
                    }
                }
            });
        } else {
            callback(null, this.statistics.data[type]);
        }
    }
};