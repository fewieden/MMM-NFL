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
        moment.locale(config.locale);
    },

    socketNotificationReceived(notification, payload) {
        if (notification === 'SCORES') {
            this.scores = payload.scores;
            this.details = payload.details;
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

    addFilters() {
        this.nunjucksEnvironment().addFilter('formatDate', timestamp => {
            return moment(timestamp).format(this.config.format);
        });

        this.nunjucksEnvironment().addFilter('iconUrl', teamName => {
            return this.file(`icons/${teamName}${this.config.helmets ? '_helmet' : ''}.png`);
        });
    }
});
