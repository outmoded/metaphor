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

        it('handles Twitter account id value', (done) => {

            const html = `<html>
            <head>
                <meta name="twitter:card" value="summary" />
                <meta name="twitter:site" value="@nytimes" />
                <meta property="twitter:url" content="http://www.nytimes.com/2016/05/27/us/politics/house-budget-gay-rights-paul-ryan.html" />
                <meta property="twitter:title" content="G.O.P. Opposition to Gay Rights Provision Derails Spending Bill" />
                <meta property="twitter:description" content="The House energy and water bill failed after conservatives voted against their own legislation rather than acquiesce to a bipartisan amendment." />
                <meta name="twitter:creator:id" value="261289053" />
                <meta name="twitter:app:name:unknown" content="NYTimes" />
            </head>
            <body>
            </body>
            </html>`;

            Metaphor.parse(html, 'https://example.com', {}, (description) => {

                expect(description).to.equal({
                    url: 'https://example.com',
                    type: 'website',
                    description: 'The House energy and water bill failed after conservatives voted against their own legislation rather than acquiesce to a bipartisan amendment.',
                    title: 'G.O.P. Opposition to Gay Rights Provision Derails Spending Bill',
                    twitter: {
                        site_username: '@nytimes',
                        creator_id: '261289053'
                    },
                    sources: ['twitter']
                });

                done();
            });
        });

        it('ignores unknown app', (done) => {

            const html = `<html>
            <head>
                <meta name="twitter:card" value="summary" />
                <meta name="twitter:site" value="@nytimes" />
                <meta property="twitter:url" content="http://www.nytimes.com/2016/05/27/us/politics/house-budget-gay-rights-paul-ryan.html" />
                <meta property="twitter:title" content="G.O.P. Opposition to Gay Rights Provision Derails Spending Bill" />
                <meta property="twitter:description" content="The House energy and water bill failed after conservatives voted against their own legislation rather than acquiesce to a bipartisan amendment." />
                <meta name="twitter:app:name:unknown" content="NYTimes" />
            </head>
            <body>
            </body>
            </html>`;

            Metaphor.parse(html, 'https://example.com', {}, (description) => {

                expect(description).to.equal({
                    url: 'https://example.com',
                    type: 'website',
                    description: 'The House energy and water bill failed after conservatives voted against their own legislation rather than acquiesce to a bipartisan amendment.',
                    title: 'G.O.P. Opposition to Gay Rights Provision Derails Spending Bill',
                    twitter: { site_username: '@nytimes' },
                    sources: ['twitter']
                });

                done();
            });
        });

        it('ignores missing app sub key', (done) => {

            const html = `<html>
            <head>
                <meta name="twitter:card" value="summary" />
                <meta name="twitter:site" value="@nytimes" />
                <meta property="twitter:url" content="http://www.nytimes.com/2016/05/27/us/politics/house-budget-gay-rights-paul-ryan.html" />
                <meta property="twitter:title" content="G.O.P. Opposition to Gay Rights Provision Derails Spending Bill" />
                <meta property="twitter:description" content="The House energy and water bill failed after conservatives voted against their own legislation rather than acquiesce to a bipartisan amendment." />
                <meta name="twitter:app" content="NYTimes" />
            </head>
            <body>
            </body>
            </html>`;

            Metaphor.parse(html, 'https://example.com', {}, (description) => {

                expect(description).to.equal({
                    url: 'https://example.com',
                    type: 'website',
                    description: 'The House energy and water bill failed after conservatives voted against their own legislation rather than acquiesce to a bipartisan amendment.',
                    title: 'G.O.P. Opposition to Gay Rights Provision Derails Spending Bill',
                    twitter: { site_username: '@nytimes' },
                    sources: ['twitter']
                });

                done();
            });
        });
    });
});
