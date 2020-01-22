// import schedule from 'node-schedule';
import { getAllRemindersDueBy, updateReminder } from '../models/reminders.model';
import DB from '../lib/db';

interface ReminderInterface {
  id: number;
  notes: string;
  dueAt: Date;
  status: 'Pending' | 'Sent';
  taskId: number;
  taskName: string;
  taskDesciption: string;
  taskDueAt: Date;
}

function setUpReminder(db: DB, reminder: ReminderInterface) {
  setTimeout(async () => {
    try {
      // edge case: task is completed or deleted before the reminder is sent

      // send reminder
      console.log(reminder.notes);

      // update status to sent
      await updateReminder(db.query, { id: reminder.id, status: 'Sent' });

    } catch (err) {
      console.log('Could not send reminder', err)
    }

  }, (reminder.dueAt as Date).getTime() - Date.now());
}

async function sendReminders(db: DB, frequencyMS: number) {
  try {

    // get all reminders that must be sent in next frequencyMS milliseconds
    const reminders: ReminderInterface[] = await getAllRemindersDueBy(db.query, new Date(Date.now() + frequencyMS)) as ReminderInterface[];

    // set up timeout for each reminder
    reminders.forEach(reminder => setUpReminder(db, reminder));

  } catch (err) {
    console.log(err);
  }
}

// frequency is in minutes
export default function (db: DB, frequency: number) {
  const frequencyMS = 1000 * 60 * frequency;

  setInterval(
    () => sendReminders(db, frequencyMS),
    frequencyMS,
  );
}