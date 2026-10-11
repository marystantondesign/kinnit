import { saveOccasion, type OccasionData } from "./occasionStorage";
import { savePlan, type PlanData } from "./planStorage";
import { saveReminder } from "./reminderStorage";
import { addNote } from "./noteStore";
import { logActivity, logReminderActivity } from "./notificationStore";
import type { DraftItem, DraftPerson } from "./voiceParser";

/** Fired after Talk to Kinnit saves items, so open pages can refresh. */
export const DATA_CHANGED_EVENT = "kinnit:data-changed";

const YOU = { id: "you", name: "You", initials: "YO" };

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function personRef(p: DraftPerson) {
  return { id: p.id ?? `name:${p.name.toLowerCase()}`, name: p.name, initials: initials(p.name) };
}

/** Creates the given (checked) draft items, linking reminders to occasions created alongside them. */
export function commitDraftItems(items: DraftItem[]) {
  const stamp = Date.now();
  const now = new Date().toISOString();
  const occasionIds = new Map<string, string>();

  // Occasions first so reminders can link to them.
  items
    .filter((i) => i.type === "occasion")
    .forEach((item, n) => {
      const id = `occasion-${stamp}-${n}`;
      const occasion: OccasionData = {
        id,
        title: item.title,
        type: item.occasionType ?? "Other",
        people: item.people.map(personRef),
        status: "active",
        timing: { mode: "single", singleDate: item.date },
        context: {},
        recurring: false,
        relatedPlanIds: [],
        createdAt: now,
        updatedAt: now,
      };
      saveOccasion(occasion);
      occasionIds.set(item.key, id);
      logActivity("occasion", `Added ${item.title}`);
    });

  items.forEach((item, n) => {
    if (item.type === "reminder") {
      const linkedId = item.linkedOccasionKey ? occasionIds.get(item.linkedOccasionKey) : undefined;
      saveReminder({
        id: `voice-reminder-${stamp}-${n}`,
        action: item.title,
        date: item.date ?? "",
        notes: linkedId ? `Linked to ${item.linkedOccasionTitle}` : undefined,
        recurrence: "once",
        createdAt: now,
        linkedOccasionId: linkedId,
      });
      logReminderActivity("Added", item.title);
    }

    if (item.type === "plan") {
      const people = item.people.map(personRef);
      const plan: PlanData = {
        id: `new-plan-${stamp}-${n}`,
        title: item.title,
        status: "active",
        linkedOccasionIds: [],
        leader: YOU,
        planFor: item.people.map((p) => p.name).join(" and ") || "Group",
        participants: [YOU, ...people],
        organizers: [YOU],
        timing: { mode: "single", singleDate: item.date },
        createdAt: now,
        updatedAt: now,
      };
      savePlan(plan);
      logActivity("plan", `Created ${item.title}`);
    }

    if (item.type === "note") {
      const person = item.people[0];
      if (!person) return;
      addNote(personRef(person).id, item.title);
      logActivity("private-note", `Added a private note about ${person.name}`);
    }
  });

  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}
