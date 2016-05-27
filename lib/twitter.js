'use strict';

// Load modules


// Declare internals

const internals = {
    devices: ['iphone', 'ipad', 'googleplay']
};


/*
    card                    // The card type
    site                    // @username of website. Either twitter:site or twitter:site:id is required.
    site:id                 // Same as twitter:site, but the user’s Twitter ID. Either twitter:site or twitter:site:id is required.
    domain                  // Display name for the site.
    creator                 // @username of content creator (summary_large_image).
    creator:id              // Twitter user ID of content creator (summary, summary_large_image).
    description             // Description of content, maximum 200 characters, (summary, summary_large_image, player). Same as og:description.
    title                   // Title of content, max 70 characters, (summary, summary_large_image, player). Same as og:title.
    image                   // URL of image to use in the card. Image must be less than 1MB in size (summary, summary_large_image, player). Same as og:image.
    image:alt               // A text description of the image conveying the essential nature of an image to users who are visually impaired (summary, summary_large_image, player).

    player                  // HTTPS URL of player iframe (player).
    player:width            // Width of iframe in pixels (player).
    player:height           // Height of iframe in pixels (player).
    player:stream           // URL to raw video or audio stream (player).

    app:name:iphone         // Name of your iPhone app (app).
    app:id:iphone           // Your app ID in the iTunes App Store. Note: NOT your bundle ID (app).
    app:url:iphone          // Your app’s custom URL scheme. You must include “://” after your scheme name (app).

    app:name:ipad           // Name of your iPad optimized app (app).
    app:id:ipad             // Your app ID in the iTunes App Store (app).
    app:url:ipad            // Your app’s custom URL scheme (app).

    app:name:googleplay     // Name of your Android app (app).
    app:id:googleplay       // Your app ID in the Google Play Store (app).
    app:url:googleplay      // Your app’s custom URL scheme (app).
*/


exports.describe = function (tags) {

    const properties = {};
    for (let i = 0; i < tags.length; ++i) {
        const tag = tags[i];
        const key = tag.key;
        const sub = tag.sub;

        switch (key) {

            // Flat attributes

            case 'card':
            case 'description':
            case 'title':
                properties[key] = tag.value;
                break;

            // Id attributes

            case 'site':
            case 'creator':
                properties[key + (sub ? '_id' : '_username')] = tag.value;
                break;

            // Single level object attributes

            case 'image':
            case 'player':
                properties[key] = properties[key] || {};
                properties[key][sub ? (sub === 'src' ? 'url' : sub) : 'url'] = tag.value;
                break;

            // Two level object attributes

            case 'app':
                if (sub) {
                    const parts = sub.split(':');
                    const device = parts[1];
                    if (internals.devices.indexOf(device) !== -1) {
                        properties.app = properties.app || {};
                        properties.app[device] = properties.app[device] || {};
                        properties.app[device][parts[0]] = tag.value;
                    }
                }
                break;
        }
    }

    return properties;
};
