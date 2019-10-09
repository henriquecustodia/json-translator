const Koa = require('koa');
const consola = require('consola');
const { Nuxt, Builder } = require('nuxt');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');

async function start() {
  const app = new Koa()
  const router = new Router();

  // Import and Set Nuxt.js options
  const config = require('../nuxt.config.js');
  config.dev = app.env !== 'production';

  // Instantiate nuxt.js
  const nuxt = new Nuxt(config);

  const {
    host = process.env.HOST || '127.0.0.1',
    port = process.env.PORT || 3000
  } = nuxt.options.server;

  router.post('/translate', require('./translate-route'));
  router.get('/languages', require('./languages-route'));

  app
    .use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = err.message;
        ctx.app.emit('error', err, ctx);
      }
    })
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods());


  // Build in development
  if (config.dev) {
    const builder = new Builder(nuxt);
    await builder.build();
  } else {
    await nuxt.ready();
  }

  app.use((ctx) => {
    ctx.status = 200;
    ctx.respond = false; // Bypass Koa's built-in response handling
    ctx.req.ctx = ctx; // This might be useful later on, e.g. in nuxtServerInit or with nuxt-stash
    nuxt.render(ctx.req, ctx.res);
  })

  app.listen(port, host);

  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  });
}

start();