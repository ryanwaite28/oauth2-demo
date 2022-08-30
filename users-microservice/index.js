const dotenv = require(`dotenv`);
dotenv.config();

const path = require('path');
const express = require(`express`);
const body_parser = require('body-parser');
const cookie_parser = require('cookie-parser');
const cors = require('cors');

const { SecretSecured, AccessTokenSecured } = require(`./utils`);
const corsMiddleware = require(`./cors-middleware`)();


const users = [
  { uid: 1, name: { first: `Test`, middle: `QA`, last: `User` }, email: `email`, password: `password`, date_joined: new Date().toISOString() },
  { uid: 2, name: { first: `John`, middle: ` Lee`, last: `Doe` }, email: `email2`, password: `password2`, date_joined: new Date().toISOString() },
];


const AUTH_HOST = `http://localhost:8080`;
const HOST = `http://localhost:8084`;

const app =  express();
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use(cookie_parser());

app.options('*', corsMiddleware);
app.use(corsMiddleware);

// app.use(cors());

const isProd = app.get('env') === 'production';

app.post(`/login`, SecretSecured, (request, response) => {

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

  console.log({ user });

  return response.status(200).json({ message: `User info`, user });

});

app.post(`/signup`, SecretSecured, (request, response) => {

  const { email, password } = request.body || {};

  if (!email) {
    return response.status(400).json({ message: `email required` });
  }
  if (!password) {
    return response.status(400).json({ message: `password required` });
  }

  const user = users.find(u => u.email === email);
  if (user) {
    return response.status(401).json({ message: `email is taken` });
  }

  const new_user = { name: { first: `A`, middle: `B`, last: `C` }, email, password, date_joined: new Date().toISOString(), uid: users.length + 1 };
  users.push(new_user);

  console.log({ new_user });

  return response.status(200).json({ user: new_user, message: `admit one` });

});

app.post(`/find-by-email`, AccessTokenSecured, (request, response) => {

  const { email } = request.body || {};

  if (!email) {
    return response.status(400).json({ message: `email required` });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return response.status(404).json({ message: `no user found` });
  }

  return response.status(200).json({ message: `found`, user });

});

app.get(`/get-user-info`, AccessTokenSecured, (request, response) => {

  const data = response.locals.data;
  return response.status(200).json({ message: `User info`, data });

});



const PORT = 8084;
app.listen(PORT, (l, e) => {
  console.log({ l, e });
  console.log(`listening to port ${PORT}...`);
});