import { Link, useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { savePlan } from "../utils/planStorage";
import { logActivity } from "../utils/notificationStore";
import { linkPlanToOccasion } from "../utils/linkingUtils";
import { getAllCreatedOccasions } from "../utils/occasionStorage";

const mockPeople = [
  { id: "1", name: "Sarah Johnson" },
  { id: "2", name: "Michael Chen" },
  { id: "3", name: "Emma Davis" },
  { id: "4", name: "Alex Chen" },
  { id: "5", name: "Jordan Smith" },
];

const mockOccasions = [
  { id: "1", title: "Sarah's Birthday" },
  { id: "2", title: "Emma's Surgery" },
  { id: "3", title: "Grandmother Memorial Anniversary" },
  { id: "4", title: "Alex and Jordan Anniversary" },
  { id: "5", title: "Group Trip to Mexico" },
];

interface InitialTask {
  id: string;
  title: string;
  assigneeId?: string;
}

interface TimelineEntry {
  id: string;
  content: string;
  date?: string;
}

interface Note {
  id: string;
  content: string;
}

interface LogisticEntry {
  id: string;
  label: string;
  content: string;
}

type PlanTemplate = "gathering" | "trip" | "support" | "simple" | "blank";

type TimingMode = "single" | "range" | "recurring";
type RecurrencePattern = "weekly" | "monthly" | "yearly";

interface PlanTiming {
  mode: TimingMode;
  singleDate?: string;
  startDate?: string;
  endDate?: string;
  recurrencePattern?: RecurrencePattern;
}

const templateOptions = [
  {
    id: "gathering" as PlanTemplate,
    title: "Gathering or Event",
    description: "Used for celebrations, dinners, parties, or memorial gatherings.",
  },
  {
    id: "trip" as PlanTemplate,
    title: "Trip or Travel",
    description: "Used for coordinating group travel logistics.",
  },
  {
    id: "support" as PlanTemplate,
    title: "Support or Care",
    description: "Used for organizing help during illness, recovery, grief, or major life events.",
  },
  {
    id: "simple" as PlanTemplate,
    title: "Simple Coordination",
    description: "Used for small plans such as meeting up or sending something together.",
  },
  {
    id: "blank" as PlanTemplate,
    title: "Blank Plan",
    description: "Start with an empty planning workspace.",
  },
];

export function CreatePlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateFromUrl = searchParams.get("template") as PlanTemplate | null;
  const occasionIdFromUrl = searchParams.get("occasionId");
  const occasionTitleFromUrl = searchParams.get("occasionTitle");
  const dateFromUrl = searchParams.get("date") ?? "";
  
  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(templateFromUrl);
  const [title, setTitle] = useState(occasionTitleFromUrl || "");
  const [description, setDescription] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState(occasionIdFromUrl || "");
  const [initialTasks, setInitialTasks] = useState<InitialTask[]>([]);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  // Timing state
  const [timingMode, setTimingMode] = useState<TimingMode | "">(dateFromUrl ? "single" : "");
  const [singleDate, setSingleDate] = useState(dateFromUrl);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | "">("");

  // Timeline state
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [showAddTimelineForm, setShowAddTimelineForm] = useState(false);
  const [newTimelineContent, setNewTimelineContent] = useState("");
  const [newTimelineDate, setNewTimelineDate] = useState("");

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  // Logistics state
  const [logistics, setLogistics] = useState<LogisticEntry[]>([]);
  const [showAddLogisticForm, setShowAddLogisticForm] = useState(false);
  const [newLogisticLabel, setNewLogisticLabel] = useState("");
  const [newLogisticContent, setNewLogisticContent] = useState("");

  // Set template from URL parameter on mount
  useEffect(() => {
    if (templateFromUrl) {
      setSelectedTemplate(templateFromUrl);
    }
  }, [templateFromUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would create the plan via API with initial tasks and template
    // For now, navigate to a mock plan detail page
    const newPlanId = "new-plan-" + Date.now();
    
    // Create the new plan data structure
    const newPlanData = {
      id: newPlanId,
      title: title,
      description: description || undefined,
      status: "draft" as const,
      linkedOccasion: selectedOccasion ? mockOccasions.find(o => o.id === selectedOccasion) : undefined,
      leader: { id: "you", name: "You", initials: "YO" },
      planFor: "You",
      participants: [
        { id: "you", name: "You", initials: "YO" },
        ...selectedParticipants.map(id => {
          const person = mockPeople.find(p => p.id === id);
          if (!person) return null;
          // Generate initials from name
          const initials = person.name.split(' ').map(n => n[0]).join('').toUpperCase();
          return { id: person.id, name: person.name, initials };
        }).filter(Boolean)
      ],
      organizers: [{ id: "you", name: "You", initials: "YO" }],
      template: selectedTemplate,
      timing: {
        mode: timingMode as TimingMode,
        singleDate: timingMode === "single" ? singleDate : undefined,
        startDate: timingMode === "range" ? startDate : undefined,
        endDate: timingMode === "range" ? endDate : undefined,
        recurrencePattern: timingMode === "recurring" ? recurrencePattern : undefined,
      },
    };
    
    // Store the new plan data in sessionStorage
    savePlan(newPlanData);
    logActivity("plan", `Created ${title}`);
    
    // Add to the list of created plans
    const existingPlansJson = sessionStorage.getItem('created-plans');
    const existingPlans = existingPlansJson ? JSON.parse(existingPlansJson) : [];
    existingPlans.push(newPlanId);
    sessionStorage.setItem('created-plans', JSON.stringify(existingPlans));
    
    // Store initial tasks in sessionStorage to simulate passing them to the new plan
    if (initialTasks.length > 0) {
      sessionStorage.setItem(`plan-${newPlanId}-initial-tasks`, JSON.stringify(initialTasks));
    }
    
    // Store timeline entries
    if (timelineEntries.length > 0) {
      sessionStorage.setItem(`plan-${newPlanId}-timeline`, JSON.stringify(timelineEntries));
    }
    
    // Store notes
    if (notes.length > 0) {
      sessionStorage.setItem(`plan-${newPlanId}-notes`, JSON.stringify(notes));
    }
    
    // Store logistics
    if (logistics.length > 0) {
      sessionStorage.setItem(`plan-${newPlanId}-logistics`, JSON.stringify(logistics));
    }
    
    // Link the plan to the occasion if selected
    if (selectedOccasion) {
      linkPlanToOccasion(newPlanId, selectedOccasion);
    }
    
    // Navigate to the plan detail page or return to the occasion if we came from there
    if (occasionIdFromUrl) {
      navigate(`/app/occasions/${occasionIdFromUrl}`);
    } else {
      navigate(`/app/plans/${newPlanId}`);
    }
  };

  const toggleParticipant = (personId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: InitialTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      assigneeId: newTaskAssignee || undefined,
    };

    setInitialTasks([...initialTasks, newTask]);
    setNewTaskTitle("");
    setNewTaskAssignee("");
    setShowAddTaskForm(false);
  };

  const removeTask = (taskId: string) => {
    setInitialTasks(initialTasks.filter(task => task.id !== taskId));
  };

  // Template selection view
  if (!selectedTemplate) {
    return (
      <div className="p-8">
        <Link to="/app/plans" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Plans
        </Link>

        <h1 className="mb-6">Create New Plan</h1>

        <div className="max-w-2xl">
          <p className="text-gray-600 mb-6">
            Choose a template to get started. Templates help structure your plan, but you can customize everything later.
          </p>

          <div className="space-y-3">
            {templateOptions.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className="w-full text-left p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">{template.title}</div>
                <div className="text-sm text-gray-600">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Plan creation form view
  return (
    <div className="p-8">
      <Link
        to="/app/plans"
        className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Plans
      </Link>

      <h1 className="mb-6">Create New Plan</h1>

      <div className="max-w-2xl">
        <p className="text-gray-600 mb-6">
          Set up a collaborative coordination workspace for organizing logistics around an occasion or shared experience.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="border border-gray-200 rounded p-4">
            <h2 className="mb-3">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm text-gray-600 mb-1">
                  Plan Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Birthday Dinner Planning"
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Timing
                </label>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="timingMode"
                        value="single"
                        checked={timingMode === "single"}
                        onChange={(e) => setTimingMode(e.target.value as TimingMode)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Single Date</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="timingMode"
                        value="range"
                        checked={timingMode === "range"}
                        onChange={(e) => setTimingMode(e.target.value as TimingMode)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Date Range</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="timingMode"
                        value="recurring"
                        checked={timingMode === "recurring"}
                        onChange={(e) => setTimingMode(e.target.value as TimingMode)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Recurring</span>
                    </label>
                  </div>

                  {timingMode === "single" && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={singleDate}
                        onChange={(e) => setSingleDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded"
                      />
                    </div>
                  )}

                  {timingMode === "range" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded"
                        />
                      </div>
                    </div>
                  )}

                  {timingMode === "recurring" && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Recurrence Pattern</label>
                      <select
                        value={recurrencePattern}
                        onChange={(e) => setRecurrencePattern(e.target.value as RecurrencePattern)}
                        className="w-full px-3 py-2 border border-gray-200 rounded"
                      >
                        <option value="">Select pattern...</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm text-gray-600 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add context about what this plan is for..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                />
              </div>
            </div>
          </section>

          <section className="border border-gray-200 rounded p-4">
            <h2 className="mb-3">Participants</h2>
            <p className="text-sm text-gray-600 mb-3">
              Add people from your network who will collaborate on this plan
            </p>
            <div className="space-y-2">
              {mockPeople.map((person) => (
                <label key={person.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(person.id)}
                    onChange={() => toggleParticipant(person.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{person.name}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="border border-gray-200 rounded p-4">
            <h2 className="mb-3">Related Occasion</h2>
            <p className="text-sm text-gray-600 mb-3">
              Link this plan to an existing occasion, or leave unlinked for standalone coordination
            </p>
            <select
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded"
            >
              <option value="">No related occasion</option>
              {mockOccasions.map((occasion) => (
                <option key={occasion.id} value={occasion.id}>
                  {occasion.title}
                </option>
              ))}
            </select>
          </section>

          <section className="border border-gray-200 rounded p-4">
            <h2 className="mb-3">Initial Tasks</h2>
            <p className="text-sm text-gray-600 mb-3">
              Add tasks that will appear in the plan workspace after creation
            </p>

            {initialTasks.length > 0 && (
              <div className="space-y-2 mb-4">
                {initialTasks.map((task) => {
                  const assignee = mockPeople.find(p => p.id === task.assigneeId);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded"
                    >
                      <div>
                        <div className="text-sm text-gray-900">{task.title}</div>
                        {assignee && (
                          <div className="text-xs text-gray-600 mt-1">
                            Assigned to {assignee.name}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {showAddTaskForm && (
              <div className="bg-white p-4 border border-gray-300 rounded mb-3 space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Task Title</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Assign to Participant (optional)
                  </label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Unassigned</option>
                    {selectedParticipants.map((participantId) => {
                      const person = mockPeople.find(p => p.id === participantId);
                      return person ? (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ) : null;
                    })}
                  </select>
                  {selectedParticipants.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Add participants above to assign tasks
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Add Task
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTaskForm(false);
                      setNewTaskTitle("");
                      setNewTaskAssignee("");
                    }}
                    className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!showAddTaskForm && (
              <button
                type="button"
                onClick={() => setShowAddTaskForm(true)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                + Add Task
              </button>
            )}
          </section>

          <section className="border border-gray-200 rounded p-4">
            <h2 className="mb-3">Timeline</h2>
            <p className="text-sm text-gray-600 mb-3">
              Add important preparation steps or milestones
            </p>

            {timelineEntries.length > 0 && (
              <div className="space-y-2 mb-4">
                {timelineEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded"
                  >
                    <div>
                      <div className="text-sm text-gray-900">{entry.content}</div>
                      {entry.date && (
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTimelineEntries(timelineEntries.filter(e => e.id !== entry.id))}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddTimelineForm && (
              <div className="bg-white p-4 border border-gray-300 rounded mb-3 space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Entry</label>
                  <input
                    type="text"
                    value={newTimelineContent}
                    onChange={(e) => setNewTimelineContent(e.target.value)}
                    placeholder="e.g., Send invitations"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date (optional)</label>
                  <input
                    type="date"
                    value={newTimelineDate}
                    onChange={(e) => setNewTimelineDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTimelineContent.trim()) return;
                      const newEntry: TimelineEntry = {
                        id: Date.now().toString(),
                        content: newTimelineContent,
                        date: newTimelineDate || undefined,
                      };
                      setTimelineEntries([...timelineEntries, newEntry]);
                      setNewTimelineContent("");
                      setNewTimelineDate("");
                      setShowAddTimelineForm(false);
                    }}
                    disabled={!newTimelineContent.trim()}
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Add Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTimelineForm(false);
                      setNewTimelineContent("");
                      setNewTimelineDate("");
                    }}
                    className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!showAddTimelineForm && (
              <button
                type="button"
                onClick={() => setShowAddTimelineForm(true)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                + Add Entry
              </button>
            )}
          </section>

          <section className="border border-gray-200 rounded p-4">
            <h2 className="mb-3">Notes</h2>
            <p className="text-sm text-gray-600 mb-3">
              Add freeform ideas, updates, or planning context
            </p>

            {notes.length > 0 && (
              <div className="space-y-2 mb-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start justify-between p-3 bg-gray-50 border border-gray-200 rounded"
                  >
                    <div className="text-sm text-gray-900 whitespace-pre-wrap flex-1">{note.content}</div>
                    <button
                      type="button"
                      onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                      className="text-sm text-gray-500 hover:text-gray-700 ml-3"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddNoteForm && (
              <div className="bg-white p-4 border border-gray-300 rounded mb-3 space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Note</label>
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Enter note content"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newNoteContent.trim()) return;
                      const newNote: Note = {
                        id: Date.now().toString(),
                        content: newNoteContent,
                      };
                      setNotes([...notes, newNote]);
                      setNewNoteContent("");
                      setShowAddNoteForm(false);
                    }}
                    disabled={!newNoteContent.trim()}
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Add Note
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddNoteForm(false);
                      setNewNoteContent("");
                    }}
                    className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!showAddNoteForm && (
              <button
                type="button"
                onClick={() => setShowAddNoteForm(true)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                + Add Note
              </button>
            )}
          </section>

          <section className="border border-gray-200 rounded p-4">
            <h2 className="mb-3">Logistics</h2>
            <p className="text-sm text-gray-600 mb-3">
              Add practical details such as location, time, transportation, or reservations
            </p>

            {logistics.length > 0 && (
              <div className="space-y-2 mb-4">
                {logistics.map((logistic) => (
                  <div
                    key={logistic.id}
                    className="flex items-start justify-between p-3 bg-gray-50 border border-gray-200 rounded"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{logistic.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{logistic.content}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLogistics(logistics.filter(l => l.id !== logistic.id))}
                      className="text-sm text-gray-500 hover:text-gray-700 ml-3"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddLogisticForm && (
              <div className="bg-white p-4 border border-gray-300 rounded mb-3 space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Type</label>
                  <select
                    value={newLogisticLabel}
                    onChange={(e) => setNewLogisticLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Select type...</option>
                    <option value="Location">Location</option>
                    <option value="Time">Time</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Reservations">Reservations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    {newLogisticLabel === "Location" && "Address or venue"}
                    {newLogisticLabel === "Time" && "Date and time"}
                    {newLogisticLabel === "Transportation" && "Transportation details"}
                    {newLogisticLabel === "Reservations" && "Reservation details"}
                    {!newLogisticLabel && "Details"}
                  </label>
                  {newLogisticLabel === "Time" ? (
                    <input
                      type="datetime-local"
                      value={newLogisticContent}
                      onChange={(e) => setNewLogisticContent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  ) : (
                    <input
                      type="text"
                      value={newLogisticContent}
                      onChange={(e) => setNewLogisticContent(e.target.value)}
                      placeholder={
                        newLogisticLabel === "Location" ? "e.g., 123 Main St, City, State" :
                        newLogisticLabel === "Transportation" ? "e.g., Meet at parking lot, carpooling from..." :
                        newLogisticLabel === "Reservations" ? "e.g., Confirmed under Smith, confirmation #12345" :
                        "Enter details"
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newLogisticLabel.trim() || !newLogisticContent.trim()) return;
                      const newLogistic: LogisticEntry = {
                        id: Date.now().toString(),
                        label: newLogisticLabel,
                        content: newLogisticContent,
                      };
                      setLogistics([...logistics, newLogistic]);
                      setNewLogisticLabel("");
                      setNewLogisticContent("");
                      setShowAddLogisticForm(false);
                    }}
                    disabled={!newLogisticLabel.trim() || !newLogisticContent.trim()}
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Add Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddLogisticForm(false);
                      setNewLogisticLabel("");
                      setNewLogisticContent("");
                    }}
                    className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!showAddLogisticForm && (
              <button
                type="button"
                onClick={() => setShowAddLogisticForm(true)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                + Add Entry
              </button>
            )}
          </section>

          <div className="flex gap-3 pt-4">
            <button 
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              Create Plan
            </button>
            <Link
              to="/app/plans"
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
