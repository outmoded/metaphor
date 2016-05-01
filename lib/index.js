'use strict';

// Load modules

const Hoek = require('hoek');
const Wreck = require('wreck');
const Providers = require('./providers');


// Declare internals

const internals = {};


exports.describe = function (url, callback) {

    const service = Providers.service(url);
    if (!service) {
        return Hoek.nextTick(callback)();
    }

    return callback(null, service);
};
