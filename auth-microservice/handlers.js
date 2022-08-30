const { generateJWT, decodeJWT, minutes, uniqueValue } = require(`./utils`);
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const UsersMicroservice = require('./users-microservice');



const apps = [
  {
    client_id: 12345,
    name: `Demo App`,
    success_redirect: `http://localhost:5600/oauth-login`,
    error_redirect: `http://localhost:5600/oauth-login-error`,
    domain: `http://localhost:5600`,
  }
];
const authCodes = {};
const HOST = `http://localhost:8080`;





const get_oauth = (request, response) => {
  const logged_in = !!request.session.uid;
  const params = request.url.split('?')[1];

  if (request.get('origin')) {
    request.session.origin = request.get('origin');
  }

  if (!logged_in) {
    console.log(`No session, going to login page`);
    return response.redirect(`${HOST}/login?${params}`);
  }

  console.log({ params, url: request.url, origin: request.get('origin'), referer: request.get('referer'), session: request.session });

  if (!request.query.client_id) {
    return response.status(400).json({
      error: `missing client_id in URL query params`
    });
  }

  const app = apps.find(a => a.client_id === parseInt(request.query.client_id));
  if (!app) {
    return response.status(400).json({
      error: `no app found by client_id "${request.query.client_id}"`
    });
  }

  // const origin = request.get('origin') || request.session.origin;
  // if (app.domain !== origin) {
  //   return response.status(400).json({
  //     error: `origin ${request.get('origin')} is not listed in app's domains list`
  //   });
  // }
  

  return response.render(`static/html/oauth.html`, { third_party_app_name: app.name, client_id: request.query.client_id });
  // return response.status(200).json({ message: `admit one` });
};

const post_oauth = (request, response) => {
  const logged_in = !!request.session.uid;
  const params = request.url.split('?')[1];

  if (!logged_in) {
    console.log(`No session, going to login page`);
    return response.status(400).json({
      error: `not logged in`
    });
  }

  console.log({ params, url: request.url, origin: request.get('origin'), referer: request.get('referer'), session: request.session });

  if (!request.query.client_id) {
    return response.status(400).json({
      error: `missing client_id in URL query params`
    });
  }

  const app = apps.find(a => a.client_id === parseInt(request.query.client_id));
  if (!app) {
    return response.status(400).json({
      error: `no app found by client_id ${request.query.client_id}`
    });
  }

  const code = uniqueValue(); // auth grant code
  authCodes[code] = {
    client_id: parseInt(request.query.client_id),
    user: request.session.user,
  };
  setTimeout(() => {
    delete authCodes[code];
  }, minutes * 5);

  const redirect_url = app.success_redirect + `?code=${code}`;

  const xsrf_token = uuidv4();
  console.log({ xsrf_token });
  response.cookie('XSRF-TOKEN', xsrf_token, { httpOnly: false });
  response.setHeader(`Access-Control-Allow-Origin`, app.domain);

  return response.redirect(redirect_url);
};

const get_oauth_grant = (request, response) => {

  console.log({ cookies: request.cookies, headers: request.headers });

  const xsrf_token_cookie = request.cookies['XSRF-TOKEN'];
  const xsrf_token_header = request.get(`X-XSRF-TOKEN`);

  const xsrf_safe = !!xsrf_token_cookie && !!xsrf_token_header && xsrf_token_cookie === xsrf_token_header;

  console.log({ xsrf_token_cookie, xsrf_token_header, xsrf_safe });

  console.log({ url: request.url, origin: request.get('origin'), referer: request.get('referer'), session: request.session });
  
  if (!request.query.client_id) {
    return response.status(400).json({
      error: `missing client_id in URL query params`
    });
  }
  if (!request.query.code) {
    return response.status(400).json({
      error: `missing code in URL query params`
    });
  }

  const app = apps.find(a => a.client_id === parseInt(request.query.client_id));
  if (!app) {
    return response.status(400).json({
      error: `no app found by client_id ${request.query.client_id}`
    });
  }

  // if (!app.domains.includes(request.get('origin'))) {
  //   return response.status(400).json({
  //     error: `origin ${request.get('origin')} is not listed in app's domains list`
  //   });
  // }

  const auth = authCodes[request.query.code];
  if (!auth) {
    return response.status(400).json({
      error: `invalid auth grant code`
    });
  }

  console.log({
    auth,
    query: request.query
  });

  if (auth.client_id !== parseInt(request.query.client_id)) {
    return response.status(400).json({
      error: `auth grant code mismatch by client_id ${request.query.client_id}`
    });
  }

  delete authCodes[request.query.code];

  const expire_moment = moment().add(5, 'seconds');
  const expires = expire_moment.toISOString();
  const data = {
    expires,
    user: {...auth.user},
  };
  delete data.user.uid;
  delete data.user.password;

  const access_token = generateJWT(data);
  console.log({ access_token });

  response.setHeader(`Access-Control-Allow-Origin`, app.domain);

  return response.status(200).json({ access_token }); 
};

