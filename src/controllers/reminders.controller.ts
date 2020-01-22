import { Router } from 'express';
import DB from '../lib/db';
import taskModel from '../models/tasks.model';
import reminderModel from '../models/reminders.model';

export default function(db: DB) {

  const router = Router();

  router.route('/')
    // get all current reminders
    .get(async (req, res) => {
      try {
        const reminders = await reminderModel.getAllReminders(db.query);
        res.json(reminders);

      } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Failed to retrieve reminders' });
      }

    })

    // create new reminder
    .post(async (req, res) => {
      try {
        const reminder = await reminderModel.createReminder(db.query, req.body);
        res.json(reminder);

      } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Failed to create reminder' });
      }

    });
  
  router.route('/:id')
    // get reminder by id
    .get(async (req, res) => {
      try {
        const reminder = await reminderModel.getReminderById(db.query, parseInt(req.params.id));
        res.json(reminder);

      } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Failed to retrieve reminder' });
      }

    })

    // update reminder
    .put(async (req, res) => {
      try {
        const reminder = await reminderModel.updateReminder(db.query, { ...req.body, id: parseInt(req.params.id) });
        res.json(reminder);

      } catch (err) {
        console.log('Error', err);
        res.status(400).send({ error: 'Failed to update reminder' });
      }

    })

    // delete reminder
    .delete(async (req, res) => {
      try {
        const reminder = await reminderModel.deleteReminder(db.query, parseInt(req.params.id));
        res.json(reminder);

      } catch (err) {
        console.log('Error', err);
        res.status(400).send({ error: 'Failed to delete reminder' });
      }

    });

  

  return router;

}