'use strict';

// Load modules

const Code = require('code');
const Lab = require('lab');
const Metaphor = require('..');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Metaphor', () => {

    describe('describe()', () => {

        it('describes a resource', (done) => {

            Metaphor.describe('https://twitter.com/sideway/status/626158822705401856', (err, description) => {

                expect(err).to.not.exist();
                expect(description).to.deep.equal({
                    type: 'article',
                    url: 'https://twitter.com/sideway/status/626158822705401856',
                    title: 'Sideway on Twitter',
                    image: { url: 'https://pbs.twimg.com/profile_images/690377853456760833/PINrFseJ_400x400.png' },
                    description: '\u201cFirst steps https://t.co/XvSn7XSI2G\u201d',
                    site_name: 'Twitter'
                });

                done();
            });
        });

        it('errors on missing document', (done) => {

            Metaphor.describe('https://twitter.com/sideway/status/1', (err, description) => {

                expect(err).to.exist();
                expect(err.message).to.equal('Failed obtaining document');
                done();
            });
        });

        it('errors on invalid domain', (done) => {

            Metaphor.describe('https://no_such_domain/1', (err, description) => {

                expect(err).to.exist();
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

            Metaphor.parse(html, (err, tags) => {

                expect(err).to.not.exist();
                const description = Metaphor.process(tags);
                expect(description).to.deep.equal({
                    title: 'The Rock',
                    type: 'video.movie',
                    url: 'http://www.imdb.com/title/tt0117500/',
                    image: { url: 'http://ia.media-imdb.com/images/rock.jpg' }
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

            Metaphor.parse(html, (err, tags) => {

                expect(err).to.not.exist();
                const description = Metaphor.process(tags);
                expect(description).to.deep.equal({
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

            Metaphor.parse(html, (err, tags) => {

                expect(err).to.not.exist();
                const description = Metaphor.process(tags);
                expect(description).to.deep.equal({
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
            </head>
            </html>`;

            Metaphor.parse(html, (err, tags) => {

                expect(err).to.not.exist();
                const description = Metaphor.process(tags);
                expect(description).to.deep.equal({
                    title: 'The Rock',
                    type: 'website'
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

            Metaphor.parse(html, (err, tags) => {

                expect(err).to.not.exist();
                const description = Metaphor.process(tags);
                expect(description).to.deep.equal({
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

        it('return empty object on missing head', (done) => {

            const html = `<html prefix="og: http://ogp.me/ns#">
            <body>
                <meta property="og:image" content="ignore2" />
            </body>
            </html>`;

            Metaphor.parse(html, (err, tags) => {

                expect(err).to.not.exist();
                const description = Metaphor.process(tags);
                expect(description).to.deep.equal({ type: 'website' });

                done();
            });
        });
    });
});
