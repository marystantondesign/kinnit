import { useParams, Link } from "react-router";

interface ReminderData {
  id: string;
  action: string;
  person: {
    id: string;
    name: string;
    initials: string;
  };
  timing: string;
  notes: string;
  linkedOccasion?: {
    id: string;
    title: string;
  };
  status: "upcoming" | "completed";
  createdDate: string;
}

const mockParticipants = {
  "1": { id: "1", name: "Sarah Johnson", initials: "SJ" },
  "2": { id: "2", name: "Michael Chen", initials: "MC" },
  "3": { id: "3", name: "Emma Davis", initials: "ED" },
  family: { id: "family", name: "Family", initials: "FM" },
  group: { id: "group", name: "Group", initials: "GP" },
  "5": { id: "5", name: "Lisa Anderson", initials: "LA" },
  "6": { id: "6", name: "James Wilson", initials: "JW" },
  "9": { id: "9", name: "Priya Patel", initials: "PP" },
  mom: { id: "mom", name: "Mom", initials: "MO" },
};

const mockReminders: Record<string, ReminderData> = {
  "1": {
    id: "1",
    action: "Send birthday card",
    person: mockParticipants["1"],
    timing: "April 10",
    notes: "Remember to get a card from the local shop she likes. Include a personal note about our last conversation.",
    linkedOccasion: { id: "1", title: "Sarah's Birthday" },
    status: "upcoming",
    createdDate: "March 5, 2026",
  },
  "2": {
    id: "2",
    action: "Check in weekly",
    person: mockParticipants["3"],
    timing: "During recovery",
    notes: "Send a text or quick call every week to see how Emma is doing. Ask if she needs anything from the store.",
    linkedOccasion: { id: "2", title: "Emma's Surgery" },
    status: "upcoming",
    createdDate: "March 10, 2026",
  },
  "3": {
    id: "3",
    action: "Memorial anniversary reminder",
    person: mockParticipants.family,
    timing: "June 5",
    notes: "Reminder to attend the memorial gathering at the park. Bring flowers if possible.",
    linkedOccasion: { id: "3", title: "Grandmother Memorial Anniversary" },
    status: "upcoming",
    createdDate: "May 1, 2026",
  },
  "4": {
    id: "4",
    action: "Send congratulations card",
    person: mockParticipants["2"],
    timing: "After graduation",
    notes: "Michael mentioned his graduation is coming up. Send a card and maybe a small gift.",
    status: "upcoming",
    createdDate: "February 20, 2026",
  },
  "5": {
    id: "5",
    action: "Confirm travel plans",
    person: mockParticipants.group,
    timing: "November 15",
    notes: "Follow up with everyone to confirm final headcount and flight details before booking accommodations.",
    linkedOccasion: { id: "5", title: "Group Trip to Mexico" },
    status: "upcoming",
    createdDate: "October 10, 2026",
  },
  "6": {
    id: "6",
    action: "Call James about the trip",
    person: mockParticipants["6"],
    timing: "Oct 14",
    notes: "Ask about dates and whether he still wants to drive.",
    status: "upcoming",
    createdDate: "October 1, 2026",
  },
  "7": {
    id: "7",
    action: "Gift for Priya",
    person: mockParticipants["9"],
    timing: "Oct 28",
    notes: "She mentioned wanting a pottery class.",
    status: "upcoming",
    createdDate: "October 2, 2026",
  },
  "8": {
    id: "8",
    action: "Thank-you note to Lisa",
    person: mockParticipants["5"],
    timing: "Oct 6",
    notes: "For hosting the book club.",
    status: "completed",
    createdDate: "September 28, 2026",
  },
  "9": {
    id: "9",
    action: "Call Mom",
    person: mockParticipants.mom,
    timing: "Sundays, 9:00 AM",
    notes: "Weekly catch-up call.",
    status: "upcoming",
    createdDate: "September 1, 2026",
  },
};

export function ReminderDetail() {
  const { reminderId } = useParams();
  const reminder = reminderId ? mockReminders[reminderId] : undefined;

  if (!reminder) {
    return (
      <div className="p-8">
        <Link to="/app/reminders" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Reminders
        </Link>
        <h1>Reminder not found</h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to="/app/reminders"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Reminders
        </Link>
      </div>

      <h1 className="mb-6">{reminder.action}</h1>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3">Person</h2>
          <Link
            to={reminder.person.id !== "family" && reminder.person.id !== "group" ? `/app/people/${reminder.person.id}` : "#"}
            className={`flex items-center gap-3 p-4 border border-gray-200 rounded ${
              reminder.person.id !== "family" && reminder.person.id !== "group" ? "hover:bg-gray-50" : ""
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
              {reminder.person.initials}
            </div>
            <div className="font-medium">{reminder.person.name}</div>
          </Link>
        </section>

        <section>
          <h2 className="mb-3">Timing</h2>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-gray-700">{reminder.timing}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3">Notes</h2>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-gray-700">{reminder.notes}</p>
          </div>
        </section>

        {reminder.linkedOccasion && (
          <section>
            <h2 className="mb-3">Linked Occasion</h2>
            <Link
              to={`/app/occasions/${reminder.linkedOccasion.id}`}
              className="block border border-gray-200 rounded p-4 hover:bg-gray-50"
            >
              <div className="font-medium">{reminder.linkedOccasion.title}</div>
              <p className="text-sm text-gray-500 mt-1">
                View the full occasion details
              </p>
            </Link>
          </section>
        )}

        <section>
          <h2 className="mb-3">Status</h2>
          <div className="border border-gray-200 rounded p-4">
            <div className="flex items-center gap-2">
              <span className="capitalize text-gray-700">{reminder.status}</span>
              <span className="text-sm text-gray-500">• Created {reminder.createdDate}</span>
            </div>
          </div>
        </section>

        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            Placeholder for actions: Mark as complete, Edit reminder, Delete reminder
          </p>
        </div>
      </div>
    </div>
  );
}
