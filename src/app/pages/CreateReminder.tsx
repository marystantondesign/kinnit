import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PersonPicker } from "../components/PersonPicker";
import { logReminderActivity } from "../utils/notificationStore";

const TIMING_OPTIONS = [
  { value: "day-of",      label: "Day of" },
  { value: "day-before",  label: "Day before" },
  { value: "week-before", label: "Week before" },
  { value: "custom",      label: "Custom date" },
];

const RECURRENCE_OPTIONS = [
  { value: "once",    label: "Once" },
  { value: "weekly",  label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly",  label: "Yearly" },
];

export function CreateReminder() {
  const navigate = useNavigate();

  const [action, setAction] = useState("");
  const [personId, setPersonId] = useState<string | null>(null);
  const [timing, setTiming] = useState<string>("");
  const [customDate, setCustomDate] = useState("");
  const [recurrence, setRecurrence] = useState<string>("once");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production this would persist the reminder; for now navigate back.
    if (action.trim()) logReminderActivity("Added", action.trim());
    navigate("/app/reminders");
  };

  return (
    <div className="p-8">
      <div className="mb-2">
        <Link to="/app/reminders" className="text-sm text-gray-500 hover:text-gray-700">
          ← Reminders
        </Link>
      </div>

      <h1 className="mb-1">New reminder</h1>
      <p className="text-sm text-gray-500 mb-6">
        Care Reminders are personal prompts to support or celebrate someone — different from Occasions or Plans.
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">

        {/* Action */}
        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">What do you want to remember to do?</h2>
          <input
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="e.g., Send a birthday card, Check in after the appointment…"
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300"
            required
          />
        </section>

        {/* Person */}
        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">Who is this for?</h2>
          <PersonPicker value={personId} onChange={setPersonId} />
        </section>

        {/* Timing */}
        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">When should we remind you?</h2>
          <div className="flex flex-wrap gap-2">
            {TIMING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTiming(opt.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  timing === opt.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {timing === "custom" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="mt-3 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-300"
            />
          )}
        </section>

        {/* Recurrence */}
        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">Does this repeat?</h2>
          <div className="flex flex-wrap gap-2">
            {RECURRENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRecurrence(opt.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  recurrence === opt.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">Notes (optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything helpful to remember when this reminder fires…"
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm placeholder:text-gray-400 resize-none focus:outline-none focus:border-gray-300"
          />
        </section>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            className="px-6 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors"
          >
            Save reminder
          </button>
          <Link
            to="/app/reminders"
            className="px-6 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
