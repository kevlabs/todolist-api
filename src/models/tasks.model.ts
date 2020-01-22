import DB from '../lib/db';
import { ModelSchema, getRequiredColumns, validate, parseSQLResult, parseSQLResultOne, parseSQLQueryColumns } from '../lib/model';

const taskSchema: ModelSchema = {
  id: { validator: Number.isInteger },
  name: { validator: (val: any) => typeof val === 'string' && val.length <= 255, required: true },
  description: { validator: (val: any) => typeof val === 'string', required: true },
  createdAt: { validator: Number.isInteger },
  dueAt: { validator: Number.isInteger, required: true },
  status: { validator: (val: any) => ['Started', 'Not started', 'Completed', 'Inactive', 'Overdue'].includes(val) },
  isDeleted: { validator: (val: any) => typeof val === 'boolean' },
};

export async function getAllTasks(query: DB['query']): Promise<Record<string, any>[]> {

  const tasks = await query(
    `SELECT id, name, description, due_at, status
    FROM tasks
    WHERE status <> 'Completed' AND is_deleted = FALSE
    ORDER BY due_at ASC`,
    []
  );

  return parseSQLResult(tasks, ['id', 'name', 'description', 'dueAt', 'status']);

}

export async function getTaskById(query: DB['query'], id: number): Promise<Record<string, any>> {

  validate({ id }, { id: taskSchema.id });

  const task = await query(
    `SELECT id, name, description, due_at, status
    FROM tasks
    WHERE id = $1 AND is_deleted = FALSE`,
    [id]
  );

  return parseSQLResultOne(task, ['id', 'name', 'description', 'dueAt', 'status']);

}

export async function createTask(query: DB['query'], input: Record<string, any>): Promise<Record<string, any>> {
  // input is restricted to required fields
  const safeInput = validate(input, getRequiredColumns(taskSchema));
  const { names, values, params } = parseSQLQueryColumns(safeInput);

  const task = await query(
    `INSERT INTO tasks ${names}
    VALUES ${values}
    RETURNING *`,
    params,
  );

  const parsedTask = parseSQLResultOne(task, ['id', 'name', 'description', 'dueAt', 'status'])

  if (!parsedTask) throw Error('Task could not be created');

  return parsedTask;
}

export async function updateTask(query: DB['query'], input: Record<string, any>): Promise<Record<string, any>> {
  // can only update required fields + status - use deleteTask to delete
  const { id: taskId, ...safeInput } = validate(input, { ...getRequiredColumns(taskSchema), id: taskSchema.id, status: taskSchema.status }, false);

  if (!taskId) throw Error('Cannot update task without a valid task id');

  const { names, values, params, nextParamIndex } = parseSQLQueryColumns(safeInput);

  // if nothing to update return empty array
  if (!params.length) return [];

  const task = await query(
    `UPDATE tasks
    SET ${names} = ${values}
    WHERE id = $${nextParamIndex} AND is_deleted = FALSE
    RETURNING *`,
    [...params, taskId],
  );

  const parsedTask = parseSQLResultOne(task, ['id', 'name', 'description', 'dueAt', 'status']);

  if (!parsedTask) throw Error('Task could not be updated');

  return parsedTask;
}

export async function deleteTask(query: DB['query'], id: number): Promise<Record<string, any>> {
  validate({ id }, { id: taskSchema.id });

  const task = await query(
    `UPDATE tasks
    SET is_deleted = TRUE
    WHERE id = $1 AND is_deleted = FALSE
    RETURNING *`,
    [id],
  );

  const parsedTask = parseSQLResultOne(task, ['id', 'name', 'description', 'dueAt', 'status']);

  if (!parsedTask) throw Error('Task could not be deleted');

  return parsedTask;
}

export default {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask
};