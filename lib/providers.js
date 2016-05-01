'use strict';

// Load modules

const Url = require('url');


// Declare internals

const internals = {
    hosts: {}
};


exports.service = function (url) {

    const uri = Url.parse(url);
    const service = internals.hosts[uri.host];
    if (!service) {
        return null;
    }

    return `${service}?url=${encodeURIComponent(url)}`;
};


// https://publish.twitter.com/oembed?url=https://twitter.com/sideway/status/626158822705401856

internals.providers = {
    'twitter.com': {
        service: 'https://publish.twitter.com/oembed'
    },
    'dailymotion.com': {
        service: 'http://www.dailymotion.com/services/oembed'
    },
    'flickr.com': {
        service: 'http://www.flickr.com/services/oembed/',
        aliases: ['flic.kr']
    },
    'gettyimages.com': {
        service: 'http://embed.gettyimages.com/oembed',
        aliases: ['gty.im']
    },
    'hulu.com': {
        service: 'http://www.hulu.com/api/oembed.json'
    },
    'instagram.com': {
        service: 'http://api.instagram.com/oembed',
        aliases: ['instagr.am']
    },
    'kickstarter.com': {
        service: 'http://www.kickstarter.com/services/oembed'
    },
    'scribd.com': {
        service: 'http://www.scribd.com/services/oembed/'
    },
    'slideshare.net': {
        service: 'http://www.slideshare.net/api/oembed/2'
    },
    'smugmug.com': {
        service: 'http://api.smugmug.com/services/oembed/'
    },
    'soundcloud.com': {
        service: 'https://soundcloud.com/oembed'
    },
    'ted.com': {
        service: 'http://www.ted.com/talks/oembed.json'
    },
    'nytimes.com': {
        service: 'https://www.nytimes.com/svc/oembed'
    },
    'ustream.tv': {
        service: 'http://www.ustream.tv/oembed',
        aliases: ['ustream.com']
    },
    'viddler.com': {
        service: 'http://www.viddler.com/oembed/'
    },
    'vimeo.com': {
        service: 'https://vimeo.com/api/oembed.json'
    },
    'vine.co': {
        service: 'https://vine.co/oembed.json'
    },
    'yfrog.com': {
        service: 'http://www.yfrog.com/api/oembed',
        aliases: ['yfrog.us']
    },
    'youtube.com': {
        service: 'http://www.youtube.com/oembed',
        aliases: ['youtu.be']
    }
};


internals.map = function () {

    const hosts = Object.keys(internals.providers);
    hosts.forEach((host) => {

        const provider = internals.providers[host];

        internals.hosts[host] = provider.service;
        internals.hosts[`www.${host}`] = provider.service;

        if (provider.aliases) {
            provider.aliases.forEach((alias) => {

                internals.hosts[`${alias}`] = provider.service;
                internals.hosts[`www.${alias}`] = provider.service;
            });
        }
    });
};

internals.map();
