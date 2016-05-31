'use strict';

// Load modules

const HtmlParser2 = require('htmlparser2');


// Declare internals

const internals = {};


exports.parse = function (document, next) {

    /*
        <html prefix="og: http://ogp.me/ns#">
            <head>
                <title>The Rock (1996)</title>
                ...
                <meta name="author" value="Steve" />
                <meta name="description" value="Some movie" />
                <meta name="creator" value="Some site" />
                <meta name="publisher" value="Some name" />
                ...
                <meta property="og:title" content="The Rock" />
                <meta property="og:type" content="video.movie" />
                <meta property="og:url" content="http://www.imdb.com/title/tt0117500/" />
                <meta property="og:image" content="http://ia.media-imdb.com/images/rock.jpg" />
                ...
                <meta name="twitter:card" value="summary" />
                <meta name="twitter:site" value="@nytimes" />
                <meta property="twitter:url" content="http://www.nytimes.com/2016/05/27/us/politics/house-budget-gay-rights-paul-ryan.html" />
                <meta property="twitter:title" content="G.O.P. Opposition to Gay Rights Provision Derails Spending Bill" />
                <meta property="twitter:description" content="The House energy and water bill failed after conservatives voted against their own legislation rather than acquiesce to a bipartisan amendment." />
                <meta name="twitter:creator" value="emmarieNYT" />
                <meta property="twitter:image:alt" content="The House speaker, Paul D. Ryan, at his weekly news conference on Thursday. Mr. Ryan blamed Democrats for an appropriations bill&rsquo;s demise." />
                <meta property="twitter:image" content="https://static01.nyt.com/images/2016/05/27/us/27cong-web1/27cong-web1-thumbLarge.jpg" />
                <meta name="twitter:app:name:googleplay" content="NYTimes" />
                <meta name="twitter:app:id:googleplay" content="com.nytimes.android" />
                <meta name="twitter:app:url:googleplay" content="nytimes://reader/id/100000004438278" />
                ...
                <link rel="alternate" type="application/json+oembed" href="https://publish.twitter.com/oembed?url=https://twitter.com/dalmaer/status/726624422237364226" title="Dion Almaer on Twitter: &quot;Maybe agile doesn&#39;t scale and that&#39;s ok https://t.co/DwrWCnCU38&quot;">
            </head>
            ...
        </html>
     */

    const tags = { og: [], twitter: [], meta: [] };
    let oembedLink = null;

    const parser = new HtmlParser2.Parser({
        onopentag: function (name, attributes) {

            if (name === 'body') {
                parser.reset();
                return;
            }

            if (name === 'meta') {
                const property = attributes.property || attributes.name;
                const value = attributes.content || attributes.value;
                if (!property ||
                    !value) {

                    return;
                }

                if (['author', 'description'].indexOf(property) !== -1) {
                    tags.meta[property] = value;
                    return;
                }

                const parsed = property.match(/^(og|twitter):([^:]*)(?:\:(.*))?$/);
                if (parsed) {
                    tags[parsed[1]].push({
                        key: parsed[2],
                        sub: parsed[3],
                        value
                    });
                }

                return;
            }

            if (name === 'link') {
                switch (attributes.rel) {
                    case 'alternate':
                    case 'alternative':
                        if (attributes.type === 'application/json+oembed') {
                            oembedLink = attributes.href;
                        }
                        break;

                    case 'icon':
                        if (attributes.href) {
                            tags.meta.icon = tags.meta.icon || {};
                            const size = (attributes.sizes ? attributes.sizes.split('x')[0] : 'any');
                            tags.meta.icon[size] = attributes.href;
                        }
                        break;
                }
            }
        },
        onend: function () {

            return next(tags, oembedLink);
        }
    }, { decodeEntities: true });

    parser.write(document);
    parser.end();
};
