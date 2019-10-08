const googleTranslateApi = require('@vitalets/google-translate-api');
const tunnel = require('tunnel');
const { getProxy } = require('./proxy-list');
const { defer } = require('./defer');

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
            if (proxy) {
                console.log('proxy -> ', proxy);
            } else {
                console.log('sem proxy');
            }

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

async function translate({ from, to, json }) {
    return createObjectFromTranslationMap({
        map: await createMapToTranslate({ json, from, to }),
        from,
        to
    });
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
    const translatedMap = await Promise.all(
        map.map(async ([key, value]) => {
            console.time(value);
            const { text } = await translator({ value, from, to })
            console.timeEnd(value);
            console.log('sentence -> ', value, 'translation -> ', text)

            return [key, text];
        })
    );

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

module.exports = async ctx => {
    const { from, to, json } = ctx.request.body;

    try {
        console.time('translate');
        ctx.body = await translate({ from, to, json });
        console.timeEnd('translate');
    } catch (error) {
        console.error(error)
    }
}

