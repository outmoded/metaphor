'use strict';

// Load modules

const Code = require('code');
const Lab = require('lab');
const Metaphor = require('..');
const Wreck = require('wreck');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('OEmbed', () => {

    describe('describe()', () => {

        it('ignores invalid oembed response (request error)', { parallel: false }, (done) => {

            const html = `<html>
            <head>
                <link rel="alternate" type="application/json+oembed" href="https://publish.twitter.com/oembed?url=https://twitter.com/dalmaer/status/726624422237364226" title="Dion Almaer on Twitter: &quot;Maybe agile doesn&#39;t scale and that&#39;s ok https://t.co/DwrWCnCU38&quot;">
            </head>
            </html>`;

            const orig = Wreck.get;
            Wreck.get = (url, options, next) => {

                Wreck.get = orig;
                next(null, { statusCode: 400 }, '');
            };

            Metaphor.parse(html, 'https://twitter.com/dalmaer/status/726624422237364226', {}, (description) => {

                expect(description).to.equal({
                    url: 'https://twitter.com/dalmaer/status/726624422237364226',
                    type: 'website'
                });

                done();
            });
        });

        it('ignores invalid oembed response (network error)', { parallel: false }, (done) => {

            const html = `<html>
            <head>
                <link rel="alternate" type="application/json+oembed" href="https://publish.twitter.com/oembed?url=https://twitter.com/dalmaer/status/726624422237364226" title="Dion Almaer on Twitter: &quot;Maybe agile doesn&#39;t scale and that&#39;s ok https://t.co/DwrWCnCU38&quot;">
            </head>
            </html>`;

            const orig = Wreck.get;
            Wreck.get = (url, options, next) => {

                Wreck.get = orig;
                next(new Error('Cannot reach host'));
            };

            Metaphor.parse(html, 'https://twitter.com/dalmaer/status/726624422237364226', {}, (description) => {

                expect(description).to.equal({
                    url: 'https://twitter.com/dalmaer/status/726624422237364226',
                    type: 'website'
                });

                done();
            });
        });

        it('ignores invalid oembed response (wrong version)', { parallel: false }, (done) => {

            const html = `<html>
            <head>
                <link rel="alternate" type="application/json+oembed" href="https://publish.twitter.com/oembed?url=https://twitter.com/dalmaer/status/726624422237364226" title="Dion Almaer on Twitter: &quot;Maybe agile doesn&#39;t scale and that&#39;s ok https://t.co/DwrWCnCU38&quot;">
            </head>
            </html>`;

            const oembed = {
                type: 'link',
                version: '2.0',
                url: 'https://twitter.com/dalmaer/status/726624422237364226',
                provider_name: 'Twitter'
            };

            const orig = Wreck.get;
            Wreck.get = (url, options, next) => {

                Wreck.get = orig;
                next(null, { statusCode: 200 }, JSON.stringify(oembed));
            };

            Metaphor.parse(html, 'https://twitter.com/dalmaer/status/726624422237364226', {}, (description) => {

                expect(description).to.equal({
                    url: 'https://twitter.com/dalmaer/status/726624422237364226',
                    type: 'website'
                });

                done();
            });
        });

        it('ignores invalid oembed response (invalid payload)', { parallel: false }, (done) => {

            const html = `<html>
            <head>
                <link rel="alternate" type="application/json+oembed" href="https://publish.twitter.com/oembed?url=https://twitter.com/dalmaer/status/726624422237364226" title="Dion Almaer on Twitter: &quot;Maybe agile doesn&#39;t scale and that&#39;s ok https://t.co/DwrWCnCU38&quot;">
            </head>
            </html>`;

            const orig = Wreck.get;
            Wreck.get = (url, options, next) => {

                Wreck.get = orig;
                next(null, { statusCode: 200 }, '{');
            };

            Metaphor.parse(html, 'https://twitter.com/dalmaer/status/726624422237364226', {}, (description) => {

                expect(description).to.equal({
                    url: 'https://twitter.com/dalmaer/status/726624422237364226',
                    type: 'website'
                });

                done();
            });
        });
    });
});