const verify_access_token = (request, response) => {

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

  return response.status(200).json({ valid: true, message: `Token is valid!`, data });

};

const get_login = (request, response) => {
  const logged_in = !!request.session.uid;
  const params = request.url.split('?')[1];

  if (request.get('origin')) {
    request.session.origin = request.get('origin');
  }

  if (!!logged_in) {
    console.log(`No session, going to login page`);
    return response.redirect(`${HOST}/oauth?${params}`);
  }

  console.log({ params, url: request.url, origin: request.get('origin'), referer: request.get('referer'), session: request.session });

  return response.render(`static/html/login.html`, { client_id: request.query.client_id });
};

const post_login = async (request, response) => {
  const logged_in = !!request.session.uid;
  const params = request.url.split('?')[1];

  if (!!logged_in) {
    console.log(`No session, going to login page`);
    return response.redirect(`${HOST}/oauth?${params}`);
  }

  console.log({ params, url: request.url, origin: request.get('origin'), referer: request.get('referer'), session: request.session });

  const { email, password } = request.body || {};

  if (!email) {
    return response.status(400).json({ message: `email required` });
  }
  if (!password) {
    return response.status(400).json({ message: `password required` });
  }

  /* Call users microservice */
  const user = await UsersMicroservice.login(email, password);
  if (!user) {
    return response.status(401).json({ message: `invalid credentials` });
  }
  
  request.session.user = user;
  request.session.uid = user.uid;

  return response.status(200).json({ user, message: `admit one` });
};

const get_signup = (request, response) => {
  const logged_in = !!request.session.uid;
  const params = request.url.split('?')[1];

  if (request.get('origin')) {
    request.session.origin = request.get('origin');
  }

  if (!!logged_in) {
    console.log(`No session, going to login page`);
    return response.redirect(`${HOST}/oauth?${params}`);
  }

  console.log({ params, url: request.url, origin: request.get('origin'), referer: request.get('referer'), session: request.session });

  return response.render(`static/html/signup.html`, { client_id: request.query.client_id });
};

const post_signup = async (request, response) => {
  const logged_in = !!request.session.uid;
  const params = request.url.split('?')[1];

  if (!!logged_in) {
    console.log(`No session, going to login page`);
    return response.redirect(`${HOST}/oauth?${params}`);
  }

  console.log({ params, url: request.url, session: request.session });

  const { email, password } = request.body || {};

  if (!email) {
    return response.status(400).json({ message: `email required` });
  }
  if (!password) {
    return response.status(400).json({ message: `password required` });
  }

  /* Call users microservice */
  const results = await UsersMicroservice.signup(email, password);
  if (!results) {
    return response.status(401).json({ message: `invalid inputs` });
  }
  if (results.error) {
    return response.status(results.status).json({ message: results.message });
  }

  request.session.user = results;
  request.session.uid = results.uid;

  return response.status(200).json({ user: results, message: `admit one` });
};





module.exports = {
  get_oauth,
  post_oauth,
  get_oauth_grant,
  verify_access_token,
  get_login,
  post_login,
  get_signup,
  post_signup,
};