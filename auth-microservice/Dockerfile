FROM node:14

WORKDIR /app

RUN ls -al

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=8080

EXPOSE 8080

CMD ["npm", "run", "start"]
