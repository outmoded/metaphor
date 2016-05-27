'use strict';

// Load modules

const Url = require('url');
const Joi = require('joi');
const Wreck = require('wreck');


// Declare internals

const internals = {};


internals.oembedSchema = Joi.object({
    type: Joi.valid('photo', 'video', 'link', 'rich').required(),
    title: Joi.string(),
    site_name: Joi.string(),

    html: Joi.string().when('type', { is: ['rich', 'video'], then: Joi.required() }),
    url: Joi.string().uri({ scheme: ['http', 'https'] }).when('type', { is: 'photo', then: Joi.required() }),
    width: Joi.number().min(1).when('type', { is: Joi.not('link'), then: Joi.required() }),
    height: Joi.number().min(1).allow(null).when('type', { is: Joi.not('link'), then: Joi.required() }),

    thumbnail_url: Joi.string().uri({ scheme: ['http', 'https'] }),
    thumbnail_width: Joi.number().min(1),
    thumbnail_height: Joi.number().min(1),

    version: Joi.string().valid('1.0').required(),
    author_name: Joi.string(),
    author_url: Joi.string(),
    provider_url: Joi.string(),
    cache_age: Joi.number()
})
    .rename('provider_name', 'site_name')
    .unknown();


exports.describe = function (url, options, next) {

    /*
        https://publish.twitter.com/oembed?url=https://twitter.com/sideway/status/626158822705401856

        {
            "author_name": "Sideway",
            "author_url": "https://twitter.com/sideway",
            "cache_age": "3153600000",
            "height": null,
            "html": "<blockquote class=\"twitter-tweet\"><p lang=\"en\" dir=\"ltr\">First steps <a href=\"https://t.co/XvSn7XSI2G\">https://t.co/XvSn7XSI2G</a></p>&mdash; Sideway (@sideway) <a href=\"https://twitter.com/sideway/status/626158822705401856\">July 28, 2015</a></blockquote>\n<script async src=\"//platform.twitter.com/widgets.js\" charset=\"utf-8\"></script>",
            "provider_name": "Twitter",
            "provider_url": "https://twitter.com",
            "type": "rich",
            "url": "https://twitter.com/sideway/status/626158822705401856",
            "version": "1.0",
            "width": 550
        }
     */

    if (!url) {
        return next({});
    }

    const uri = Url.parse(url, true);
    delete uri.href;
    delete uri.path;
    delete uri.search;
    uri.query.format = 'json';
    if (options.maxHeight) {
        uri.query.maxheight = options.maxHeight;
    }

    if (options.maxWidth) {
        uri.query.maxwidth = options.maxWidth;
    }

    url = Url.format(uri);
    Wreck.get(url, { redirects: 1 }, (err, res, payload) => {

        if (err ||
            res.statusCode !== 200) {

            return next({});
        }

        const raw = internals.parse(payload);
        if (!raw) {
            return next({});
        }

        internals.oembedSchema.validate(raw, (err, oembed) => {

            if (err) {
                return next({});
            }

            const thumbnail = (!oembed.thumbnail_url ? null : {
                url: oembed.thumbnail_url,
                width: oembed.thumbnail_width,
                height: oembed.thumbnail_height
            });

            const description = {
                site_name: oembed.site_name,
                thumbnail
            };

            if (oembed.type === 'link') {
                description.url = oembed.url;
            }
            else {
                description.embed = internals.copy(oembed, ['type', 'height', 'width', 'url', 'html']);
            }

            return next(description);
        });
    });
};


internals.parse = function (payload) {

    try {
        return JSON.parse(payload.toString());
    }
    catch (err) {
        return null;
    }
};


internals.copy = function (from, keys) {

    const result = {};
    keys.forEach((key) => {

        if (from[key]) {
            result[key] = from[key];
        }
    });

    return result;
};
