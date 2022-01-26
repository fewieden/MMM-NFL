/* global Module Log moment config */

/* Magic Mirror
 * Module: MMM-NFL
 *
 * By fewieden https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

Module.register('MMM-NFL', {
    modes: {
        PRE: 'Preseason',
        REG: 'Regular-Season',
        POST: 'Post-Season',
        OFF: 'Offseason',
    },

    details: {
        season: (new Date()).getFullYear(),
        stage: 'REG'
    },

    states: {
        1: '1ST_QUARTER',
        2: '2ND_QUARTER',
        3: '3RD_QUARTER',
        4: '4TH_QUARTER',
        halftime: 'HALF_TIME',
        overtime: 'OVER_TIME',
        final: 'FINAL',
        'final-overtime': 'FINAL_OVERTIME',
        pregame: 'UPCOMING'
    },

    defaults: {
        colored: false,
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

    suspend() {
        this.sendSocketNotification('SUSPEND', this.config);
    },

    resume() {
        this.sendSocketNotification('CONFIG', this.config);
    },

    socketNotificationReceived(notification, payload) {
        if (notification === 'SCORES') {
            this.scores = payload.scores;
            this.details = payload.details;
            this.updateDom(300);
        } else if (notification === 'STATISTICS') {
            this.sendNotification('OPEN_MODAL', {
                template: 'templates/Statistics.njk',
                data: {
                    config: this.config,
                    type: payload.type,
                    statistics: payload.statistics,
                    fns: {
                        translate: this.translate.bind(this)
                    }
                }
            });
        }
    },

    getTemplate() {
        return `templates/${this.name}.njk`;
    },

    getTemplateData() {
        let focusedTeamsWithByeWeeks = [];
        if (Array.isArray(this.config.focus_on) && this.scores) {
            for (const team of this.config.focus_on) {
                let match = this.scores.find(m => team === m.homeTeam || team === m.awayTeam);
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
