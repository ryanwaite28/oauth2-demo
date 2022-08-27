const dotenv = require(`dotenv`);
dotenv.config();

const path = require('path');
const express = require(`express`);
const cors = require(`cors`);
const jsonwebtoken = require(`jsonwebtoken`);
const body_parser = require('body-parser');



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
      callback(null, true);
    } else {
      callback(new Error(`Origin "${origin}" Not allowed by CORS`));
    }
  }
};
const corsMiddleware = cors(corsOptions);



const AUTH_HOST = `http://localhost:8080`;
const HOST = `http://localhost:8082`;

const app =  express();
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));

app.options('*', corsMiddleware);
app.use(corsMiddleware);

// app.use(cors());

const isProd = app.get('env') === 'production';

const dataByUserEmail = {
  'email': [
    { owner_uid: 1, title: `lorem ipsum`, body: `salor velim orisp vuju` }
  ],
  'email2': [
    { owner_uid: 1, title: `lorem2 ipsum2`, body: `salor velim orisp vuju 2` }
  ],
};

app.get(`/get-user-posts`, (request, response) => {

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

  return response.status(200).json({ message: `Demo app service: users`, data: dataByUserEmail[you.email] });

});



const PORT = 8082;
app.listen(PORT, (l, e) => {
  console.log({ l, e });
  console.log(`listening to port ${PORT}...`);
});