/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

Module.register("MMM-NFL", {

    mode: "Pre-Season",

    defaults: {
        colored: false,
        helmets: false,
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
            Log.info(payload.scores);
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

        var tvLabel = document.createElement("th");
        var tvIcon = document.createElement("i");
        tvIcon.classList.add("fa", "fa-television", "dimmed");
        tvLabel.appendChild(tvIcon);
        labelRow.appendChild(tvLabel);

        return labelRow;
    },

    createDataRow: function (data) {
        var row = document.createElement("tr");
        row.classList.add("row");

        var date = document.createElement("td");
        date.innerHTML = this.translate(data.d) + " " + data.t;
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

        var tv = document.createElement("td");
        tv.classList.add("dimmed");
        tv.innerHTML = data.n ? data.n : "X";
        row.appendChild(tv);

        return row;
    }
});