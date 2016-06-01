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
        maxSize: 1024 * 1024,                   // 1 Mb
        providers: true,
        whitelist: null,
        preview: true
    }
};


exports.oembed = { providers: Oembed.providers };


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

        if (this.settings.preview === true) {
            this.settings.preview = internals.preview;
        }
    }

    describe(url, callback) {

        if (!this._whitelist ||
            this._whitelist.lookup(url)) {

            return this._describe(url, callback);
        }

        return this._preview({ type: 'website', url }, Hoek.nextTick(callback));
    }

    _describe(url, callback) {

        const req = Wreck.request('GET', url, { redirects: 1 }, (err, res) => {

            if (err ||
                res.statusCode !== 200 ||
                !res.headers['content-type']) {

                req.abort();

                if (!err &&
                    res.statusCode < 400 &&             // Paywall error
                    this.settings.router) {

                    Oembed.describe(url, null, this.settings, (oembed) => {

                        const description = { type: 'website', url };
                        internals.fill(description, oembed, ['site_name', 'thumbnail', 'embed'], 'oembed');
                        return this._preview(description, callback);
                    });

                    return;
                }

                return this._preview({ type: 'website', url }, callback);
            }

            const type = Content.type(res.headers['content-type']);
            if (type.isBoom) {
                return this._preview({ type: 'website', url }, callback);
            }

            if (type.mime === 'text/html') {
                Wreck.read(res, {}, (err, payload) => {

                    if (err) {
                        return this._preview({ type: 'website', url }, callback);
                    }

                    return exports.parse(payload.toString(), url, this.settings, (description) => this._preview(description, callback));
                });

                return;
            }

            req.abort();

            if (type.mime.match(/^image\/\w+$/)) {
                const description = {
                    type: 'website',
                    url,
                    site_name: 'Image',
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

                return this._preview(description, callback);
            }

            return this._preview({ type: 'website', url }, callback);
        });
    }

    _preview(description, callback) {

        if (!this.settings.preview) {
            return callback(description);
        }

        this.settings.preview(description, this.settings, (preview) => {

            if (preview) {
                description.preview = preview;
            }

            return callback(description);
        });
    }
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


internals.preview = function (description, options, callback) {

    const icon = (description.icon ? description.icon.smallest : '');
    const image = internals.image(description, options);

    const html = `
        <html>
            <head>
                ${description.title ? '<title>' + description.title + '</title>' : ''}
            </head>
            <body>
                <div class='metaphor-embed'>
                    <div class='metaphor-embed-header'>
                        ${icon ? '<img class="metaphor-embed-header-icon" src="' + icon + '"/>' : ''}
                        ${description.site_name ? '<div class="metaphor-embed-header-site">' + description.site_name + '</div>' : ''}
                        <a class ="metaphor-embed-header-link" href="${description.url}">
                            <div class="metaphor-embed-header-title">${description.title || description.url}</div>
                        </a>
                    </div>
                    <div class='metaphor-embed-body'>
                        ${description.description ? '<div class="metaphor-embed-body-description">' + description.description + '</div>' : ''}
                        ${image ? '<img class="metaphor-embed-body-image" src="' + image + '"/>' : ''}
                    </div>
                </div>
            </body>
        </html>`;

    return callback(html.replace(/\n\s+/g, ''));
};


internals.image = function (description, options) {

    let images = [description.thumbnail];

    if (description.embed &&
        description.embed.type === 'photo') {

        images.push(description.embed);
    }

    if (description.image) {
        images = images.concat(description.image);
    }

    for (let i = 0; i < images.length; ++i) {
        const image = images[i];
        if (image &&
            (!image.size || !options.maxSize || image.size <= options.maxSize)) {

            return image.url;
        }
    }

    return '';
};
