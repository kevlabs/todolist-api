import DB from '../lib/db';
import { ModelSchema, getRequiredColumns, validate, parseSQLResult, parseSQLResultOne, parseSQLQueryColumns } from '../lib/model';
import { isDate } from '../lib/utils';
import { ITask } from './tasks.model';
import { IUser } from './users.model';

export interface IReminder {
  id: number;
  taskId: number;
  notes: string;
  createdAt: Date;
  dueAt: Date;
  status: 'Pending' | 'Sent' | 'Cancelled';
  isDeleted: boolean;
}

export type ParsedReminderUser = {
  username: IUser['username'];
  email: IUser['email'];
}

export type ParsedReminderTask = {
  taskName: ITask['name'];
  taskDescription: ITask['description'];
  taskDueAt: ITask['dueAt'];
}

export type ParsedReminder = Pick<IReminder, 'id' | 'taskId' | 'notes' | 'dueAt' | 'status'>;

export type ParsedFullReminder = ParsedReminder & ParsedReminderTask;

export const reminderSchema: ModelSchema = {
  id: { validator: Number.isInteger },
  taskId: { validator: Number.isInteger, required: true },
  notes: { validator: (val: any) => typeof val === 'string', required: true },
  createdAt: { validator: isDate },
  dueAt: { validator: isDate, required: true },
  status: { validator: (val: any) => ['Pending', 'Sent', 'Cancelled'].includes(val) },
  isDeleted: { validator: (val: any) => typeof val === 'boolean' },
};

// get all current reminders
export async function getAllReminders(query: DB['query'], userId?: number): Promise<(ParsedFullReminder | undefined)[]> {

  const reminders = await query(
    `SELECT t.name as task_name, t.description as task_description, t.due_at as task_due_at, r.id, r.task_id, r.notes, r.due_at, r.status
    FROM reminders as r
    JOIN tasks as t ON r.task_id = t.id
    WHERE r.status = 'Pending' AND r.is_deleted = FALSE
    ${userId ? ' AND t.user_id = $1' : '' }
    ORDER BY r.due_at ASC`,
    userId ? [userId] : [],
  );

  return parseSQLResult(reminders, ['taskId', 'taskName', 'taskDescription', 'taskDueAt', 'id', 'notes', 'dueAt', 'status']) as (ParsedFullReminder | undefined)[];

}

export async function getReminderById(query: DB['query'], id: number, userId?: number): Promise<ParsedFullReminder | undefined> {

  validate({ id }, { id: reminderSchema.id });

  const reminder = await query(
    `SELECT t.name as task_name, t.description as task_description, t.due_at as task_due_at, r.id, r.task_id, r.notes, r.due_at, r.status
    FROM reminders as r
    JOIN tasks as t ON r.task_id = t.id
    WHERE r.id = $1 AND r.is_deleted = FALSE
    ${userId ? ' AND t.user_id = $2' : '' }`,
    userId ? [id, userId] : [id],
  );

  return parseSQLResultOne(reminder, ['taskId', 'taskName', 'taskDescription', 'taskDueAt', 'id', 'notes', 'dueAt', 'status']) as ParsedFullReminder | undefined;

}

// for use by reminder scheduler
export async function getAllRemindersByTaskId(query: DB['query'], taskId: number, userId?: number): Promise<(ParsedFullReminder | undefined)[]> {

  validate({ taskId }, { taskId: reminderSchema.taskId });

  const reminders = await query(
    `SELECT t.name as task_name, t.description as task_description, t.due_at as task_due_at, r.id, r.task_id, r.notes, r.due_at, r.status
    FROM reminders as r
    JOIN tasks as t ON r.task_id = t.id
    WHERE r.task_id = $1 AND r.is_deleted = FALSE
    ${userId ? ' AND t.user_id = $2' : '' }
    ORDER BY t.due_at ASC`,
    userId ? [taskId, userId] : [taskId],
  );

  return parseSQLResult(reminders, ['taskId', 'taskName', 'taskDescription', 'taskDueAt', 'id', 'notes', 'dueAt', 'status']) as (ParsedFullReminder | undefined)[];

}

// query returns some field from the tasks table
export async function getAllRemindersDueBy(query: DB['query'], timestamp: Date, userId?: number): Promise<(ParsedFullReminder & ParsedReminderUser | undefined)[]> {

  const reminders = await query(
    `SELECT u.username, u.email, t.name as task_name, t.description as task_description, t.due_at as task_due_at, r.id, r.task_id, r.notes, r.due_at, r.status
    FROM reminders as r
    JOIN tasks as t ON r.task_id = t.id
    JOIN users as u ON t.user_id = u.id
    WHERE r.due_at <= $1 AND r.status = 'Pending' AND r.is_deleted = FALSE
    ${userId ? ' AND t.user_id = $2' : '' }
    ORDER BY r.due_at ASC`,
    userId ? [timestamp, userId] : [timestamp],
  );

  return parseSQLResult(reminders, ['username', 'email', 'taskId', 'taskName', 'taskDescription', 'taskDueAt', 'id', 'notes', 'dueAt', 'status']) as (ParsedFullReminder & ParsedReminderUser | undefined)[];

}

