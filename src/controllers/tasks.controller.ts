import { Router } from 'express';
import DB from '../lib/db';
import taskModel from '../models/tasks.model';

export default function(db: DB) {

  const router = Router();

  router.route('/')
    // get all tasks
    .get(async (req, res) => {
      try {
        const tasks = await taskModel.getAll(db.query);
        res.json(tasks);

      } catch (err) {
        console.log(err);
        res.status(400);
      }

    })

    // create new task
    .post(async (req, res) => {
      try {
        const task = await taskModel.create(db.query, req.body);
        res.json(task);

      } catch (err) {
        console.log(err);
        res.status(400);
      }

    });
  
  router.route('/:id')
    // get task by id
    .get(async (req, res) => {
      try {
        const task = await taskModel.getById(db.query, parseInt(req.params.id));
        res.json(task);

      } catch (err) {
        console.log(err);
        res.status(400);
      }

    })

    // update task
    .put(async (req, res) => {
      try {
        const task = await taskModel.update(db.query, { ...req.body, id: parseInt(req.params.id) });
        res.json(task);

      } catch (err) {
        console.log(err);
        res.status(400);
      }

    });

  


  return router;

}