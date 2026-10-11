import { saveOccasion, type OccasionData } from "./occasionStorage";
import { savePlan, type PlanData } from "./planStorage";
import { saveReminder } from "./reminderStorage";
import { addNote } from "./noteStore";
import { logActivity, logReminderActivity } from "./notificationStore";
import { sendPlanInvitation } from "./invitationStore";
import { findPerson, displayName } from "./peopleDirectory";
import type { DraftItem } from "./talkClient";
import type { TalkPerson } from "../../shared/talk";

/** Fired after Talk to Kinnit saves items, so open pages can refresh. */
export const DATA_CHANGED_EVENT = "kinnit:data-changed";

const USER_NAME = "Mary";
const YOU = { id: "you", name: "You", initials: "YO" };

/** A draft item as the user confirmed it in the review step. */
export interface ConfirmedItem extends DraftItem {
  /** Plans: send invitations to the "with" people who are in People */
  sendInvites: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function personRef(p: TalkPerson) {
  const known = findPerson(p.name);
  return known
    ? { id: known.id, name: known.name, initials: initials(known.name) }
    : { id: `name:${p.name.toLowerCase()}`, name: p.name, initials: initials(p.name) };
}

const titleKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Creates the confirmed items, linking them to each other and to existing records. */
export function commitDraftItems(items: ConfirmedItem[]) {
  const stamp = Date.now();
  const now = new Date().toISOString();
  const newOccasions = new Map<string, OccasionData>(); // by title key

  // Occasions first, so plans and reminders can link to them.
  items
    .filter((i) => i.type === "occasion")
    .forEach((item, n) => {
      const occasion: OccasionData = {
        id: `occasion-${stamp}-${n}`,
        title: item.title,
        type: /birthday/i.test(item.title) ? "Birthday" : /anniversary/i.test(item.title) ? "Anniversary" : "Other",
        people: item.people.map(personRef),
        status: "active",
        timing: { mode: "single", singleDate: item.date ?? undefined },
        context: {},
        recurring: item.recurrence === "yearly",
        relatedPlanIds: [],
        createdAt: now,
        updatedAt: now,
      };
      saveOccasion(occasion);
      newOccasions.set(titleKey(item.title), occasion);
      logActivity("occasion", `Added ${item.title}`);
    });

  const linkedOccasionId = (item: DraftItem) => {
    if (item.linkedTo?.kind !== "occasion") return undefined;
    return item.linkedTo.id ?? newOccasions.get(titleKey(item.linkedTo.title))?.id;
  };

  items.forEach((item, n) => {
    if (item.type === "reminder") {
      const linkedId = linkedOccasionId(item);
      const notes = [item.detail, item.linkedTo ? `Linked to ${item.linkedTo.title}` : null].filter(Boolean).join("\n");
      saveReminder({
        id: `voice-reminder-${stamp}-${n}`,
        action: item.title,
        date: item.date ?? "",
        notes: notes || undefined,
        recurrence: "once",
        createdAt: now,
        linkedOccasionId: linkedId,
      });
      logReminderActivity("Added", item.title);
    }

    if (item.type === "plan") {
      const planId = `new-plan-${stamp}-${n}`;
      const withPeople = item.people.filter((p) => p.role === "with");
      const forPeople = item.people.filter((p) => p.role === "for");
      const occasionId = linkedOccasionId(item);
      const plan: PlanData = {
        id: planId,
        title: item.title,
        description: item.detail ?? undefined,
        status: "active",
        linkedOccasionIds: occasionId ? [occasionId] : [],
        leader: YOU,
        planFor: forPeople.map((p) => p.name).join(" and ") || "Group",
        participants: [YOU, ...withPeople.map(personRef)],
        organizers: [YOU],
        timing: { mode: "single", singleDate: item.date ?? undefined },
        createdAt: now,
        updatedAt: now,
      };
      savePlan(plan);
      logActivity("plan", `Created ${item.title}`);

      // Point a newly created occasion back at its plan.
      const created = [...newOccasions.values()].find((o) => o.id === occasionId);
      if (created) {
        created.relatedPlanIds = [...created.relatedPlanIds, planId];
        saveOccasion(created);
      }

      if (item.sendInvites) {
        withPeople
          .filter((p) => p.inPeople && findPerson(p.name))
          .forEach((p) => {
            const person = findPerson(p.name)!;
            sendPlanInvitation({
              planId,
              planName: item.title,
              toPersonId: person.id,
              toName: person.name,
              inviterName: USER_NAME,
            });
            logActivity("plan-invitation", `Invited ${person.firstName} to ${item.title}`);
          });
      }
    }

    if (item.type === "note") {
      const person = item.people.find((p) => p.role === "about") ?? item.people[0];
      if (!person) return;
      addNote(personRef(person).id, item.title);
      logActivity("private-note", `Added a private note about ${displayName(person.name)}`);
    }
  });

  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}
