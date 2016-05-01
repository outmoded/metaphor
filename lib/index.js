'use strict';

// Load modules

const Wreck = require('wreck');


// Declare internals

const internals = {};


exports.describe = function (url, callback) {

    Wreck.get(url, {}, (err, res, payload) => {

        if (err) {
            return callback(err);
        }

        if (res.statusCode !== 200) {
            return callback(new Error('Failed obtaining document'));
        }

        return callback();
    });
};
