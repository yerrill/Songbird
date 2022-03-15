FROM node:16 AS SB

WORKDIR /song

COPY package*.json ./

RUN npm i

COPY . .

RUN npm install typescript -g

RUN tsc

CMD ["node", "./dist/index.js"]
