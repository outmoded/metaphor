'use strict';

const Bench = require('bench');
const HtmlParser2 = require('htmlparser2');
const Metaphor = require('.');
const Wreck = require('wreck');


const parse = function (document, next) {

    const tags = [];
    const parser = new HtmlParser2.Parser({
        onopentag: function (name, attributes) {

            if (name === 'meta' &&
                attributes.property) {

                const parsed = attributes.property.match(/^og:([^:]*)(?:\:(.*))?$/);
                if (parsed) {
                    tags.push({ key: parsed[1], sub: parsed[2], value: attributes.content });
                }
            }
        },
        onclosetag: function (name) {

            if (name === 'head') {
                parser.reset();
            }
        },
        onend: function () {

            return next(null, tags);
        },
        onerror: function (err) {

            return next(err);
        }
    }, { decodeEntities: true });

    parser.write(document);
    parser.end();
};


let document;

exports.compare = {
    metaphor: function (done) {

        Metaphor.parse(document);
        return done();
    },
    htmlparser2: function (done) {

        parse(document, done);
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
