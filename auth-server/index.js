const dotenv = require(`dotenv`);
dotenv.config();

const path = require('path');
const express = require(`express`);
const cors = require(`cors`);
const jsonwebtoken = require(`jsonwebtoken`);
const nunjucks = require('nunjucks');
const moment = require('moment');
const session = require('express-session');
const connect_pg_simple = require('connect-pg-simple');
const body_parser = require('body-parser');
const db_session_store = connect_pg_simple(session);



const minutes = 1000 * 60;
const minutes_5 = 1000 * 60 * 5;
const uniqueValue = () => {
  return String(Date.now()) +
    Math.random().toString(36).substr(2, 34) +
    Math.random().toString(36).substr(2, 34) +
    Math.random().toString(36).substr(2, 34)
};

function generateJWT(data) {
  // console.log(`generateJWT:`, { data });
  try {
    const jwt_token = jsonwebtoken.sign(data, (process.env.JWT_SECRET));
    return jwt_token || null;
  } catch (e) {
    console.log(e);
    return null;
  }
}

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


const users = [
  { uid: 1, name: { first: `Test`, middle: `QA`, last: `User` }, email: `email`, password: `password`, date_joined: new Date().toISOString() },
  { uid: 2, name: { first: `John`, middle: ` Lee`, last: `Doe` }, email: `email2`, password: `password2`, date_joined: new Date().toISOString() },
];

const apps = [
  {
    cliend_id: 12345,
    name: `Demo App`,
    success_redirect: `http://localhost:5600/oauth-login`,
    error_redirect: `http://localhost:5600/oauth-login-error`,
    domain: `http://localhost:5600`,
  }
];

const authCodes = {};


const HOST = `http://localhost:8080`;

const app =  express();
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

nunjucks.configure({ autoescape: true });
nunjucks.configure(path.join(__dirname, 'public'), {
  autoescape: true,
  express: app,
});

const isProd = app.get('env') === 'production';
const express_session = session({
  // store: new db_session_store({
  //   conString: process.env.DATABASE_URL,
  // }),

  // Insert express-session options here
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  resave: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: isProd ? 'none' : false,
    path: '/',
    secure: isProd
  },
});
app.use(express_session);




app.get(`/oauth`, (request, response) => {
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

  const app = apps.find(a => a.cliend_id === parseInt(request.query.client_id));
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
});
app.post(`/oauth`, (request, response) => {
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

  const app = apps.find(a => a.cliend_id === parseInt(request.query.client_id));
  if (!app) {
    return response.status(400).json({
      error: `no app found by client_id ${request.query.client_id}`
    });
  }

  const code = uniqueValue(); // auth grant code
  authCodes[code] = {
    client_id: request.query.client_id,
    user: users.find(u => u.uid === request.session.uid),
  };
  setTimeout(() => {
    delete authCodes[code];
  }, minutes * 5);

  const redirect_url = app.success_redirect + `?code=${code}`
  return response.redirect(redirect_url);
});

app.get(`/oauth/grant`, (request, response) => {
  
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

  const app = apps.find(a => a.cliend_id === parseInt(request.query.client_id));
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
  delete authCodes[request.query.code];

  const expire_moment = moment().add(5, 'days');
  const expires = expire_moment.toISOString();
  const data = {
    expires,
    user: {...auth.user},
  };
  delete data.user.uid;
  delete data.user.password;

  const access_token = generateJWT(data);
  console.log({ access_token });

  return response.status(200).json({ access_token }); 
});

app.get(`/verify-access-token`, (request, response) => {

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

  return response.status(200).json({ message: `Token is valid!` });

});

app.get(`/check_session`, (request, response) => {
  return response.status(200).json({ logged_in: !!request.session.uid });
});



app.get(`/login`, (request, response) => {
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

  return response.sendFile(path.join(__dirname, `/public/static/html/login.html`));
});
app.post(`/login`, (request, response) => {
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

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return response.status(401).json({ message: `invalid credentials` });
  }

  request.session.uid = user.uid;

  return response.status(200).json({ user, message: `admit one` });
});

app.get(`/signup`, (request, response) => {
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

  return response.sendFile(path.join(__dirname, `/public/static/html/signup.html`));
});
app.post(`/signup`, (request, response) => {
  const logged_in = !!request.session.uid;
  const params = request.url.split('?')[1];

  if (!!logged_in) {
    console.log(`No session, going to login page`);
    return response.redirect(`${HOST}/oauth?${params}`);
  }

  console.log({ params, url: request.url, session: request.session });


});





const PORT = 8080;
app.listen(PORT, (l, e) => {
  console.log({ l, e });
  console.log(`listening to port ${PORT}...`);
});