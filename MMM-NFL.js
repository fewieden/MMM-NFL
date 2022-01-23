/* global Module Log moment config */

/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

Module.register('MMM-NFL', {
    modes: {
        P: 'Preseason',
        R: 'Regular-Season',
        POST: 'Post-Season',
        PRO: 'Pro-Bowl',
        OFF: 'Offseason',
    },

    details: {
        y: (new Date()).getFullYear(),
        t: 'R'
    },

    states: {
        1: '1ST_QUARTER',
        2: '2ND_QUARTER',
        3: '3RD_QUARTER',
        4: '4TH_QUARTER',
        H: 'HALF_TIME',
        OT: 'OVER_TIME',
        F: 'FINAL',
        FO: 'FINAL_OVERTIME',
        T: 'TIE',
        P: 'UPCOMING'
    },

    defaults: {
        colored: false,
        helmets: false,
        focus_on: false,
        format: 'ddd h:mm',
        reloadInterval: 30 * 60 * 1000, // every 30 minutes
        reverseTeams: false,
        tableSize: 'small'
    },

    statistics: false,
    help: false,

    voice: {
        mode: 'FOOTBALL',
        sentences: [
            'OPEN HELP',
            'CLOSE HELP',
            'SHOW HELMETS',
            'SHOW LOGOS',
            'COLOR ON',
            'COLOR OFF',
            'SHOW PASSING YARDS STATISTIC',
            'SHOW RUSHING YARDS STATISTIC',
            'SHOW RECEIVING YARDS STATISTIC',
            'SHOW TACKLES STATISTIC',
            'SHOW SACKS STATISTIC',
            'SHOW INTERCEPTIONS STATISTIC',
            'HIDE STATISTIC'
        ]
    },

    getTranslations() {
        return {
            en: 'translations/en.json',
            de: 'translations/de.json'
        };
    },

    getScripts() {
        return ['moment.js'];
    },

    getStyles() {
        return ['font-awesome.css', 'MMM-NFL.css'];
    },

    start() {
        Log.info(`Starting module: ${this.name}`);
        this.addFilters();
        this.sendSocketNotification('CONFIG', this.config);
        moment.locale(config.language);
    },

    notificationReceived(notification, payload, sender) {
        if (notification === 'ALL_MODULES_STARTED') {
            this.sendNotification('REGISTER_VOICE_MODULE', this.voice);
        } else if (notification === 'VOICE_FOOTBALL' && sender.name === 'MMM-voice') {
            this.checkCommands(payload);
        } else if (notification === 'VOICE_MODE_CHANGED' && sender.name === 'MMM-voice' && payload.old === this.voice.mode) {
            this.help = false;
            this.statistics = false;
            this.updateDom(300);
        }
    },

    socketNotificationReceived(notification, payload) {
        if (notification === 'SCORES') {
            this.scores = payload.scores;
            this.details = payload.details;
            this.updateDom(300);
        } else if (notification === 'STATISTICS') {
            this.help = false;
            this.statistics = payload;
            this.updateDom(300);
        }
    },

    getTemplate() {
        return `templates/${this.name}.njk`;
    },

    getTemplateData() {
        let focusedTeamsWithByeWeeks = [];
        if (Array.isArray(this.config.focus_on) && this.scores) {
            for (const team of this.config.focus_on) {
                let match = this.scores.find(m => team === m.$.h || team === m.$.v);
                if (!match) {
                    focusedTeamsWithByeWeeks.push(team);
                }
            }
        }

        return {
            states: this.states,
            modes: this.mode,
            details: this.details,
            config: this.config,
            scores: this.scores,
            focusedTeamsWithByeWeeks,
            includes: (array, item) => array.includes(item)
        };
    },

    checkCommands(data) {
        if (/(HELP)/g.test(data)) {
            if (/(CLOSE)/g.test(data) || (this.help && !/(OPEN)/g.test(data))) {
                this.help = false;
            } else if (/(OPEN)/g.test(data) || (!this.help && !/(CLOSE)/g.test(data))) {
                this.statistics = false;
                this.help = true;
            }
        } else if (/(HELMETS)/g.test(data)) {
            this.config.helmets = true;
        } else if (/(LOGOS)/g.test(data)) {
            this.config.helmets = false;
        } else if (/(COLOR)/g.test(data)) {
            if (/(OFF)/g.test(data) || (this.config.colored && !/(ON)/g.test(data))) {
                this.config.colored = false;
            } else if (/(ON)/g.test(data) || (!this.config.colored && !/(OFF)/g.test(data))) {
                this.config.colored = true;
            }
        } else if (/(STATISTIC)/g.test(data)) {
            if (/(HIDE)/g.test(data)) {
                this.statistics = false;
            } else if (/(PASSING)/g.test(data)) {
                this.sendSocketNotification('GET_STATISTICS', 'Passing Yards');
            } else if (/(RUSHING)/g.test(data)) {
                this.sendSocketNotification('GET_STATISTICS', 'Rushing Yards');
            } else if (/(RECEIVING)/g.test(data)) {
                this.sendSocketNotification('GET_STATISTICS', 'Receiving Yards');
            } else if (/(TACKLES)/g.test(data)) {
                this.sendSocketNotification('GET_STATISTICS', 'Tackles');
            } else if (/(SACKS)/g.test(data)) {
                this.sendSocketNotification('GET_STATISTICS', 'Sacks');
            } else if (/(INTERCEPTIONS)/g.test(data)) {
                this.sendSocketNotification('GET_STATISTICS', 'Interceptions');
            }
        }
        this.updateDom(300);
    },

    addFilters() {
        this.nunjucksEnvironment().addFilter('formatDate', timestamp => {
            return moment(timestamp).format(this.config.format);
        });

        this.nunjucksEnvironment().addFilter('iconUrl', teamName => {
            return this.file(`icons/${teamName}${this.config.helmets ? '_helmet' : ''}.png`);
        });
    }
});
