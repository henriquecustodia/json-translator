const googleTranslateApi = require('@vitalets/google-translate-api');
const tunnel = require('tunnel');
const { getProxy } = require('./proxy-list');
const { defer } = require('./defer');

module.exports.translate = async ({ from, to, json }) => {
    return createObjectFromTranslationMap({
        map: await createMapToTranslate({ json, from, to }),
        from,
        to
    });
};

function translator({ value, from, to, proxy, deferred }) {
    deferred = deferred || defer();

    const options = { client: 'gtx', from, to };

    const config = (() => {
        if (!proxy) {
            return {};
        }

        const [host, port] = proxy;

        return {
            agent: tunnel.httpsOverHttp({ proxy: { host, port } })
        }
    })();

    googleTranslateApi(value, options, config)
        .then(res => {
            deferred.resolve(res);
        })
        .catch(() => {
            translator({
                value,
                from,
                to,
                proxy: getProxy(),
                deferred
            })
        });

    return deferred.promise;
}

async function createMapToTranslate(options) {
    return new Promise(resolve => {
        const {
            json,
            from,
            to,
            keyPathArr = [],
            map = [],
            isRoot = true
        } = options;

        for (const key in json) {
            const value = json[key];

            const arr = [...keyPathArr, key];

            if (typeof value === 'string') {
                const key = arr.join('.');
                map.push([key, value]);
            } else {
                createMapToTranslate({
                    json: value,
                    from,
                    to,
                    map,
                    keyPathArr: arr,
                    isRoot: false
                });
            }
        }

        if (isRoot) {
            resolve(map);
        }

    });
}

async function createObjectFromTranslationMap({ map, from, to }) {

    const encodedMap = await encodeMap(map);

    const decodedMap = encodedMap.reduce(async (acc, encodedValue) => {
        const { text } = await translator({ value: encodedValue, from, to });
        const decodedMap = decodeMap(text);
        return [...(await acc), ...decodedMap];
    }, []);

    const translatedMap = await decodedMap;

    const translationObject = translatedMap.reduce((translationObject, [key, translation]) => {
        const keyPathAsArray = key.split('.');
        setTranslationInObject(keyPathAsArray, translation, translationObject);
        return translationObject;
    }, {});

    return translationObject;
}

function setTranslationInObject(keypathArray, translation, object) {
    const key = keypathArray.shift();
    const isLast = keypathArray.length === 0;

    if (isLast) {
        object[key] = translation;
    } else {
        object[key] = object[key] || {}
        setTranslationInObject(keypathArray, translation, object[key]);
    }
}

const SEPARATOR = '[SPT]';
const KEY_VALUE_SEPARATOR = '[KV]';
const SENTENCE_QUANTITY = 100;

function encodeMap(map, encodedMap = [], deferred = defer()) {
    const mapCopy = [...map];

    const fragments = mapCopy.splice(0, SENTENCE_QUANTITY);
    const hasItems = mapCopy.length > 0;

    const encoded = fragments
        .reduce((acc, item) => {
            const [key, value] = item;
            return [...acc, `${key}${KEY_VALUE_SEPARATOR}${value}`]
        }, [])
        .join(SEPARATOR);

    encodedMap.push(encoded);

    if (hasItems) {
        encodeMap(mapCopy, encodedMap, deferred);
    } else {
        deferred.resolve(encodedMap);
    }

    return deferred.promise;
}

function decodeMap(value) {
    return value
        .split(SEPARATOR)
        .reduce((acc, item) => {
            let [key, value] = item.split(KEY_VALUE_SEPARATOR);
            value = value || '';
            value = value.trim();

            return [...acc, [key, value]];
        }, []);
}
