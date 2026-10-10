import { Link } from "react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ReminderModal } from "../components/ReminderModal";

interface Reminder {
  id: string;
  action: string;
  person: string;
  personId: string;
  timing: string;
  linkedOccasion?: {
    id: string;
    title: string;
  };
  status: "upcoming" | "completed";
  recurring: boolean;
}

const mockReminders: Reminder[] = [
  {
    id: "1",
    action: "Send birthday card",
    person: "Sarah Johnson",
    personId: "1",
    timing: "April 10",
    linkedOccasion: { id: "1", title: "Sarah's Birthday" },
    status: "upcoming",
    recurring: true,
  },
  {
    id: "2",
    action: "Check in weekly",
    person: "Emma Davis",
    personId: "3",
    timing: "During recovery",
    linkedOccasion: { id: "2", title: "Emma's Surgery" },
    status: "upcoming",
    recurring: false,
  },
  {
    id: "3",
    action: "Memorial anniversary reminder",
    person: "Family",
    personId: "family",
    timing: "June 5",
    linkedOccasion: { id: "3", title: "Grandmother Memorial Anniversary" },
    status: "upcoming",
    recurring: true,
  },
  {
    id: "4",
    action: "Send congratulations card",
    person: "Michael Chen",
    personId: "2",
    timing: "After graduation",
    status: "upcoming",
    recurring: false,
  },
  {
    id: "5",
    action: "Confirm travel plans",
    person: "Group",
    personId: "group",
    timing: "November 15",
    linkedOccasion: { id: "5", title: "Group Trip to Mexico" },
    status: "upcoming",
    recurring: false,
  },
];

export function RemindersIndex() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "recurring" | "completed">("all");
  const [reminderOpen, setReminderOpen] = useState(false);

  // Filter logic
  const filteredReminders = mockReminders.filter((reminder) => {
    const matchesSearch =
      reminder.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.linkedOccasion?.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "upcoming" && reminder.status === "upcoming") ||
      (activeFilter === "recurring" && reminder.recurring) ||
      (activeFilter === "completed" && reminder.status === "completed");

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="px-6 py-8 md:px-8">
      <ReminderModal open={reminderOpen} onClose={() => setReminderOpen(false)} />

      <div className="flex items-center justify-between mb-6">
        <h1>Reminders</h1>
        <button
          type="button"
          onClick={() => setReminderOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
        >
          <Plus size={15} />
          New Reminder
        </button>
      </div>
      
      <p className="mb-6 text-gray-600">
        Care Reminders help you remember personal actions to support or celebrate someone. They are different from Occasions (meaningful life events) and Plans (collaborative coordination spaces).
      </p>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Search by person, action, or linked occasion..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded"
        />
        
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mb-0.5 scrollbar-none">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1 text-sm rounded ${
              activeFilter === "all" ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("upcoming")}
            className={`px-3 py-1 text-sm rounded ${
              activeFilter === "upcoming" ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveFilter("recurring")}
            className={`px-3 py-1 text-sm rounded ${
              activeFilter === "recurring" ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Recurring
          </button>
          <button
            onClick={() => setActiveFilter("completed")}
            className={`px-3 py-1 text-sm rounded ${
              activeFilter === "completed" ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredReminders.map((reminder) => (
          <Link
            key={reminder.id}
            to={`/app/reminders/${reminder.id}`}
            className="block p-4 border border-gray-200 rounded hover:bg-gray-50"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="font-medium mb-1">{reminder.action}</div>
                <div className="text-sm text-gray-600">
                  {reminder.person} • {reminder.timing}
                </div>
                {reminder.linkedOccasion && (
                  <div className="text-xs text-gray-400 mt-1">
                    Linked to: {reminder.linkedOccasion.title}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 capitalize px-2 py-1 bg-gray-100 rounded">
                {reminder.status}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}