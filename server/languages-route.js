const { languages } = require('@vitalets/google-translate-api');

module.exports = async ctx => {
    ctx.body = languages;
};
