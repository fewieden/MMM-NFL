/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

Module.register("MMM-NFL", {

    modes: {
        "P": "Pre-Season",
        "R": "Regular-Season",
        "POST": "Post-Season"
    },

    details: {
        y: (new Date()).getFullYear(),
        t: "P"
    },

    states: {
        "1": "1ST_QUARTER",
        "2": "2ND_QUARTER",
        "3": "3RD_QUARTER",
        "4": "4th_QUARTER",
        "H": "HALF_TIME",
        "OT": "OVER_TIME",
        "F": "FINAL",
        "FO": "FINAL_OVERTIME",
        "T": "TIE",
        "P": "UPCOMING"
    },

    defaults: {
        colored: false,
        helmets: false,
        network: true,
        focus_on: false,
        format: "ddd h:mm",
        reloadInterval: 30 * 60 * 1000       // every 30 minutes
    },

    statistics: false,

    getTranslations: function () {
        return {
            en: "translations/en.json",
            de: "translations/de.json"
        };
    },

    getScripts: function() {
        return ["moment.js"];
    },

    getStyles: function () {
        return ["font-awesome.css", "MMM-NFL.css"];
    },

    start: function () {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification("CONFIG", this.config);
        moment.locale(config.language);
    },

    notificationReceived: function (notification, payload, sender) {
        if(notification === "ALL_MODULES_STARTED"){
            this.sendNotification("REGISTER_VOICE_MODULE", {
                mode: "FOOTBALL",
                sentences: [
                    "SHOW HELMETS",
                    "SHOW LOGOS",
                    "COLOR ON",
                    "COLOR OFF",
                    "NETWORK ON",
                    "NETWORK OFF",
                    "SHOW PASSING YARDS STATISTIC",
                    "SHOW RUSHING YARDS STATISTIC",
                    "SHOW RECEIVING YARDS STATISTIC",
                    "SHOW TACKLES STATISTIC",
                    "SHOW SACKS STATISTIC",
                    "SHOW INTERCEPTIONS STATISTIC",
                    "HIDE STATISTIC"
                ]
            });
        } else if(notification === "VOICE_FOOTBALL" && sender.name === "MMM-voice"){
            this.checkCommands(payload);
        }
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "SCORES") {
            this.scores = payload.scores;
            this.details = payload.details;
            this.updateDom(300);
        } else if(notification === "STATISTICS"){
            this.statistics = payload;
            this.updateDom(300);
        }
    },

    checkCommands: function(data){
        if(/(HELMETS)/g.test(data)){
            this.config.helmets = true;
        } else if(/(LOGOS)/g.test(data)){
            this.config.helmets = false;
        } else if(/(COLOR)/g.test(data)){
            if(/(ON)/g.test(data) || !this.config.colored && !/(OFF)/g.test(data)){
                this.config.colored = true;
            } else if(/(OFF)/g.test(data) || this.config.colored && !/(ON)/g.test(data)){
                this.config.colored = false;
            }
        } else if(/(NETWORK)/g.test(data)){
            if(/(ON)/g.test(data) || !this.config.network && !/(OFF)/g.test(data)){
                this.config.network = true;
            } else if(/(OFF)/g.test(data) || this.config.network && !/(ON)/g.test(data)){
                this.config.network = false;
            }
        } else if(/(STATISTIC)/g.test(data)){
            if(/(PASSING)/g.test(data)){
                this.sendSocketNotification("GET_STATISTICS", "Passing Yards");
            } else if(/(RUSHING)/g.test(data)){
                this.sendSocketNotification("GET_STATISTICS", "Rushing Yards");
            } else if(/(RECEIVING)/g.test(data)){
                this.sendSocketNotification("GET_STATISTICS", "Receiving Yards");
            } else if(/(TACKLES)/g.test(data)){
                this.sendSocketNotification("GET_STATISTICS", "Tackles");
            } else if(/(SACKS)/g.test(data)){
                this.sendSocketNotification("GET_STATISTICS", "Sacks");
            } else if(/(INTERCEPTIONS)/g.test(data)){
                this.sendSocketNotification("GET_STATISTICS", "Interceptions");
            } else if(/(HIDE)/g.test(data)){
                this.statistics = false;
            }
        }
        this.updateDom(300);
    },

    getDom: function () {

        var wrapper = document.createElement("div");
        var header = document.createElement("header");
        header.innerHTML = "NFL " + this.modes[this.details.t] + " " + this.details.y;
        wrapper.appendChild(header);

        if (!this.scores) {
            var text = document.createElement("div");
            text.innerHTML = this.translate("LOADING");
            text.classList.add("dimmed", "light");
            wrapper.appendChild(text);
        } else {
            var table = document.createElement("table");
            table.classList.add("small", "table");

            table.appendChild(this.createLabelRow());

            for (var i = 0; i < this.scores.length; i++) {
                this.appendDataRow(this.scores[i].$, table);
            }

            wrapper.appendChild(table);

            if(this.statistics){
                document.querySelector("body").classList.add("MMM-NFL-blur");
                var statistic = document.createElement("div");
                statistic.classList.add("statistic");
                this.appendStatistics(statistic);
                wrapper.appendChild(statistic);
            } else {
                document.querySelector("body").classList.remove("MMM-NFL-blur");
            }
        }

        return wrapper;
    },

    createLabelRow: function () {
        var labelRow = document.createElement("tr");

        var dateLabel = document.createElement("th");
        var dateIcon = document.createElement("i");
        dateIcon.classList.add("fa", "fa-calendar");
        dateLabel.appendChild(dateIcon);
        labelRow.appendChild(dateLabel);

        var homeLabel = document.createElement("th");
        homeLabel.innerHTML = this.translate("HOME");
        homeLabel.setAttribute("colspan", 3);
        labelRow.appendChild(homeLabel);

        var vsLabel = document.createElement("th");
        vsLabel.innerHTML = "";
        labelRow.appendChild(vsLabel);

        var awayLabel = document.createElement("th");
        awayLabel.innerHTML = this.translate("AWAY");
        awayLabel.setAttribute("colspan", 3);
        labelRow.appendChild(awayLabel);

        if(this.config.network){
            var tvLabel = document.createElement("th");
            var tvIcon = document.createElement("i");
            tvIcon.classList.add("fa", "fa-television", "dimmed");
            tvLabel.appendChild(tvIcon);
            labelRow.appendChild(tvLabel);
        }

        return labelRow;
    },

    appendDataRow: function (data, appendTo) {
        if(!this.config.focus_on || this.config.focus_on.indexOf(data.h) !== -1 || this.config.focus_on.indexOf(data.v) !== -1) {
            var row = document.createElement("tr");
            row.classList.add("row");

            var date = document.createElement("td");
            if (data.q in ["1", "2", "3", "4", "H", "OT"]) {
                var quarter = document.createElement("div");
                quarter.innerHTML = this.translate(this.states[data.q]);
                if (data.hasOwnProperty("k")) {
                    quarter.classList.add("live");
                    date.appendChild(quarter);
                    var time = document.createElement("div");
                    time.classList.add("live");
                    time.innerHTML = data.k + ' ' + this.translate('TIME_LEFT');
                    date.appendChild(time);
                } else {
                    date.appendChild(quarter);
                }
            } else if (data.q === "P") {
                date.innerHTML = moment(data.starttime).format(this.config.format);
            } else {
                date.innerHTML = this.translate(this.states[data.q]);
                date.classList.add("dimmed");
            }
            row.appendChild(date);

            var homeTeam = document.createElement("td");
            homeTeam.classList.add("align-right");
            this.appendBallPossession(data, true, homeTeam);
            var homeTeamSpan = document.createElement("span");
            homeTeamSpan.innerHTML = data.h;
            homeTeam.appendChild(homeTeamSpan);
            row.appendChild(homeTeam);

            var homeLogo = document.createElement("td");
            var homeIcon = document.createElement("img");
            homeIcon.src = this.file("icons/" + data.h + (this.config.helmets ? "_helmet" : "") + ".png");
            if (!this.config.colored) {
                homeIcon.classList.add("icon");
            }
            homeLogo.appendChild(homeIcon);
            row.appendChild(homeLogo);

            var homeScore = document.createElement("td");
            homeScore.innerHTML = data.hs;
            row.appendChild(homeScore);

            var vs = document.createElement("td");
            vs.innerHTML = ":";
            row.appendChild(vs);

            var awayScore = document.createElement("td");
            awayScore.innerHTML = data.vs;
            row.appendChild(awayScore);

            var awayLogo = document.createElement("td");
            var awayIcon = document.createElement("img");
            awayIcon.src = this.file("icons/" + data.v + (this.config.helmets ? "_helmet" : "") + ".png");
            if (!this.config.colored) {
                awayIcon.classList.add("icon");
            }
            if (this.config.helmets) {
                awayIcon.classList.add("away");
            }
            awayLogo.appendChild(awayIcon);
            row.appendChild(awayLogo);

            var awayTeam = document.createElement("td");
            awayTeam.classList.add("align-left");
            var awayTeamSpan = document.createElement("span");
            awayTeamSpan.innerHTML = data.v;
            awayTeam.appendChild(awayTeamSpan);
            this.appendBallPossession(data, false, awayTeam);
            row.appendChild(awayTeam);

            if (this.config.network) {
                var tv = document.createElement("td");
                tv.classList.add("dimmed");
                tv.innerHTML = data.hasOwnProperty("n") ? data.n : "X";
                row.appendChild(tv);
            }

            appendTo.appendChild(row);
        }
    },

    appendBallPossession: function(data, homeTeam, appendTo){
        var team = homeTeam ? data.h : data.v;
        if(data.p === team){
            var ballIcon = document.createElement("img");
            ballIcon.src = this.file("icons/football.png");
            if(homeTeam){
                ballIcon.classList.add("ball-home");
            } else {
                ballIcon.classList.add("ball-away");
            }
            if(data.rz === "1"){
                ballIcon.classList.add("redzone");
            }
            appendTo.appendChild(ballIcon);
        }
    },

    appendStatistics: function(appendTo){
        var type = document.createElement("div");
        type.classList.add("large");
        type.innerHTML = this.statistics.type;
        appendTo.appendChild(type);

        var table = document.createElement("table");
        table.classList.add("medium", "table");

        var labelRow = document.createElement("tr");

        var posLabel = document.createElement("th");
        posLabel.innerHTML = "#";
        labelRow.appendChild(posLabel);

        var nameLabel = document.createElement("th");
        nameLabel.innerHTML = this.translate("NAME");
        nameLabel.classList.add("align-left");
        labelRow.appendChild(nameLabel);

        var teamLabel = document.createElement("th");
        teamLabel.innerHTML = this.translate("TEAM");
        labelRow.appendChild(teamLabel);

        var unitLabel = document.createElement("th");
        unitLabel.innerHTML = this.statistics.data.unit;
        labelRow.appendChild(unitLabel);

        table.appendChild(labelRow);

        for (var i = 0; i < this.statistics.data.players.length; i++) {
            var row = document.createElement("tr");
            row.classList.add("row");

            var position = document.createElement("td");
            position.innerHTML = this.statistics.data.players[i].position;
            row.appendChild(position);

            var player = document.createElement("td");
            player.innerHTML = this.statistics.data.players[i].player;
            row.appendChild(player);

            var team = document.createElement("td");
            team.innerHTML = this.statistics.data.players[i].team;
            row.appendChild(team);

            var value = document.createElement("td");
            value.innerHTML = this.statistics.data.players[i].value;
            row.appendChild(value);

            table.appendChild(row);
        }

        appendTo.appendChild(table);
    }
});