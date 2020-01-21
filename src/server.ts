// tslint:disable: import-name

// load .env data into process.env
import { config } from 'dotenv';
config();

import express from 'express';
import path from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import DB from './lib/db';
import { dbParams } from './lib/config-vars';

// server config
const ENV = process.env.ENV || 'development';
const PORT = parseInt(process.env.PORT || '8080', 10);
process.env.TZ = process.env.TZ  || 'America/Toronto'

// instantiate db and storage
const db = new DB(dbParams);

const app = express();

// use morgan in dev only
(ENV === 'development') && app.use(morgan('dev'));

// register middlewares
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


// hello world
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// serve static files in public/
app.use(express.static(path.join(__dirname, 'public')));

// start listening
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));