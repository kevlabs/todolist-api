import { Router } from 'express';
import DB from '../lib/db';
import taskModel from '../models/tasks.model';
import reminderModel from '../models/reminders.model';

export default function(db: DB) {

  const router = Router();

  router.route('/')
    // get all tasks
    .get(async (req, res) => {
      try {
        const tasks = await taskModel.getAllTasks(db.query);
        res.json(tasks);

      } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Failed to retrieve tasks' });
      }

    })

    // create new task
    .post(async (req, res) => {
      try {
        const task = await db.transaction(async (query) => {

          const task = await taskModel.createTask(query, req.body);

          // set up default reminder if due in more than 5 mins
          const fiveMinutes = 1000 * 60 * 5;
          if (task.dueAt - Date.now() > fiveMinutes) {
            const reminderInput = {
              taskId: task.id,
              notes: `Your task ${task.name} is almost due.`,
              dueAt: new Date(task.dueAt.getTime() - fiveMinutes)
            }

            await reminderModel.createReminder(query, reminderInput);
          }

          return task;

        });
        // const task = await taskModel.createTask(db.query, req.body);

        res.json(task);

      } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Failed to create task' });
      }

    });
  
  router.route('/:id')
    // get task by id
    .get(async (req, res) => {
      try {
        const task = await taskModel.getTaskById(db.query, parseInt(req.params.id));
        res.json(task);

      } catch (err) {
        console.log(err);
        res.status(400).send({ error: 'Failed to retrieve task' });
      }

    })

    // update task
    .put(async (req, res) => {
      try {
        const task = await db.transaction(async (query) => {

          // update task
          const task = await taskModel.updateTask(query, { ...req.body, id: parseInt(req.params.id) });

          // if task status changed to completed, update reminders
          req.body[status] === 'Completed' && await reminderModel.updateRemindersByTaskId(query, task.id, { status: 'Cancelled' });

          return task;
        });

        res.json(task);

      } catch (err) {
        console.log('Error', err);
        res.status(400).send({ error: 'Failed to update task' });
      }

    })

    // delete task
    .delete(async (req, res) => {
      try {
        const task = await db.transaction(async (query) => {
          // delete task
          const task = await taskModel.deleteTask(db.query, parseInt(req.params.id));

          // delete reminders
          await reminderModel.deleteRemindersByTaskId(query, task.id);

          return task;

        });

        res.json(task);

      } catch (err) {
        console.log('Error', err);
        res.status(400).send({ error: 'Failed to delete task' });
      }

    });
    
  // get all reminders for task
  router.get('/:id/reminders', async (req, res) => {
    try {
      const reminders = await reminderModel.getAllRemindersByTaskId(db.query, parseInt(req.params.id));
      res.json(reminders);

    } catch (err) {
      console.log(err);
      res.status(400).send({ error: 'Failed to retrieve reminders for task' });
    }

  });

  

  return router;

}