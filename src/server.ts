// tslint:disable: import-name

// load .env data into process.env
import { config } from 'dotenv';
config();

import express from 'express';
import path from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';
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

// start reminder job
sendReminders(db, email, 1);

// instantiate app/server
const app = express();

// use morgan in dev only
(ENV === 'development') && app.use(morgan('dev'));

// register middlewares
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


app.use('/api/tasks', taskRouter(db));
app.use('/api/reminders', reminderRouter(db));

// serve static files in public/
app.use(express.static(path.join(__dirname, 'public')));

// start listening
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));