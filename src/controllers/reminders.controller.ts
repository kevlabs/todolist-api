import { Router } from 'express';
import { accessControl } from '../lib/utils'
import DB from '../lib/db';
import reminderModel from '../models/reminders.model';
import taskModel from 'src/models/tasks.model';

export default function(db: DB) {

  const router = Router();

  // all reminders route are protected
  router.use(accessControl);

  router.route('/')
    // get all current reminders
    .get(async (req, res) => {
      try {
        const reminders = await reminderModel.getAllReminders(db.query, req.session.userId);
        res.json(reminders);

      } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Failed to retrieve reminders' });
      }

    })

    // create new reminder
    .post(async (req, res) => {
      try {
        const reminder = await db.transaction(async (query) => {
          // check that task belongs to user
          const task = await taskModel.getTaskById(query, req.body.taskId, req.session.userId);

          // abort transaction if no task found
          if (!task) throw Error('Invalid reminder');

          // create task
          return await reminderModel.createReminder(db.query, req.body);

        });

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
        const reminder = await reminderModel.getReminderById(db.query, parseInt(req.params.id), req.session.userId);
        res.json(reminder);

      } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Failed to retrieve reminder' });
      }

    })

    // update reminder
    .put(async (req, res) => {
      try {
        const reminder = await reminderModel.updateReminder(db.query, { ...req.body, id: parseInt(req.params.id) }, req.session.userId);
        res.json(reminder);

      } catch (err) {
        console.log('Error', err);
        res.status(400).send({ error: 'Failed to update reminder' });
      }

    })

    // delete reminder
    .delete(async (req, res) => {
      try {
        const reminder = await reminderModel.deleteReminder(db.query, parseInt(req.params.id), req.session.userId);
        res.json(reminder);

      } catch (err) {
        console.log('Error', err);
        res.status(400).send({ error: 'Failed to delete reminder' });
      }

    });

  

  return router;

}