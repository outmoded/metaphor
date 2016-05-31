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


describe('Open Graph', () => {

    describe('describe()', () => {

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
                <meta property="og:image:unknown" content="ignore" />
                <meta property="og:unknown" content="ignore" />
                <meta property="og:title:ignore" content="ignore" />
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
                    ],
                    sources: ['ogp']
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
                    },
                    sources: ['ogp']
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
                    image: { url: 'http://ia.media-imdb.com/images/rock1.jpg' },
                    sources: ['ogp']
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
                    ],
                    sources: ['ogp']
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
                    url: 'http://www.imdb.com/title/tt0117500/',
                    sources: ['ogp']
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
                    url: 'http://www.imdb.com/title/tt0117500/',
                    sources: ['ogp']
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
                    image: { url: 'http://ia.media-imdb.com/images/rock1.jpg' },
                    sources: ['ogp']
                });

                done();
            });
        });
    });
});
