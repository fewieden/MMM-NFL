/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

Module.register("MMM-NFL", {

    mode: "Pre-Season",

    details: {
        y: (new Date()).getFullYear()
    },

    states: {
        "1": "1ST QUARTER",
        "2": "2ND QUARTER",
        "3": "3RD QUARTER",
        "4": "4th QUARTER",
        "H": "HALFTIME",
        "OT": "OVERTIME",
        "F": "FINAL",
        "FO": "FINAL OVERTIME",
        "T": "TIE",
        "P": "UPCOMING"
    },

    defaults: {
        colored: false,
        helmets: false,
        network: true,
        reloadInterval: 30 * 60 * 1000       // every 30 minutes
    },

    getTranslations: function () {
        return {
            en: "translations/en.json",
            de: "translations/de.json"
        };
    },

    getStyles: function () {
        return ["font-awesome.css", "MMM-NFL.css"];
    },

    start: function () {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification("CONFIG", this.config);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "SCORES") {
            this.scores = payload.scores;
            this.details = payload.details;
            this.updateDom(1000);
        }
    },

    getDom: function () {

        var wrapper = document.createElement("div");
        var header = document.createElement("header");
        header.innerHTML = "NFL " + this.mode + " " + this.details.y;
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
                table.appendChild(this.createDataRow(this.scores[i].$));
            }

            wrapper.appendChild(table);
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

    createDataRow: function (data) {
        var row = document.createElement("tr");
        row.classList.add("row");

        var date = document.createElement("td");
        if(data.q in ["1", "2", "3", "4", "H", "OT"]){
            var quarter = document.createElement("div");
            quarter.innerHTML = this.translate(this.states[data.q]);
            if(data.hasOwnProperty("k")){
                quarter.classList.add("live-style");
                date.appendChild(quarter);
                var time = document.createElement("div");
                time.classList.add("live-style");
                time.innerHTML = data.k;
                date.appendChild(time);
            } else {
                date.appendChild(quarter);
            }
        } else if(data.q === "P"){
            date.innerHTML = this.translate(data.d) + " " + data.t;
        } else {
            date.innerHTML = this.translate(this.states.F);
            date.classList.add("dimmed");
        }
        row.appendChild(date);

        var homeTeam = document.createElement("td");
        homeTeam.innerHTML = data.h;
        row.appendChild(homeTeam);

        var homeLogo = document.createElement("td");
        var homeIcon = document.createElement("img");
        homeIcon.src = this.file("icons/" + data.h + (this.config.helmets ? "_helmet" : "") + ".png");
        if(!this.config.colored){
            homeIcon.classList.add("icon");
        }
        homeLogo.appendChild(homeIcon);
        row.appendChild(homeLogo);

        var homeScore = document.createElement("td");
        if(data.q in ["1", "2", "3", "4", "H", "OT"]){
            homeScore.classList.add("live");
        }
        homeScore.innerHTML = data.hs;
        row.appendChild(homeScore);

        var vs = document.createElement("td");
        vs.innerHTML = ":";
        row.appendChild(vs);

        var awayScore = document.createElement("td");
        if(data.q in ["1", "2", "3", "4", "H", "OT"]){
            awayScore.classList.add("live");
        }
        awayScore.innerHTML = data.vs;
        row.appendChild(awayScore);

        var awayLogo = document.createElement("td");
        var awayIcon = document.createElement("img");
        awayIcon.src = this.file("icons/" + data.v + (this.config.helmets ? "_helmet" : "") + ".png");
        if(!this.config.colored){
            awayIcon.classList.add("icon");
        }
        if(this.config.helmets){
            awayIcon.classList.add("away");
        }
        awayLogo.appendChild(awayIcon);
        row.appendChild(awayLogo);

        var awayTeam = document.createElement("td");
        awayTeam.innerHTML = data.v;
        row.appendChild(awayTeam);

        if(this.config.network){
            var tv = document.createElement("td");
            tv.classList.add("dimmed");
            tv.innerHTML = data.hasOwnProperty("n") ? data.n : "X";
            row.appendChild(tv);
        }

        return row;
    }
});