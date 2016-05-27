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
        let sub = tag.sub;
        let value = tag.value;

        const objectKey = internals.subs[key];
        if (sub === objectKey) {
            sub = undefined;
        }

        if (sub) {
            if (last === key &&
                objectKey) {

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
            if (objectKey) {
                value = { [objectKey]: value };
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
