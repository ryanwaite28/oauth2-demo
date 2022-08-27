const cors = require('cors');

module.exports = function() {
  const whitelist_domains = process.env[`CORS_WHITELIST_ORIGINS`] ? process.env[`CORS_WHITELIST_ORIGINS`].split(',') : [];
  console.log({ whitelist_domains });

  const corsOptions = {
    // https://expressjs.com/en/resources/middleware/cors.html
    credentials: true,
    optionsSuccessStatus: 200,
    origin(origin, callback) {
      const useOrigin = (origin || '');
      const originIsAllowed = !origin || whitelist_domains.includes(useOrigin);
      // console.log({
      //   origin,
      //   callback,
      //   originIsAllowed,
      //   whitelist_domains,
      // });

      if (originIsAllowed) {
        console.log(`origin ${useOrigin || 'undefined'} is allowed`);
        callback(null, true);
      } else {
        console.log(`origin ${useOrigin} is NOT allowed`);
        callback(new Error(`Origin "${origin}" Not allowed by CORS`));
      }
    }
  };
  const corsMiddleware = cors(corsOptions);

  return corsMiddleware;
}