# OAuth 2 - Demo

Demo on how OAuth 2 works.

<br/>

to start:

- go into each microservice folder and run `npm run start`
- go into the client demo folder and run `npm run start-dev`

<br/>

the `auth-microservice` uses cookie sessions (<a href="https://www.npmjs.com/package/express-session">express-session</a>). The sessions should be kept in a database so each instance can read the same data when scaling up.
the `.env` file has a `DATABASE_URL` key; this should be a `PostgreSQL` connection string.