export async function createReminder(query: DB['query'], input: Record<string, any>): Promise<ParsedReminder> {
  // input is restricted to required fields
  const safeInput = validate(input, getRequiredColumns(reminderSchema));
  const { names, values, params } = parseSQLQueryColumns(safeInput);

  const reminder = await query(
    `INSERT INTO reminders ${names}
    VALUES ${values}
    RETURNING *`,
    params,
  );

  const parsedReminder = parseSQLResultOne(reminder, ['id', 'taskId', 'notes', 'dueAt', 'status']) as ParsedReminder | undefined;

  if (!parsedReminder) throw Error('Reminder could not be created');

  return parsedReminder;
}

export async function updateReminder(query: DB['query'], input: Record<string, any>, userId?: number): Promise<ParsedReminder> {
  // can only update required fields + status - use deleteReminder to delete
  const { id: reminderId, ...safeInput } = validate(input, { ...getRequiredColumns(reminderSchema), id: reminderSchema.id, status: reminderSchema.status }, false);

  if (!reminderId) throw Error('Cannot update reminder without a valid reminder id');

  const { names, values, params, nextParamIndex } = parseSQLQueryColumns(safeInput);

  // if nothing to update return reminder
  if (!params.length) return getReminderById(query, reminderId);

  const reminder = await query(
    `UPDATE reminders
    SET ${names} = ${values}
    WHERE id = $${nextParamIndex} AND is_deleted = FALSE
    ${userId ? ` AND task_id = (SELECT id FROM tasks WHERE user_id = $${nextParamIndex + 1} AND id = task_id)` : '' }
    RETURNING *`,
    userId ? [...params, reminderId, userId] : [...params, reminderId],
  );

  const parsedReminder = parseSQLResultOne(reminder, ['id', 'taskId', 'notes', 'dueAt', 'status']) as ParsedReminder | undefined;

  if (!parsedReminder) throw Error('Reminder could not be updated');

  return parsedReminder;
}

export async function updateRemindersByTaskId(query: DB['query'], taskId: number, input: Record<string, any>): Promise<(ParsedReminder | undefined)[]> {
  // can only update required fields + status - use deleteReminder to delete
  const safeInput = validate(input, { ...getRequiredColumns(reminderSchema), status: reminderSchema.status }, false);

  const { names, values, params, nextParamIndex } = parseSQLQueryColumns(safeInput);

  // if nothing to update return empty array
  if (!params.length) return [];

  const reminders = await query(
    `UPDATE reminders
    SET ${names} = ${values}
    WHERE id IN (SELECT id FROM reminders WHERE task_id = $${nextParamIndex}) AND is_deleted = FALSE
    RETURNING *`,
    [...params, taskId],
  );

  return parseSQLResult(reminders, ['id', 'taskId', 'notes', 'dueAt', 'status']) as (ParsedReminder | undefined)[];
}

export async function deleteReminder(query: DB['query'], id: number, userId?: number): Promise<ParsedReminder> {
  validate({ id }, { id: reminderSchema.id });

  const reminder = await query(
    `UPDATE reminders
    SET is_deleted = TRUE
    WHERE id = $1 AND is_deleted = FALSE${userId ? ` AND task_id = (SELECT id FROM tasks WHERE user_id = $2 AND id = task_id)` : '' }
    RETURNING *`,
    userId ? [id, userId] : [id],
  );

  const parsedReminder = parseSQLResultOne(reminder, ['id', 'taskId', 'notes', 'dueAt', 'status']) as ParsedReminder | undefined;

  if (!parsedReminder) throw Error('Reminder could not be deleted');

  return parsedReminder;
}

export async function deleteRemindersByTaskId(query: DB['query'], taskId: number): Promise<ParsedReminder[]> {
  validate({ taskId }, { taskId: reminderSchema.taskId });

  const reminders = await query(
    `UPDATE reminders
    SET is_deleted = TRUE
    WHERE id IN (SELECT id FROM reminders WHERE task_id = $1) AND is_deleted = FALSE
    RETURNING *`,
    [taskId],
  );

  return parseSQLResult(reminders, ['id', 'taskId', 'notes', 'dueAt', 'status']) as (ParsedReminder | undefined)[];
}

export default {
  reminderSchema,
  createReminder,
  getAllReminders,
  getAllRemindersByTaskId,
  getAllRemindersDueBy,
  getReminderById,
  updateReminder,
  updateRemindersByTaskId,
  deleteReminder,
  deleteRemindersByTaskId
};