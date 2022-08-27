const dotenv = require(`dotenv`);
dotenv.config();

const path = require('path');
const express = require(`express`);
const cors = require('cors');
const nunjucks = require('nunjucks');
const session = require('express-session');
const connect_pg_simple = require('connect-pg-simple');
const body_parser = require('body-parser');
const cookie_parser = require('cookie-parser');

const Handlers = require(`./handlers`);
const corsMiddleware = require(`./cors-middleware`)();

const db_session_store = connect_pg_simple(session);




const app =  express();
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookie_parser());

app.options('*', corsMiddleware);
app.use(corsMiddleware);
// app.use(cors());

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




app.get(`/oauth`, Handlers.get_oauth);
app.post(`/oauth`, Handlers.post_oauth);
app.get(`/oauth/grant`, Handlers.get_oauth_grant);
app.get(`/verify-access-token`, Handlers.verify_access_token);

app.get(`/login`, Handlers.get_login);
app.post(`/login`, Handlers.post_login);
app.get(`/signup`, Handlers.get_signup);
app.post(`/signup`, Handlers.post_signup);





const PORT = 8080;
app.listen(PORT, (l, e) => {
  console.log({ l, e });
  console.log(`listening to port ${PORT}...`);
});