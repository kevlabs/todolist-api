// import schedule from 'node-schedule';
import { ParsedFullReminder, ParsedReminderUser, getAllRemindersDueBy, updateReminder } from '../models/reminders.model';
import DB from '../lib/db';
import Email from '../lib/email';

// uses setTimeout to schedule individual reminders. Overdue reminders will be sent immediately
function setUpReminder(db: DB, email: Email, reminder: ParsedFullReminder & ParsedReminderUser) {
  setTimeout(async () => {
    try {
      // EDGE CASE: task is completed or deleted before the reminder is sent

      console.log('Attempting to send reminder');

      // send reminder
      await email.send(
        { name: reminder.username, address: reminder.email },
        `Reminder for to-do: ${reminder.taskName}`,
        `Dear ${reminder.username},\n\nYou have asked to be reminder about task: ${reminder.taskName}\nTask description: ${reminder.taskDescription}\nTask due at: ${reminder.taskDueAt}\nNotes: ${reminder.notes}\n\nThank you using to-do-list,\n\nCheers`,
      )

      // update status to sent
      await updateReminder(db.query, { id: reminder.id, status: 'Sent' });

    } catch (err) {
      console.log('Could not send reminder', err)
    }

  }, Math.min((reminder.dueAt).getTime() - Date.now(), 0));
}

async function sendReminders(db: DB, email: Email, frequencyMS: number) {
  try {

    console.log(`Getting reminder jobs to execute by ${new Date(Date.now() + frequencyMS)}`);

    // get all reminders that must be sent in next frequencyMS milliseconds
    const reminders: (ParsedFullReminder & ParsedReminderUser)[] = await getAllRemindersDueBy(db.query, new Date(Date.now() + frequencyMS));

    // set up timeout for each reminder
    reminders.forEach(reminder => setUpReminder(db, email, reminder));

    console.log('Reminders to set up', reminders);

  } catch (err) {
    console.log(err);
  }
}

// frequency is in minutes
export default function (db: DB, email: Email, frequency: number) {
  const frequencyMS = 1000 * 60 * frequency;

  setInterval(
    () => sendReminders(db, email, frequencyMS),
    frequencyMS,
  );
}