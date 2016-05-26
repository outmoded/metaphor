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


describe('Metaphor', () => {

    describe('describe()', () => {

        it('describes a tweet', (done) => {

            Metaphor.describe('https://twitter.com/sideway/status/626158822705401856', {}, (err, description) => {

                expect(err).to.not.exist();
                expect(description).to.equal({
                    url: 'https://twitter.com/sideway/status/626158822705401856',
                    type: 'article',
                    title: 'Sideway on Twitter',
                    image: { url: 'https://pbs.twimg.com/profile_images/733727309962838016/t8DzeKUZ_400x400.jpg' },
                    description: '\u201cFirst steps https://t.co/XvSn7XSI2G\u201d',
                    site_name: 'Twitter',
                    embed: {
                        url: 'https://twitter.com/sideway/status/626158822705401856',
                        html: '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">First steps <a href="https://t.co/XvSn7XSI2G">https://t.co/XvSn7XSI2G</a></p>&mdash; Sideway (@sideway) <a href="https://twitter.com/sideway/status/626158822705401856">July 28, 2015</a></blockquote>\n<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>',
                        width: 550,
                        type: 'rich'
                    }
                });

                done();
            });
        });

        it('describes a flickr photo', (done) => {

            Metaphor.describe('https://www.flickr.com/photos/kent-macdonald/19455364653/', { maxWidth: 400, maxHeight: 200 }, (err, description) => {

                expect(err).to.not.exist();
                expect(description).to.equal({
                    site_name: 'Flickr - Photo Sharing!',
                    updated_time: description.updated_time,
                    title: '300/365 "The Lonely Gold Rush"',
                    description: '27.07.15  So this is it, day 300. The real count down begins now I guess.  Also found a pickaxe at my house moment before I even shot this. I seem to have strange and worrisome objects at my house. The first one I was looking for was a spear. And I\'m still in need of another deadly prop for this series. A lot has been said with very few words. Don\'t worry I\'m not a murderer. HOnestly I was searching for the spear first as I had a stronger concept, well it has a stronger meaning to it for me, bur alas I couldn\'t find it in time. I have seince then loaceted it after I\'ve shot this. But time was of the essence.   In other news I\'m planning a new photographic series and have been doing some research and sketching. On the downside I don\'t think I\'ll be shooting any of them until this project is over.',
                    type: 'flickr_photos:photo',
                    url: 'https://www.flickr.com/photos/kent-macdonald/19455364653/',
                    image: {
                        url: 'https://c1.staticflickr.com/1/259/19455364653_201bdfd31b_b.jpg',
                        width: '1024',
                        height: '576'
                    },
                    thumbnail: {
                        url: 'https://farm1.staticflickr.com/259/19455364653_201bdfd31b_q.jpg',
                        width: 150,
                        height: 150
                    },
                    embed: {
                        type: 'photo',
                        height: 180,
                        width: 320,
                        url: 'https://farm1.staticflickr.com/259/19455364653_201bdfd31b_n.jpg',
                        html: '<a data-flickr-embed="true" href="https://www.flickr.com/photos/kent-macdonald/19455364653/" title="300/365 &quot;The Lonely Gold Rush&quot; by achillesheels, on Flickr"><img src="https://farm1.staticflickr.com/259/19455364653_201bdfd31b_n.jpg" width="320" height="180" alt="300/365 &quot;The Lonely Gold Rush&quot;"></a><script async src="https://embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>'
                    }
                });

                done();
            });
        });

        it('describes an image', (done) => {

            Metaphor.describe('https://www.sideway.com/sideway.png', {}, (err, description) => {

                expect(err).to.not.exist();
                expect(description).to.equal({
                    url: 'https://www.sideway.com/sideway.png',
                    type: 'website',
                    embed: {
                        url: 'https://www.sideway.com/sideway.png',
                        type: 'photo'
                    }
                });

                done();
            });
        });

        it('describes a resource with redirection', (done) => {

            Metaphor.describe('https://twitter.com/x/status/626158822705401856', {}, (err, description) => {

                expect(err).to.not.exist();
                expect(description).to.equal({
                    title: 'Sideway on Twitter',
                    image: { url: 'https://pbs.twimg.com/profile_images/733727309962838016/t8DzeKUZ_400x400.jpg' },
                    description: '\u201cFirst steps https://t.co/XvSn7XSI2G\u201d',
                    site_name: 'Twitter',
                    url: 'https://twitter.com/sideway/status/626158822705401856',
                    type: 'article',
                    embed: {
                        url: 'https://twitter.com/sideway/status/626158822705401856',
                        html: '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">First steps <a href="https://t.co/XvSn7XSI2G">https://t.co/XvSn7XSI2G</a></p>&mdash; Sideway (@sideway) <a href="https://twitter.com/sideway/status/626158822705401856">July 28, 2015</a></blockquote>\n<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>',
                        width: 550,
                        type: 'rich'
                    }
                });

                done();
            });
        });

        it('handles missing document', (done) => {

            Metaphor.describe('https://twitter.com/sideway/status/1', {}, (err, description) => {

                expect(err).to.exist();
                expect(err.message).to.equal('Failed obtaining document');
                expect(description).to.equal({ type: 'website', url: 'https://twitter.com/sideway/status/1' });
                done();
            });
        });

        it('handles invalid domain', (done) => {

            Metaphor.describe('https://no_such_domain/1', {}, (err, description) => {

                expect(err).to.exist();
                expect(description).to.equal({ type: 'website', url: 'https://no_such_domain/1' });
                done();
            });
        });

        it('handles unknown content type', { parallel: false }, (done) => {

            const orig = Wreck.request;
            Wreck.request = (method, url, options, next) => {

                Wreck.request = orig;
                setImmediate(() => next(null, { statusCode: 200, headers: { 'content-type': 'x/y' } }));
                return { abort: () => { } };
            };

            Metaphor.describe('https://example.com/invalid', {}, (err, description) => {

                expect(err).to.not.exist();
                expect(description).to.equal({ type: 'website', url: 'https://example.com/invalid' });
                done();
            });
        });

        it('errors on missing content-type', { parallel: false }, (done) => {

            const orig = Wreck.request;
            Wreck.request = (method, url, options, next) => {

                Wreck.request = orig;
                setImmediate(() => next(null, { statusCode: 200, headers: {} }));
                return { abort: () => { } };
            };

            Metaphor.describe('https://example.com/invalid', {}, (err, description) => {

                expect(err).to.be.an.error('Failed obtaining document');
                expect(description).to.equal({ type: 'website', url: 'https://example.com/invalid' });
                done();
            });
        });

        it('errors on invalid content-type', { parallel: false }, (done) => {

            const orig = Wreck.request;
            Wreck.request = (method, url, options, next) => {

                Wreck.request = orig;
                setImmediate(() => next(null, { statusCode: 200, headers: { 'content-type': 'x' } }));
                return { abort: () => { } };
            };

            Metaphor.describe('https://example.com/invalid', {}, (err, description) => {

                expect(err).to.be.an.error('Failed obtaining document');
                expect(description).to.equal({ type: 'website', url: 'https://example.com/invalid' });
                done();
            });
        });

        it('errors on invalid response object', { parallel: false }, (done) => {

            const origRequest = Wreck.request;
            Wreck.request = (method, url, options, next) => {

                Wreck.request = origRequest;
                setImmediate(() => next(null, { statusCode: 200, headers: { 'content-type': 'text/html' } }));
                return { abort: () => { } };
            };

            const origRead = Wreck.read;
            Wreck.read = (res, options, next) => {

                Wreck.read = origRead;
                return next(new Error('Invalid'));
            };

            Metaphor.describe('https://example.com/invalid', {}, (err, description) => {

                expect(err).to.be.an.error('Failed obtaining document');
                expect(description).to.equal({ type: 'website', url: 'https://example.com/invalid' });
                done();
            });
        });
    });

    describe('parse()', () => {

        it('ignores tags in scripts and body', (done) => {

            const html = `<html prefix="og: http://ogp.me/ns#">
            <head>
                <title>The Rock (1996)</title>
                <meta property="og:title" content="The Rock" />
                <meta property="og:type" content="video.movie" />
                <script><meta property="og:image" content="ignore2" /></script>
                <meta property="og:url" content="http://www.imdb.com/title/tt0117500/" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock.jpg" />
            </head>
            <body>
                <meta property="og:image" content="ignore2" />
            </body>
            </html>`;

            Metaphor.parse(html, 'http://www.imdb.com/title/tt0117500/', {}, (description) => {

                expect(description).to.equal({
                    title: 'The Rock',
                    type: 'video.movie',
                    url: 'http://www.imdb.com/title/tt0117500/',
                    image: { url: 'http://ia.media-imdb.com/images/rock.jpg' }
                });

                done();
            });
        });

        it('uses oembed site_name if og is missing', (done) => {

            const html = `<html>
            <head>
                <link rel="alternate" type="application/json+oembed" href="https://publish.twitter.com/oembed?url=https://twitter.com/dalmaer/status/726624422237364226" title="Dion Almaer on Twitter: &quot;Maybe agile doesn&#39;t scale and that&#39;s ok https://t.co/DwrWCnCU38&quot;">
            </head>
            </html>`;

            Metaphor.parse(html, 'https://twitter.com/dalmaer/status/726624422237364226', {}, (description) => {

                expect(description).to.equal({
                    url: 'https://twitter.com/dalmaer/status/726624422237364226',
                    type: 'website',
                    site_name: 'Twitter',
                    embed: {
                        type: 'rich',
                        width: 550,
                        url: 'https://twitter.com/dalmaer/status/726624422237364226',
                        html: '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Maybe agile doesn&#39;t scale and that&#39;s ok <a href="https://t.co/DwrWCnCU38">https://t.co/DwrWCnCU38</a></p>&mdash; Dion Almaer (@dalmaer) <a href="https://twitter.com/dalmaer/status/726624422237364226">May 1, 2016</a></blockquote>\n<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>'
                    }
                });

                done();
            });
        });

        it('uses oembed link url if og is missing', { parallel: false }, (done) => {

            const html = `<html>
            <head>
                <link rel="alternate" type="application/json+oembed" href="https://publish.twitter.com/oembed?url=https://twitter.com/dalmaer/status/726624422237364226" title="Dion Almaer on Twitter: &quot;Maybe agile doesn&#39;t scale and that&#39;s ok https://t.co/DwrWCnCU38&quot;">
            </head>
            </html>`;

            const oembed = {
                type: 'link',
                version: '1.0',
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
                    type: 'website',
                    site_name: 'Twitter'
                });

                done();
            });
        });
    });

    describe('process()', () => {

        it('supports multiple images', (done) => {

            const html = `<html prefix="og: http://ogp.me/ns#">
            <head>
                <title>The Rock (1996)</title>
                <meta property="og:title" content="The Rock" />
                <meta property="og:type" content="video.movie" />
                <script><meta property="og:image" content="ignore2" /></script>
                <meta property="og:url" content="http://www.imdb.com/title/tt0117500/" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock1.jpg" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock2.jpg" />
            </head>
            <body>
                <meta property="og:image" content="ignore2" />
            </body>
            </html>`;

            Metaphor.parse(html, 'http://www.imdb.com/title/tt0117500/', {}, (description) => {

                expect(description).to.equal({
                    title: 'The Rock',
                    type: 'video.movie',
                    url: 'http://www.imdb.com/title/tt0117500/',
                    image: [
                        { url: 'http://ia.media-imdb.com/images/rock1.jpg' },
                        { url: 'http://ia.media-imdb.com/images/rock2.jpg' }
                    ]
                });

                done();
            });
        });

        it('supports multiple images with sub attributes', (done) => {

            const html = `<html prefix="og: http://ogp.me/ns#">
            <head>
                <title>The Rock (1996)</title>
                <meta property="og:title" content="The Rock" />
                <meta property="og:type" content="video.movie" />
                <script><meta property="og:image" content="ignore2" /></script>
                <meta property="og:url" content="http://www.imdb.com/title/tt0117500/" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock1.jpg" />
                <meta property="og:image:height" content="330" />
                <meta property="og:image:width" content="500" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock2.jpg" />
                <meta property="og:image:secure_url" content="https://ia.media-imdb.com/images/rock2.jpg" />
                <meta property="og:locale" content="en_GB" />
                <meta property="og:locale:alternate" content="fr_FR" />
                <meta property="og:locale:alternate" content="es_ES" />
            </head>
            <body>
                <meta property="og:image" content="ignore2" />
            </body>
            </html>`;

            Metaphor.parse(html, 'http://www.imdb.com/title/tt0117500/', {}, (description) => {

                expect(description).to.equal({
                    title: 'The Rock',
                    type: 'video.movie',
                    url: 'http://www.imdb.com/title/tt0117500/',
                    image: [
                        { url: 'http://ia.media-imdb.com/images/rock1.jpg', width: '500', height: '330' },
                        { url: 'http://ia.media-imdb.com/images/rock2.jpg', secure_url: 'https://ia.media-imdb.com/images/rock2.jpg' }
                    ],
                    locale: {
                        primary: 'en_GB',
                        alternate: ['fr_FR', 'es_ES']
                    }
                });

                done();
            });
        });

        it('sets default type', (done) => {

            const html = `<html>
            <head>
                <meta property="og:title" content="The Rock" />
                <meta property="og:url" content="http://www.imdb.com/title/tt0117500/" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock1.jpg" />
            </head>
            </html>`;

            Metaphor.parse(html, 'http://www.imdb.com/title/tt0117500/', {}, (description) => {

                expect(description).to.equal({
                    title: 'The Rock',
                    type: 'website',
                    url: 'http://www.imdb.com/title/tt0117500/',
                    image: { url: 'http://ia.media-imdb.com/images/rock1.jpg' }
                });

                done();
            });
        });

        it('ignore sub properties in the wrong place', (done) => {

            const html = `<html prefix="og: http://ogp.me/ns#">
            <head>
                <title>The Rock (1996)</title>
                <meta property="og:title" content="The Rock" />
                <meta property="og:type" content="video.movie" />
                <script><meta property="og:image" content="ignore2" /></script>
                <meta property="og:url" content="http://www.imdb.com/title/tt0117500/" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock1.jpg" />
                <meta property="og:video:height" content="330" />
                <meta property="og:image:width" content="500" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock2.jpg" />
            </head>
            <body>
                <meta property="og:image" content="ignore2" />
            </body>
            </html>`;

            Metaphor.parse(html, 'http://www.imdb.com/title/tt0117500/', {}, (description) => {

                expect(description).to.equal({
                    title: 'The Rock',
                    type: 'video.movie',
                    url: 'http://www.imdb.com/title/tt0117500/',
                    image: [
                        { url: 'http://ia.media-imdb.com/images/rock1.jpg' },
                        { url: 'http://ia.media-imdb.com/images/rock2.jpg' }
                    ]
                });

                done();
            });
        });

        it('handles missing image', (done) => {

            const html = `<html>
            <head>
                <meta property="og:title" content="The Rock" />
                <meta property="og:url" content="http://www.imdb.com/title/tt0117500/" />
            </head>
            </html>`;

            Metaphor.parse(html, 'http://www.imdb.com/title/tt0117500/', {}, (description) => {

                expect(description).to.equal({
                    title: 'The Rock',
                    type: 'website',
                    url: 'http://www.imdb.com/title/tt0117500/'
                });

                done();
            });
        });

        it('handles missing url', (done) => {

            const html = `<html>
            <head>
                <meta property="og:title" content="The Rock" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock1.jpg" />
            </head>
            </html>`;

            Metaphor.parse(html, 'http://www.imdb.com/title/tt0117500/', {}, (description) => {

                expect(description).to.equal({
                    title: 'The Rock',
                    type: 'website',
                    image: { url: 'http://ia.media-imdb.com/images/rock1.jpg' },
                    url: 'http://www.imdb.com/title/tt0117500/'
                });

                done();
            });
        });

        it('handles missing title', (done) => {

            const html = `<html>
            <head>
                <meta property="og:url" content="http://www.imdb.com/title/tt0117500/" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock1.jpg" />
            </head>
            </html>`;

            Metaphor.parse(html, 'http://www.imdb.com/title/tt0117500/', {}, (description) => {

                expect(description).to.equal({
                    type: 'website',
                    url: 'http://www.imdb.com/title/tt0117500/',
                    image: { url: 'http://ia.media-imdb.com/images/rock1.jpg' }
                });

                done();
            });
        });
    });

    describe('oembed()', () => {

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
