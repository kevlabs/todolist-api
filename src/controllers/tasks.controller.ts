import { Router } from 'express';
import DB from '../lib/db';
import taskModel from '../models/tasks.model';

export default function(db: DB) {

  const router = Router();

  router.route('/')
    .get(async (req, res) => {
      try {
        const tasks = await taskModel.getAll(db.query);
        res.json(tasks);

      } catch (err) {
        console.log(err);
        res.status(400);
      }

    })

  


  return router;

}