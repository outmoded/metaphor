'use strict';

// Load modules

const Code = require('code');
const Lab = require('lab');
const Oembed = require('..');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Oembed', () => {

    describe('describe()', () => {

        it('describes a known resource', (done) => {

            Oembed.describe('https://twitter.com/sideway/status/626158822705401856', (err, description) => {

                expect(err).to.not.exist();
                console.log(description);
                done();
            });
        });

        it('returns null on unknown resource', (done) => {

            Oembed.describe('https://example.com/2705401856', (err, description) => {

                expect(err).to.not.exist();
                expect(description).to.not.exist();
                done();
            });
        });
    });
});
