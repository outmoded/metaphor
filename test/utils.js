'use strict';

// Load modules

const Url = require('url');
const Code = require('code');
const Lab = require('lab');
const Utils = require('../lib/utils');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Utils', () => {

    describe('localize()', () => {

        it('return unchanged url', (done) => {

            expect(Utils.localize('http://example.com/path', 'http://example.com/path/image.jpg?x=0')).to.equal('http://example.com/path/image.jpg?x=0');
            done();
        });

        it('localizes relative url', (done) => {

            expect(Utils.localize('http://example.com/path', 'image.jpg?x=0')).to.equal('http://example.com/path/image.jpg?x=0');
            done();
        });

        it('localizes relative url (base trailing /)', (done) => {

            expect(Utils.localize('http://example.com/path/', 'image.jpg?x=0')).to.equal('http://example.com/path/image.jpg?x=0');
            done();
        });

        it('localizes relative url (parsed base)', (done) => {

            expect(Utils.localize(Url.parse('http://example.com/path'), 'image.jpg?x=0')).to.equal('http://example.com/path/image.jpg?x=0');
            done();
        });

        it('localizes absolute url', (done) => {

            expect(Utils.localize('http://example.com/path', '/image.jpg?x=0')).to.equal('http://example.com/image.jpg?x=0');
            done();
        });

        it('adds missing scheme', (done) => {

            expect(Utils.localize('https://example.com/path', '//example.net/image.jpg?x=0')).to.equal('https://example.net/image.jpg?x=0');
            done();
        });
    });
});
