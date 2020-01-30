// tslint:disable: import-name

// load .env data into process.env
import { config } from 'dotenv';
config();

import express from 'express';
import path from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieSession from 'cookie-session';
import DB from './lib/db';
import Email from './lib/email';
import { dbParams, emailParams } from './lib/config-vars';
import taskRouter from './controllers/tasks.controller';
import reminderRouter from './controllers/reminders.controller';
import sendReminders from './jobs/send-reminders.job';


// server config
const ENV = process.env.ENV || 'development';
const PORT = parseInt(process.env.PORT || '8080', 10);
process.env.TZ = process.env.TZ  || 'America/Toronto'

// instantiate db and email
const db = new DB(dbParams);
const email = new Email(emailParams);

// start reminder job - check every min for dev purposes
sendReminders(db, email, 1);

// instantiate app/server
const app = express();

// use morgan in dev only
(ENV === 'development') && app.use(morgan('dev'));

// register middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({ name: 'session', keys: ['Coolstuffgoesonhere'], maxAge: 365 * 24 * 60 * 60 * 1000 }),)

// register routes
app.use('/api/tasks', taskRouter(db));
app.use('/api/reminders', reminderRouter(db));

// dummy login for dev
app.get('/api/login/:id', async (req, res) => {
  req.session!.userId = parseInt(req.params.id, 10);
  res.send(`Logged in as user: ${req.session!.userId}`);
});

// serve static files in public/
app.use(express.static(path.join(__dirname, 'public')));

// start listening
app.listen(PORT, () => console.log(`To do list listening on port ${PORT}`));