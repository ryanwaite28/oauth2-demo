const dotenv = require(`dotenv`);
dotenv.config();

const path = require('path');
const express = require(`express`);
const cors = require(`cors`);
const jsonwebtoken = require(`jsonwebtoken`);
const body_parser = require('body-parser');


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



const AUTH_HOST = `http://localhost:8080`;
const HOST = `http://localhost:8082`;

const app =  express();
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));

app.use(cors());

const isProd = app.get('env') === 'production';

app.get(`/get-user-info`, (request, response) => {

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

  return response.status(200).json({ message: `User info`, data });

});



const PORT = 8082;
app.listen(PORT, (l, e) => {
  console.log({ l, e });
  console.log(`listening to port ${PORT}...`);
});