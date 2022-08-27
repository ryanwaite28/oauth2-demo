const jsonwebtoken = require(`jsonwebtoken`);

function decodeJWT(token) {
  try {
    const data = jsonwebtoken.verify(token, (process.env.JWT_SECRET));
    // console.log(`decodeJWT:`, { data });
    return data;
  } catch (e) {
    console.log(e);
    return null;
  }
}

function SecretSecured(request, response, next) {
  const users_microservice_secret = request.get('Users-Microservice-Secret');
  if (!users_microservice_secret) {
    return response.status(400).json({ message: `missing Users-Microservice-Secret header` });
  }

  const invalid = users_microservice_secret !== process.env[`USERS_MICROSERVICE_SECRET`];
  if (invalid) {
    return response.status(400).json({ message: `Invalid` });
  }

  return next();
}

function AccessTokenSecured(request, response, next) {
  const auth = request.get('Authorization');
  if (!auth) {
    return response.status(400).json({ message: `missing Authorization header` });
  }
  const isNotBearerFormat = !(/Bearer\s[^]/).test(auth);
  if (isNotBearerFormat) {
    return response.status(400).json({ message: `Authorization header is not in bearer format` });
  }

  /* Check token validity */
  const token = auth.split(' ')[1];
  let you, data;
  try {
    data = decodeJWT(token) || null;
    console.log({ data });
    you = data.user;
  } catch (e) {
    console.log(e);
    you = null;
  }
  if (!you) {
    return response.status(401).json({ message: `Request not authorized: invalid token` });
  }

  const isExpired = (new Date()) > (new Date(data.expires));
  if (isExpired) {
    return response.status(401).json({ message: `token is expired`, expired: true });
  }

  response.locals.data = data;
  response.locals.you = you;

  return next();
}



module.exports = {
  decodeJWT,
  SecretSecured,
  AccessTokenSecured
};