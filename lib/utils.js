'use strict';

// Load modules


// Declare internals

const internals = {};


exports.parse = function (payload) {

    try {
        return JSON.parse(payload.toString());
    }
    catch (err) {
        return null;
    }
};


exports.copy = function (from, to, keys) {

    to = to || {};
    keys.forEach((key) => {

        if (from[key]) {
            to[key] = from[key];
        }
    });

    return to;
};
