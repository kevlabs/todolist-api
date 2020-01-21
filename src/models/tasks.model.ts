import { snakeCase } from 'snake-case';
import DB from '../lib/db';
import { ModelSchema, getRequiredColumns, validate, parseSQLResult, parseSQLResultOne, parseSQLQueryColumns } from '../lib/model';

const tasks: ModelSchema = {
  id: { validator: Number.isInteger },
  name: { validator: (val: any) => typeof val === 'string' && val.length <= 255, required: true },
  description: { validator: (val: any) => typeof val === 'string', required: true },
  createdAt: { validator: Number.isInteger },
  dueAt: { validator: Number.isInteger, required: true },
  status: { validator: (val: any) => ['Started', 'Not started', 'Completed', 'Inactive'].includes(val) },
};

export async function getAll(query: DB['query']): Promise<Record<string, any>[]> {

  const tasks = await query(
    `SELECT name, description, due_at, status
    FROM tasks
    ORDER BY due_at ASC`,
    []
  );

  return parseSQLResult(tasks, ['name', 'description', 'dueAt', 'status']);

}

export async function getById(query: DB['query'], id: number): Promise<Record<string, any>> {

  if (!id || !Number.isInteger(id)) throw Error('Cannot find a task without a valid task id');

  const tasks = await query(
    `SELECT name, description, due_at, status
    FROM tasks
    WHERE id = $1`,
    [id]
  );

  return parseSQLResultOne(tasks, ['name', 'description', 'dueAt', 'status']);

}

export async function create(query: DB['query'], input: Record<string, any>): Promise<Record<string, any>> {
  // input is restricted to required fields
  const safeInput = validate(input, getRequiredColumns(tasks));

  const task = await query(
    `INSERT INTO tasks (name, description, due_at)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [safeInput.name, safeInput.description, safeInput.dueAt],
  );

  const parsedTask = parseSQLResultOne(task, ['name', 'description', 'dueAt', 'status'])

  if (!parsedTask) throw Error('Task could not be created');

  return parsedTask;
}

export async function update(query: DB['query'], input: Record<string, any>): Promise<Record<string, any>> {
  // can only update required fields + status
  const { id: taskId, ...safeInput } = validate(input, { ...getRequiredColumns(tasks), id: tasks.id, status: tasks.status }, false);

  if (!taskId || !Number.isInteger(taskId)) throw Error('Cannot update task without a valid task id');

  const { names, values, params, nextParamIndex } = parseSQLQueryColumns(safeInput);

  // if nothing to update return empty array
  if (params.length) return [];

  const task = await query(
    `UPDATE tasks
    SET ${names} = ${values}
    WHERE id = $${nextParamIndex}
    RETURNING *`,
    [...params, taskId],
  );

  const parsedTask = parseSQLResultOne(task, ['name', 'description', 'dueAt', 'status']);

  if (!parsedTask) throw Error('Task could not be updated');

  return parsedTask;
}

export default {
  create,
  getAll,
  getById,
  update
};