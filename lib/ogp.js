'use strict';

// Load modules


// Declare internals

const internals = {
    subs: {
        image: 'url',
        audio: 'url',
        video: 'url',
        locale: 'primary'
    }
};


exports.describe = function (tags) {

    const properties = {};
    let last = null;
    for (let i = 0; i < tags.length; ++i) {
        const tag = tags[i];
        const key = tag.key;
        const sub = tag.sub;
        let value = tag.value;

        const isObject = (internals.subs[key]);
        if (sub) {
            if (last === key &&
                isObject) {

                const prev = (Array.isArray(properties[key]) ? properties[key][properties[key].length - 1] : properties[key]);
                if (prev[sub]) {
                    prev[sub] = [].concat(prev[sub]);
                    prev[sub].push(value);
                }
                else {
                    prev[sub] = value;
                }
            }
        }
        else {
            if (isObject) {
                value = { [internals.subs[key]]: value };
            }

            if (properties[key]) {
                properties[key] = [].concat(properties[key]);
                properties[key].push(value);
            }
            else {
                properties[key] = value;
            }
        }

        last = key;
    }

    return properties;
};
