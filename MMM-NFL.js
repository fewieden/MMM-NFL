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
        season: new Date().getFullYear(),
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

    getTemplate() {
        return `templates/${this.name}.njk`;
    },

    findTeamInScores(team) {
        return this.scores.find(m => team === m.homeTeam || team === m.awayTeam);
    },

    getFocusedTeamsWithByeWeeks() {
        if (!Array.isArray(this.config.focus_on) || !Array.isArray(this.scores)) {
            return [];
        }

        return this.config.focus_on.filter(team => !this.findTeamInScores(team));
    },

    getTemplateData() {
        return {
            states: this.states,
            modes: this.mode,
            details: this.details,
            config: this.config,
            scores: this.scores,
            focusedTeamsWithByeWeeks: this.getFocusedTeamsWithByeWeeks()
        };
    },

    getVoiceData() {
        return {
            mode: 'FOOTBALL',
            sentences: [
                'OPEN HELP',
                'CLOSE HELP',
                'SHOW PASSING YARDS STATISTIC',
                'SHOW RUSHING YARDS STATISTIC',
                'SHOW RECEIVING YARDS STATISTIC',
                'SHOW TACKLES STATISTIC',
                'SHOW SACKS STATISTIC',
                'SHOW KICKOFF YARDS STATISTIC',
                'SHOW INTERCEPTIONS STATISTIC',
                'SHOW PASSING TOUCHDOWNS STATISTIC',
                'SHOW QUARTERBACK RATING STATISTIC',
                'SHOW RUSHING TOUCHDOWNS STATISTIC',
                'SHOW RECEPTIONS STATISTIC',
                'SHOW RECEIVING TOUCHDOWNS STATISTIC',
                'SHOW TOTAL POINTS STATISTIC',
                'SHOW TOTAL TOUCHDOWNS STATISTIC',
                'SHOW PUNT YARDS STATISTIC',
                'SHOW PASSES DEFENDED STATISTIC',
                'HIDE STATISTIC'
            ]
        };
    },

    start() {
        Log.info(`Starting module: ${this.name}`);
        this.addGlobals();
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

    notificationReceived(notification, payload, sender) {
        if (notification === 'ALL_MODULES_STARTED') {
            this.sendNotification('REGISTER_VOICE_MODULE', this.getVoiceData());
        } else if (notification === 'VOICE_FOOTBALL' && sender.name === 'MMM-voice') {
            this.sendSocketNotification('VOICE_COMMAND', payload);
        } else if (notification === 'VOICE_MODE_CHANGED' && sender.name === 'MMM-voice' && payload.old === this.getVoiceData().mode) {
            this.sendNotification('CLOSE_MODAL');
        }
    },

    openStatisticsModal({ type, statistics }) {
        this.sendNotification('OPEN_MODAL', {
            template: 'templates/StatisticsModal.njk',
            data: {
                type,
                statistics,
                config: this.config,
                fns: { translate: this.translate.bind(this) }
            }
        });
    },

    openHelpModal() {
        this.sendNotification('OPEN_MODAL', {
            template: 'templates/HelpModal.njk',
            data: {
                ...this.getVoiceData(),
                fns: { translate: this.translate.bind(this) }
            }
        });
    },

    socketNotificationReceived(notification, payload) {
        if (notification === 'SCORES') {
            this.scores = payload.scores;
            this.details = payload.details;
            this.updateDom(300);
        } else if (notification === 'STATISTICS') {
            this.openStatisticsModal(payload);
        } else if (notification === 'OPEN_HELP_MODAL') {
            this.openHelpModal();
        } else if (notification === 'CLOSE_MODAL') {
            this.sendNotification('CLOSE_MODAL');
        }
    },

    addGlobals() {
        this.nunjucksEnvironment().addGlobal('includes', (array, item) => array.includes(item));
    },

    addFilters() {
        this.nunjucksEnvironment().addFilter('formatDate', timestamp => moment(timestamp).format(this.config.format));

        this.nunjucksEnvironment().addFilter('iconUrl', teamName => this.file(`icons/${teamName}${this.config.helmets ? '_helmet' : ''}.png`));
    }
});
