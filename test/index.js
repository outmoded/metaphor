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

        it('describes a known resource', (done) => {

            Metaphor.describe('https://twitter.com/sideway/status/626158822705401856', (err, description) => {

                expect(err).to.not.exist();
                console.log(description);
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
});
