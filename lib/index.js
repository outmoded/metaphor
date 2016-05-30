'use strict';

// Load modules

const Content = require('content');
const Hoek = require('hoek');
const Wreck = require('wreck');
const Oembed = require('./oembed');
const Ogp = require('./ogp');
const Providers = require('../providers.json');
const Tags = require('./tags');
const Twitter = require('./twitter');
const Utils = require('./utils');


// Declare internals

const internals = {
    defaults: {
        // maxWidth: 100,
        // maxHeight: 100,
        providers: true
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
    }

    describe(url, callback) {

        return exports.describe(url, this.settings, callback);
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
                    internals.fill(description, oembed, ['site_name', 'thumbnail', 'embed']);
                    return callback(null, description);
                });

                return;
            }

            return callback(new Error('Failed obtaining document'), { type: 'website', url });
        }

        const type = Content.type(res.headers['content-type']);
        if (type.isBoom) {
            return callback(new Error('Failed obtaining document'), { type: 'website', url });
        }

        if (type.mime === 'text/html') {
            Wreck.read(res, {}, (err, payload) => {

                if (err) {
                    return callback(new Error('Failed obtaining document'), { type: 'website', url });
                }

                return exports.parse(payload.toString(), url, options, (description) => callback(null, description));
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
                }
            };

            const contentLength = res.headers['content-length'];
            if (contentLength) {
                description.embed.size = parseInt(contentLength, 10);
            }

            return callback(null, description);
        }

        return callback(null, { type: 'website', url });
    });
};


exports.parse = function (document, url, options, next) {

    Tags.parse(document, (tags, oembedLink) => {

        // Parse tags

        const description = Ogp.describe(tags.og);          // Use Open Graph as base
        const twitter = Twitter.describe(tags.twitter);

        // Obtain and parse OEmbed description

        Oembed.describe(url, oembedLink, options, (oembed) => {

            // Combine descriptions

            description.url = description.url || oembed.url || url;
            description.type = description.type || 'website';

            internals.fill(description, oembed, ['site_name']);
            internals.fill(description, twitter, ['description', 'title', 'image']);
            internals.fill(description, tags.meta, ['description', 'author']);

            Utils.copy(oembed, description, ['thumbnail', 'embed']);
            Utils.copy(twitter, description, ['app', 'player', 'twitter']);

            return next(description);
        });
    });
};


internals.fill = function (description, from, fields) {

    fields.forEach((field) => {

        if (!description[field] &&
            from[field]) {

            description[field] = from[field];
        }
    });
};
