# metaphor

Open Graph, Twitter Card, and oEmbed Metadata Collector

[![Build Status](https://secure.travis-ci.org/hueniverse/metaphor.svg)](http://travis-ci.org/hueniverse/metaphor)

**metaphor** uses three web protocols to obtain information about web resources for the purpose of embedding smaller
versions of those resources in other web resources or applications. It is very common for applications to expand
links into a formatted preview of the link destination. However, obtaining this information requires using multiple
protocols to ensure maximum coverage.

This module uses the [Open Graph protocol](http://ogp.me/), [Twitter Cards](https://dev.twitter.com/cards/overview),
the [oEmbed protocol](http://oembed.com/), and information gathered from the resource HTML markup and HTTP headers.
It takes an optimistic approach, trying to gather information from as many sources as possible.

## Usage

```js
const Metaphor = require('..');

const engine = new Metaphor.Engine();
engine.describe('https://www.youtube.com/watch?v=cWDdd5KKhts', (description) => {

    /*
    {
        url: 'https://www.youtube.com/watch?v=cWDdd5KKhts',
        sources: ['ogp', 'oembed', 'twitter'],
        type: 'video',
        site_name: 'YouTube',
        title: 'Cheese Shop Sketch - Monty Python\'s Flying Circus',
        image: { url: 'https://i.ytimg.com/vi/cWDdd5KKhts/maxresdefault.jpg' },
        description: 'Subscribe to the Official Monty Python Channel here - http://smarturl.it/SubscribeToPython Cleese plays an erudite customer attempting to purchase some chees...',
        video: [
            {
                url: 'https://www.youtube.com/embed/cWDdd5KKhts',
                secure_url: 'https://www.youtube.com/embed/cWDdd5KKhts',
                type: 'text/html',
                width: '480',
                height: '360'
            },
            {
                url: 'http://www.youtube.com/v/cWDdd5KKhts?version=3&autohide=1',
                secure_url: 'https://www.youtube.com/v/cWDdd5KKhts?version=3&autohide=1',
                type: 'application/x-shockwave-flash',
                width: '480',
                height: '360',
                tag: ['Monty Python', 'Python (Monty) Pictures Limited', 'Comedy', 'flying circus', 'monty pythons flying circus', 'john cleese', 'micael palin', 'eric idle', 'terry jones', 'graham chapman', 'terry gilliam', 'funny', 'comedy', 'animation', '60s animation', 'humor', 'humour', 'sketch show', 'british comedy', 'cheese shop', 'monty python cheese', 'cheese shop sketch', 'cleese cheese', 'cheese']
            }
        ],
        thumbnail: {
            url: 'https://i.ytimg.com/vi/cWDdd5KKhts/hqdefault.jpg',
            width: 480,
            height: 360
        },
        embed: {
            type: 'video',
            height: 344,
            width: 459,
            html: '<iframe width="459" height="344" src="https://www.youtube.com/embed/cWDdd5KKhts?feature=oembed" frameborder="0" allowfullscreen></iframe>'
        },
        app: {
            iphone: {
                name: 'YouTube',
                id: '544007664',
                url: 'vnd.youtube://www.youtube.com/watch?v=cWDdd5KKhts&feature=applinks'
            },
            ipad: {
                name: 'YouTube',
                id: '544007664',
                url: 'vnd.youtube://www.youtube.com/watch?v=cWDdd5KKhts&feature=applinks'
            },
            googleplay: {
                name: 'YouTube',
                id: 'com.google.android.youtube',
                url: 'https://www.youtube.com/watch?v=cWDdd5KKhts'
            }
        },
        player: {
            url: 'https://www.youtube.com/embed/cWDdd5KKhts',
            width: '480',
            height: '360'
        },
        twitter: { site_username: '@youtube' }
    }
    */
});
```

## API

### `new Metaphor.Engine([options])`

A reusable engine used to set global processing settings for each description where:
- `options` - optional settings where:
    - `providers` - if `true`, the [oEmbed](http://oembed.com/) providers list file is used to look up
      resources when oEmbed [discovery](http://oembed.com/#section4) doesn't work. The module ships with
      a copy of the providers.json file. To use a different provider list, pass an array compatible with
      the providers.json format. If `false`, oEmbed usage will be limited to discovery only. Defaults to
      `true`.
    - `whitelist` - an optional array of HTTP or HTTPS URLs allowed to be described. The URLs use the
      format `{scheme}://{domain}/{path}` where:
        - `scheme` - must be `'http'` or `'https'`. The module will ignore which protocol is specified
          and will describe both schemes.
        - `domain` - the domain name with an optional `*.` prefix. The `'www.'` prefix is automatically
          removed and ignored.
        - `path` - if specified, but be `'*'` or a path where at least one segment is `'*'`.
    - `maxWidth` - an optional integer passed to the oEmbed endpoint to limit the maximum width of elements
      in the description. While the protocol requires providers to comply, many do not so this is at best
      a recommendation.
    - `maxHeight` - an optional integer passed to the oEmbed endpoint to limit the maximum height of elements
      in the description. While the protocol requires providers to comply, many do not so this is at best
      a recommendation.

### `engine.describe(url, callback)`

Described a web resource where:
- `url` - the resource HTTP or HTTPS URL.
- `callback` - the callback function using the signature `function(description)` where:
    - `description` - the **metaphor** description object.

Note that the `describe()` method does not return errors. Errors are optimistically ignored and best effort
is made to use as many sources for describing the `url`. The `description` always includes the following
two properties:
- `type` - set to `'website'` when the type is unknown.
- `url` - the resource canonical URL, set to the requested `url` when no source can be utilized.

When resources are successfully used, the `description` includes the `sources` property set to an array
of one or more of:
- `'resource'` - information was gathered from the resource HTML page.
- `'ogp'` - Open Graph protocol tags (`og:`) used.
- `'twitter'` - Twitter Card tags (`twitter:`) used.
- `'oembed'` - oEmbed service used.
