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
              dueAt: task.dueAt - fiveMinutes
            }

            await reminderModel.createReminder(query, reminderInput);
          }

          return task;

        })
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
        const task = await taskModel.updateTask(db.query, { ...req.body, id: parseInt(req.params.id) });
        res.json(task);

      } catch (err) {
        console.log('Error', err);
        res.status(400).send({ error: 'Failed to update task' });
      }

    })

    // delete task
    .delete(async (req, res) => {
      try {
        const task = await taskModel.deleteTask(db.query, parseInt(req.params.id));
        // delete reminders

        res.json(task);

      } catch (err) {
        console.log('Error', err);
        res.status(400).send({ error: 'Failed to delete task' });
      }

    });

  

  return router;

}