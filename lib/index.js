'use strict';

// Load modules

const Url = require('url');
const Content = require('content');
const HtmlParser2 = require('htmlparser2');
const Joi = require('joi');
const Wreck = require('wreck');


// Declare internals

const internals = {
    subs: {
        image: 'url',
        audio: 'url',
        video: 'url',
        locale: 'primary'
    }
};


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
            return callback(null, { type: 'website', url, embed: { type: 'photo', url } });
        }

        return callback(null, { type: 'website', url });
    });
};


exports.parse = function (document, url, options, next) {

    internals.tags(document, (result) => {

        internals.oembed(result.embed, options, (oembed) => {

            const description = internals.process(result.tags);
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


internals.tags = function (document, next) {

    /*
        <html prefix="og: http://ogp.me/ns#">
            <head>
                <title>The Rock (1996)</title>
                <meta property="og:title" content="The Rock" />
                <meta property="og:type" content="video.movie" />
                <meta property="og:url" content="http://www.imdb.com/title/tt0117500/" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock.jpg" />
                ...
                <link rel="alternate" type="application/json+oembed" href="https://publish.twitter.com/oembed?url=https://twitter.com/dalmaer/status/726624422237364226" title="Dion Almaer on Twitter: &quot;Maybe agile doesn&#39;t scale and that&#39;s ok https://t.co/DwrWCnCU38&quot;">
            </head>
            ...
        </html>
     */

    const result = {
        tags: [],
        embed: null
    };

    const parser = new HtmlParser2.Parser({
        onopentag: function (name, attributes) {

            if (name === 'body') {
                parser.reset();
            }

            if (name === 'meta' &&
                attributes.property) {

                const parsed = attributes.property.match(/^og:([^:]*)(?:\:(.*))?$/);
                if (parsed) {
                    result.tags.push({ key: parsed[1], sub: parsed[2], value: attributes.content });
                }
            }

            if (name === 'link' &&
                (attributes.rel === 'alternate' || attributes.rel === 'alternative') &&
                attributes.type === 'application/json+oembed') {

                result.embed = attributes.href;
            }
        },
        onend: function () {

            return next(result);
        }
    }, { decodeEntities: true });

    parser.write(document);
    parser.end();
};


internals.process = function (tags) {

    const properties = {};
    let last = null;
    for (let i = 0; i < tags.length; ++i) {
        const tag = tags[i];
        const key = tag.key;
        const sub = tag.sub;
        let value = tag.value;

        const isObject = (internals.subs[key]);
        if (sub) {
            if (last === key &&
                isObject) {

                const prev = (Array.isArray(properties[key]) ? properties[key][properties[key].length - 1] : properties[key]);
                if (prev[sub]) {
                    prev[sub] = [].concat(prev[sub]);
                    prev[sub].push(value);
                }
                else {
                    prev[sub] = value;
                }
            }
        }
        else {
            if (isObject) {
                value = { [internals.subs[key]]: value };
            }

            if (properties[key]) {
                properties[key] = [].concat(properties[key]);
                properties[key].push(value);
            }
            else {
                properties[key] = value;
            }
        }

        last = key;
    }

    return properties;
};


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


internals.oembed = function (url, options, next) {

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
