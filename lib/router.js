'use strict';

// Load modules

const Url = require('url');
const Hoek = require('hoek');


// Declare internals

const internals = {};


exports = module.exports = internals.Router = class {
    constructor() {

        this._existing = {};
        this._domains = {
            subs: {}
        };
    }

    add(url, node) {

        //                                                    1       2            3
        const parts = url.match(/^https?\:\/\/(?:www\.)?(?:(\*)\.)?([^\/]+)(?:\/(.*))?$/);
        if (!parts) {
            return;
        }

        const wildcard = !!parts[1];
        const domain = parts[2];
        const path = parts[3];

        const normalized = `${wildcard ? '*.' : ''}${domain}/${path}`;
        if (this._existing[normalized]) {
            return;
        }

        this._existing[normalized] = true;

        let tree = this._domains;
        const segment = domain.split('.');
        for (let i = segment.length - 1; i >= 0; --i) {
            const part = segment[i];
            tree.subs[part] = tree.subs[part] || { subs: {}, paths: [] };
            tree = tree.subs[part];
        }

        tree.node = node;
        tree.wildcard = wildcard;

        if (!path ||
            path === '*' ||
            path.indexOf('*') === -1) {

            tree.any = true;
        }
        else {
            const escaped = Hoek.escapeRegex(path);
            const regex = `^\/${escaped.replace(/\\\*/g, '[^\\/]*')}$`;
            tree.paths.push(new RegExp(regex));
        }
    }

    lookup(url) {

        const uri = Url.parse(url);
        const parts = uri.hostname.split('.');
        if (parts[0] === 'www') {
            parts.splice(0, 1);
        }

        let tree = this._domains;
        for (let i = parts.length - 1; i >= 0; --i) {
            const part = parts[i];
            const segment = tree.subs[part];
            if (!segment) {
                if (i === 0 &&
                    tree.wildcard) {

                    break;
                }

                return null;
            }

            tree = segment;
        }

        if (!tree.node) {
            return null;
        }

        if (tree.any) {
            return tree.node;
        }

        for (let i = 0; i < tree.paths.length; ++i) {
            if (uri.pathname.match(tree.paths[i])) {
                return tree.node;
            }
        }

        return null;
    }
};
