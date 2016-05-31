'use strict';

// Load modules

const Url = require('url');
const Content = require('content');
const Hoek = require('hoek');
const Wreck = require('wreck');
const Oembed = require('./oembed');
const Ogp = require('./ogp');
const Providers = require('../providers.json');
const Router = require('./router');
const Tags = require('./tags');
const Twitter = require('./twitter');
const Utils = require('./utils');


// Declare internals

const internals = {
    defaults: {
        // maxWidth: 100,
        // maxHeight: 100,
        providers: true,
        whitelist: null
    }
};


exports.Engine = class {
    constructor(options) {

        this.settings = Hoek.applyToDefaults(internals.defaults, options || {});
        if (this.settings.providers === true) {
            this.settings.providers = Providers;
        }

        if (this.settings.providers) {
            this.settings.router = Oembed.providers(this.settings.providers);
        }

        if (this.settings.whitelist) {
            this._whitelist = new Router();
            this.settings.whitelist.forEach((url) => this._whitelist.add(url, true));
        }
    }

    describe(url, callback) {

        if (!this._whitelist ||
            this._whitelist.lookup(url)) {

            return exports.describe(url, this.settings, callback);
        }

        return Hoek.nextTick(callback)({ type: 'website', url });
    }
};


exports.oembed = { providers: Oembed.providers };


exports.describe = function (url, options, callback) {

    const req = Wreck.request('GET', url, { redirects: 1 }, (err, res) => {

        if (err ||
            res.statusCode !== 200 ||
            !res.headers['content-type']) {

            req.abort();

            if (!err &&
                res.statusCode < 400 &&             // Paywall error
                options.router) {

                Oembed.describe(url, null, options, (oembed) => {

                    const description = { type: 'website', url };
                    internals.fill(description, oembed, ['site_name', 'thumbnail', 'embed'], 'oembed');
                    return callback(description);
                });

                return;
            }

            return callback({ type: 'website', url });
        }

        const type = Content.type(res.headers['content-type']);
        if (type.isBoom) {
            return callback({ type: 'website', url });
        }

        if (type.mime === 'text/html') {
            Wreck.read(res, {}, (err, payload) => {

                if (err) {
                    return callback({ type: 'website', url });
                }

                return exports.parse(payload.toString(), url, options, (description) => callback(description));
            });

            return;
        }

        req.abort();

        if (type.mime.match(/^image\/\w+$/)) {
            const description = {
                type: 'website',
                url,
                embed: {
                    type: 'photo',
                    url
                },
                sources: ['resource']
            };

            const contentLength = res.headers['content-length'];
            if (contentLength) {
                description.embed.size = parseInt(contentLength, 10);
            }

            return callback(description);
        }

        return callback({ type: 'website', url });
    });
};


exports.parse = function (document, url, options, next) {

    const base = Url.parse(url);
    Tags.parse(document, base, (tags, oembedLink) => {

        // Parse tags

        const description = Ogp.describe(tags.og);          // Use Open Graph as base
        const twitter = Twitter.describe(tags.twitter);

        // Obtain and parse OEmbed description

        Oembed.describe(url, oembedLink, options, (oembed) => {

            // Combine descriptions

            description.url = description.url || oembed.url || url;

            internals.fill(description, oembed, ['site_name'], 'oembed');
            internals.fill(description, twitter, ['description', 'title', 'image'], 'twitter');
            internals.fill(description, tags.meta, ['description', 'author', 'icon'], 'resource');

            Utils.copy(oembed, description, ['thumbnail', 'embed'], 'oembed');
            Utils.copy(twitter, description, ['app', 'player', 'twitter'], 'twitter');

            if (description.sources.length) {
                description.sources = Hoek.unique(description.sources);
            }
            else {
                delete description.sources;
            }

            return next(description);
        });
    });
};


internals.fill = function (description, from, fields, source) {

    let used = false;
    fields.forEach((field) => {

        if (!description[field] &&
            from[field]) {

            description[field] = from[field];
            used = true;
        }
    });

    if (used) {
        description.sources = description.sources || [];
        description.sources.push(source);
    }
};
