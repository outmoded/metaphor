'use strict';

// Load modules

const Content = require('content');
const Hoek = require('hoek');
const Items = require('items');
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
        maxSize: false,
        providers: true,
        whitelist: null,
        preview: true,
        css: false
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

        let req = null;
        const jar = {};

        const setup = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'
            },
            redirects: 5,
            redirect303: true,
            redirected: (statusCode, location, redirectionReq) => {

                req = redirectionReq;
            },
            beforeRedirect: (method, code, location, resHeaders, redirectOptions, next) => {

                const formatCookies = () => {

                    let header = '';
                    Object.keys(jar).forEach((name) => {

                        header +=  `${header ? '; ' : ''}${name}=${jar[name]}`;
                    });

                    redirectOptions.headers = redirectOptions.headers || {};
                    redirectOptions.headers.cookie = header;
                    return next();
                };

                const cookies = resHeaders['set-cookie'];
                if (!cookies) {
                    return formatCookies();
                }

                cookies.forEach((cookie) => {

                    const parts = cookie.split(';', 1)[0].split('=', 2);
                    jar[parts[0]] = parts[1];
                    return formatCookies();
                });
            }
        };

        req = Wreck.request('GET', url, setup, (err, res) => {

            if (err ||
                res.statusCode !== 200 ||
                !res.headers['content-type']) {

                req.abort();

                if (this.settings.router) {
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

        internals.sizes(description, () => {

            this.settings.preview(description, this.settings, (preview) => {

                if (preview) {
                    description.preview = preview;
                }

                return callback(description);
            });
        });
    }
};


exports.parse = function (document, url, options, next) {

    Tags.parse(document, url, (tags, oembedLink) => {

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
                ${options.css ? '<link rel="stylesheet" href="' + options.css + '">' : ''}
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

    const images = internals.images(description);
    if (!images.length) {
        return '';
    }

    if (!options.maxSize) {
        return images[0].url;
    }

    for (let i = 0; i < images.length; ++i) {
        const image = images[i];
        if (image.size &&
            image.size <= options.maxSize) {

            return image.url;
        }
    }

    return '';
};


internals.images = function (description) {

    let images = [];

    if (description.thumbnail) {
        images.push(description.thumbnail);
    }

    if (description.embed &&
        description.embed.type === 'photo') {

        images.push(description.embed);
    }

    if (description.image) {
        images = images.concat(description.image);
    }

    return images;
};


internals.sizes = function (description, callback) {

    const each = (image, next) => {

        if (image.size) {
            return next();
        }

        Wreck.request('HEAD', image.url, {}, (err, res) => {

            if (err) {
                return next();
            }

            const contentLength = res.headers['content-length'];
            if (contentLength) {
                image.size = parseInt(contentLength, 10);
            }

            Wreck.read(res, null, next);        // Flush out any payload
        });
    };

    const images = internals.images(description);
    Items.parallel(images, each, callback);
};
