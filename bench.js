'use strict';

const Bench = require('bench');
const Metaphor = require('.');
const Wreck = require('wreck');


const parse = function (document) {

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


let document;

exports.compare = {
    metaphor: function (done) {

        Metaphor.parse(document, done);
    },
    custom: function (done) {

        parse(document);
        return done();
    }
};


Wreck.get('https://twitter.com/dalmaer/status/726624422237364226', {}, (ignoreErr1, res, payload) => {

    document = payload.toString();
    console.log(Metaphor.parse(document));
    parse(document, (ignoreErr2, tags) => {

        console.log(tags);
        Bench.runMain();
    });
});
