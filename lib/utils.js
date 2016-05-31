'use strict';

// Load modules

const Url = require('url');


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


exports.copy = function (from, to, keys, source) {

    to = to || {};
    let used = false;
    keys.forEach((key) => {

        if (from[key]) {
            to[key] = from[key];
            used = true;
        }
    });

    if (used &&
        source) {

        to.sources.push(source);
    }

    return to;
};


exports.localize = function (base, link) {

    if (typeof base === 'string') {
        base = Url.parse(base);
    }

    let modified = false;
    if (link.indexOf('//') === 0) {
        link = `${base.protocol}${link}`;
        modified = true;
    }

    const uri = Url.parse(link);
    if (!modified &&
        uri.protocol &&
        uri.pathname[0] === '/') {

        return link;
    }

    delete uri.href;

    uri.protocol = uri.protocol || base.protocol;
    uri.hostname = uri.hostname || base.hostname;
    if (uri.pathname[0] !== '/') {
        const sep = (base.path[base.pathname.length - 1] === '/' ? '' : '/');
        uri.pathname = `${base.pathname}${sep}${uri.pathname}`;
    }

    return Url.format(uri);
};
