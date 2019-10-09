const { translate } = require('./utils/translator');

module.exports = async ctx => {
    const { from, to, json } = ctx.request.body;

    try {
        ctx.body = await translate({ from, to, json });
    } catch (error) {
        ctx.throw(500, error);
    }
}

