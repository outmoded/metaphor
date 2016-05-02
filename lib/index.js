'use strict';

// Load modules

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
            return callback(err);
        }

        if (res.statusCode !== 200) {
            return callback(new Error('Failed obtaining document'));
        }

        const tags = exports.parse(payload.toString());
        return callback(null, exports.process(tags));
    });
};


exports.parse = function (document) {

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

    // Grab the head

    const head = document.match(/<head[^>]*>([\s\S]*)<\/head\s*>/);
    if (!head) {
        return [];
    }

    // Remove scripts

    const scripts = head[1].split('</script>');         //     '<script>a</script>something<script>a</script>' -> ['<script>a', 'something<script>a', '']
    const chunks = [];
    scripts.forEach((chunk) => {

        const pos = chunk.indexOf('<script');
        if (pos !== -1) {
            chunk = chunk.slice(0, pos);
        }

        chunks.push(chunk);
    });

    // Find meta tags

    const elements = [];
    chunks.forEach((chunk) => {

        const parts = chunk.split('<meta ');
        for (let i = 1; i < parts.length; ++i) {
            elements.push(parts[i].slice(0, parts[i].indexOf('>')));
        }
    });

    const tags = [];
    for (let i = 0; i < elements.length; ++i) {
        const element = elements[i];
        const parsed = element.match(/\s*property\s*=\s*"og:([^":]*)(?:\:([^"]*))?"\s+content\s*=\s*"([^"]*)\s*"/);
        if (parsed) {
            tags.push({ key: parsed[1], sub: parsed[2], value: parsed[3] });
        }
    }

    return tags;
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
