const googleTranslateApi = require('@vitalets/google-translate-api');
const tunnel = require('tunnel');

const translator = (value, from, to) => {
    const options = { client: 'gtx', from, to };
    const config = {
        agent: tunnel.httpsOverHttp({
            proxy: {
                host: '127.0.0.1',
                port: '3001',
                headers: {
                    'User-Agent': 'Node'
                }
            }
        })
    };

    return googleTranslateApi(value, options, config);
}

async function translate({ from, to, json }) {
    return new Promise(async (resolve) => {
        const map = await createMapToTranslate({ json, from, to });
        console.log('map', map)
        createObjectFromTranslationMap({ map, from, to, resolve });
    })
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

async function createObjectFromTranslationMap({ map, from, to, resolve, translationObject = {} }) {
    const [key, value] = map.shift();
    const isLast = map.length === 0;

    const keyPathAsArray = key.split('.');

    const { text } = await translator(value, from, to)

    setTranslationInObject(keyPathAsArray, text, translationObject);

    if (!isLast) {
        createObjectFromTranslationMap({ map, from, to, resolve, translationObject })
    } else {
        resolve(translationObject);
    }
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
        ctx.body = await translate({ from, to, json });
    } catch (error) {
        console.error(error)
    }
}

