'use strict';

// Load modules

const Content = require('content');
const Wreck = require('wreck');
const Oembed = require('./oembed');
const Ogp = require('./ogp');
const Tags = require('./tags');
const Twitter = require('./twitter');


// Declare internals

const internals = {};


exports.describe = function (url, options, callback) {

    const req = Wreck.request('GET', url, { redirects: 1 }, (err, res) => {

        if (err ||
            res.statusCode !== 200 ||
            !res.headers['content-type']) {

            req.abort();
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

        // Use Open Graph as base

        const description = Ogp.describe(tags.og);

        // Parse Twitter Card

        const twitter = Twitter.describe(tags.twitter);

        // Obtain and parse OEmbed description

        Oembed.describe(oembedLink, options, (oembed) => {

            // Combine descriptions

            description.url = description.url || oembed.url || url;
            description.type = description.type || 'website';

            if (!description.site_name &&
                oembed.site_name) {

                description.site_name = oembed.site_name;
            }

            if (oembed.thumbnail) {
                description.thumbnail = oembed.thumbnail;
            }

            if (oembed.embed) {
                description.embed = oembed.embed;
            }

            return next(description);
        });
    });
};
