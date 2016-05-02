'use strict';

// Load modules

const HtmlParser2 = require('htmlparser2');
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


exports.describe = function (url, callback) {

    Wreck.get(url, {}, (err, res, payload) => {

        if (err) {
            return callback(err, { type: 'website', url });
        }

        if (res.statusCode !== 200) {
            return callback(new Error('Failed obtaining document'), { type: 'website', url });
        }

        return exports.parse(payload.toString(), (err, description) => {

            description.url = description.url || url;
            return callback(err, description);
        });
    });
};


exports.parse = function (document, next) {

    exports.tags(document, (errIgnore, tags) => {

        const description = exports.process(tags);
        if (!description.title ||
            !description.image ||
            !description.url) {

            return next(new Error('Description missing required property'), description);
        }

        return next(null, description);
    });
};


exports.tags = function (document, next) {

    /*
        <html prefix="og: http://ogp.me/ns#">
            <head>
                <title>The Rock (1996)</title>
                <meta property="og:title" content="The Rock" />
                <meta property="og:type" content="video.movie" />
                <meta property="og:url" content="http://www.imdb.com/title/tt0117500/" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock.jpg" />
                ...
            </head>
            ...
        </html>
     */

    const tags = [];
    const parser = new HtmlParser2.Parser({
        onopentag: function (name, attributes) {

            if (name === 'body') {
                parser.reset();
            }

            if (name === 'meta' &&
                attributes.property) {

                const parsed = attributes.property.match(/^og:([^:]*)(?:\:(.*))?$/);
                if (parsed) {
                    tags.push({ key: parsed[1], sub: parsed[2], value: attributes.content });
                }
            }
        },
        onend: function () {

            return next(null, tags);
        }
    }, { decodeEntities: true });

    parser.write(document);
    parser.end();
};


exports.process = function (tags) {

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

    properties.type = properties.type || 'website';
    return properties;
};
