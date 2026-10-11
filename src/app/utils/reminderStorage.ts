import type { ItemIconKey } from "../config/itemTypes";

export interface ReminderData {
  id: string;
  action: string;
  /** Situation icon from config/itemTypes (call, text, card, gift) */
  kind?: ItemIconKey<"reminder">;
  /** Person the reminder is about */
  personName?: string;
  completed?: boolean;
  date: string;
  notes?: string;
  recurrence: string;
  createdAt: string;
  /** Occasion this reminder follows up on */
  linkedOccasionId?: string;
}

const REMINDER_IDS_KEY = "created-reminders";

export function saveReminder(reminder: ReminderData): void {
  sessionStorage.setItem(`reminder-${reminder.id}`, JSON.stringify(reminder));

  const storedIds = sessionStorage.getItem(REMINDER_IDS_KEY);
  const ids: string[] = storedIds ? JSON.parse(storedIds) : [];
  if (!ids.includes(reminder.id)) {
    ids.push(reminder.id);
    sessionStorage.setItem(REMINDER_IDS_KEY, JSON.stringify(ids));
  }
}

export function getAllCreatedReminders(): ReminderData[] {
  const storedIds = sessionStorage.getItem(REMINDER_IDS_KEY);
  if (!storedIds) return [];

  const ids: string[] = JSON.parse(storedIds);
  return ids.flatMap((id) => {
    const storedReminder = sessionStorage.getItem(`reminder-${id}`);
    return storedReminder ? [JSON.parse(storedReminder) as ReminderData] : [];
  });
}
