import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";

interface Participant {
  id: string;
  name: string;
  initials: string;
  role?: string;
}

interface Task {
  id: string;
  title: string;
  assignee?: Participant;
  dueDate?: string;
  completed: boolean;
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

interface PlanData {
  id: string;
  title: string;
  description?: string;
  status: "active" | "completed" | "draft";
  linkedOccasion?: {
    id: string;
    title: string;
  };
  leader: Participant;
  planFor: string;
  participants: Participant[];
  organizers: Participant[];
}

const mockParticipants: Record<string, Participant> = {
  you: { id: "you", name: "You", initials: "YO" },
  sarah: { id: "1", name: "Sarah Johnson", initials: "SJ" },
  michael: { id: "2", name: "Michael Chen", initials: "MC" },
  emma: { id: "3", name: "Emma Davis", initials: "ED" },
  emily: { id: "7", name: "Emily Parker", initials: "EP" },
  james: { id: "6", name: "James Wilson", initials: "JW" },
  lisa: { id: "5", name: "Lisa Anderson", initials: "LA" },
};

// Mock data - in a real app, this would come from a database
const mockPlans: Record<string, PlanData> = {
  "1": {
    id: "1",
    title: "Birthday Dinner Planning",
    description: "Coordinating a special birthday dinner celebration for Sarah at her favorite restaurant.",
    status: "active",
    linkedOccasion: { id: "1", title: "Sarah's Birthday" },
    leader: mockParticipants.you,
    planFor: "Sarah Johnson",
    participants: [mockParticipants.you, mockParticipants.michael],
    organizers: [mockParticipants.you],
  },
  "4": {
    id: "4",
    title: "Recovery Support Schedule",
    description: "Organizing meal deliveries, visits, and support during Emma's post-surgery recovery period.",
    status: "active",
    linkedOccasion: { id: "2", title: "Emma's Surgery" },
    leader: mockParticipants.you,
    planFor: "Emma Davis",
    participants: [mockParticipants.you, mockParticipants.sarah, mockParticipants.michael],
    organizers: [mockParticipants.you],
  },
  "5": {
    id: "5",
    title: "Mexico Trip Planning",
    description: "Group vacation to Tulum - planning accommodations, activities, and travel logistics.",
    status: "draft",
    linkedOccasion: { id: "5", title: "Group Trip to Mexico" },
    leader: mockParticipants.michael,
    planFor: "Group",
    participants: [mockParticipants.you, mockParticipants.michael, mockParticipants.sarah, mockParticipants.emma],
    organizers: [mockParticipants.michael, mockParticipants.you],
  },
  "weekend-crew": {
    id: "weekend-crew",
    title: "Weekend crew",
    description: "Emily's standing weekend hangouts — brunch, hikes, and whatever comes up.",
    status: "active",
    leader: mockParticipants.emily,
    planFor: "Group",
    participants: [mockParticipants.emily, mockParticipants.sarah, mockParticipants.you],
    organizers: [mockParticipants.emily],
  },
  "6": {
    id: "6",
    title: "Lake House Weekend prep",
    description: "Groceries, carpools, and who brings what for the lake house.",
    status: "active",
    leader: mockParticipants.you,
    planFor: "Group",
    participants: [mockParticipants.you, mockParticipants.james, mockParticipants.lisa],
    organizers: [mockParticipants.you],
  },
  "holiday-kickoff": {
    id: "holiday-kickoff",
    title: "Holiday Planning Kickoff",
    description: "First pass at dates, hosts, and the gift exchange.",
    status: "draft",
    leader: mockParticipants.you,
    planFor: "Family",
    participants: [mockParticipants.you, mockParticipants.michael],
    organizers: [mockParticipants.you],
  },
};

// All available occasions for linking
const allOccasions = [
  { id: "1", title: "Sarah's Birthday", type: "Birthday" },
  { id: "2", title: "Emma's Surgery", type: "Illness or Recovery" },
  { id: "3", title: "Grandmother Memorial Anniversary", type: "Loss or Grief" },
  { id: "4", title: "Alex and Jordan Anniversary", type: "Anniversary" },
  { id: "5", title: "Group Trip to Mexico", type: "Trip or Travel" },
];

// All available people to add as participants
const allPeople = [
  { id: "1", name: "Sarah Johnson" },
  { id: "2", name: "Michael Chen" },
  { id: "3", name: "Emma Davis" },
  { id: "4", name: "Alex Chen" },
  { id: "5", name: "Jordan Smith" },
];

export function PlanDetail() {
  const { planId } = useParams();
  const [showLinkOccasionModal, setShowLinkOccasionModal] = useState(false);
  const [showEditParticipantsModal, setShowEditParticipantsModal] = useState(false);
  const [plan, setPlan] = useState<PlanData | undefined>(planId ? mockPlans[planId] : undefined);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Make restaurant reservation",
      assignee: mockParticipants.you,
      dueDate: "2026-03-15",
      completed: true,
    },
    {
      id: "2",
      title: "Order birthday cake",
      assignee: mockParticipants.michael,
      dueDate: "2026-03-18",
      completed: false,
    },
    {
      id: "3",
      title: "Coordinate group arrival time",
      completed: false,
    },
  ]);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskAssignee, setEditTaskAssignee] = useState<string>("");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Timeline state
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [showAddTimelineForm, setShowAddTimelineForm] = useState(false);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [newTimelineContent, setNewTimelineContent] = useState("");
  const [newTimelineDate, setNewTimelineDate] = useState("");
  const [editTimelineContent, setEditTimelineContent] = useState("");
  const [editTimelineDate, setEditTimelineDate] = useState("");

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");

  // Logistics state
  const [logistics, setLogistics] = useState<LogisticEntry[]>([]);
  const [showAddLogisticForm, setShowAddLogisticForm] = useState(false);
  const [editingLogisticId, setEditingLogisticId] = useState<string | null>(null);
  const [newLogisticLabel, setNewLogisticLabel] = useState("");
  const [newLogisticContent, setNewLogisticContent] = useState("");
  const [editLogisticLabel, setEditLogisticLabel] = useState("");
  const [editLogisticContent, setEditLogisticContent] = useState("");

  // Load plan data and initial tasks from sessionStorage if this is a newly created plan
  useEffect(() => {
    if (planId && planId.startsWith('new-plan-')) {
      // Load plan data from central storage
      const storedPlanData = sessionStorage.getItem(`plan-${planId}`);
      if (storedPlanData) {
        try {
          const planData = JSON.parse(storedPlanData);
          setPlan(planData);
        } catch (e) {
          console.error('Failed to load plan data', e);
        }
      }

      // Load initial tasks
      const storedTasks = sessionStorage.getItem(`plan-${planId}-initial-tasks`);
      if (storedTasks) {
        try {
          const initialTasks = JSON.parse(storedTasks);
          // Convert stored task format to Task format
          const convertedTasks: Task[] = initialTasks.map((task: any) => ({
            id: task.id,
            title: task.title,
            assignee: task.assigneeId ? Object.values(mockParticipants).find((p: any) => p.id === task.assigneeId) : undefined,
            completed: false,
          }));
          setTasks(convertedTasks);
          // Clear the storage after loading
          sessionStorage.removeItem(`plan-${planId}-initial-tasks`);
        } catch (e) {
          console.error('Failed to load initial tasks', e);
        }
      } else {
        // New plan without initial tasks
        setTasks([]);
      }

      // Load timeline entries
      const storedTimeline = sessionStorage.getItem(`plan-${planId}-timeline`);
      if (storedTimeline) {
        try {
          const timelineData = JSON.parse(storedTimeline);
          setTimelineEntries(timelineData);
          sessionStorage.removeItem(`plan-${planId}-timeline`);
        } catch (e) {
          console.error('Failed to load timeline', e);
        }
      }

      // Load notes
      const storedNotes = sessionStorage.getItem(`plan-${planId}-notes`);
      if (storedNotes) {
        try {
          const notesData = JSON.parse(storedNotes);
          setNotes(notesData);
          sessionStorage.removeItem(`plan-${planId}-notes`);
        } catch (e) {
          console.error('Failed to load notes', e);
        }
      }

      // Load logistics
      const storedLogistics = sessionStorage.getItem(`plan-${planId}-logistics`);
      if (storedLogistics) {
        try {
          const logisticsData = JSON.parse(storedLogistics);
          setLogistics(logisticsData);
          sessionStorage.removeItem(`plan-${planId}-logistics`);
        } catch (e) {
          console.error('Failed to load logistics', e);
        }
      }
    }
  }, [planId]);

  if (!plan) {
    return (
      <div className="p-8">
        <Link to="/app/plans" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Plans
        </Link>
        <h1>Plan not found</h1>
      </div>
    );
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      assignee: newTaskAssignee ? plan.participants.find(p => p.id === newTaskAssignee) : undefined,
      dueDate: newTaskDueDate || undefined,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
    setNewTaskAssignee("");
    setNewTaskDueDate("");
    setShowAddTaskForm(false);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTaskId(taskId);
      setEditTaskTitle(task.title);
      setEditTaskAssignee(task.assignee?.id || "");
      setEditTaskDueDate(task.dueDate || "");
    }
  };

  const handleSaveTaskEdit = () => {
    if (!editTaskTitle.trim()) return;

    setTasks(tasks.map(task => 
      task.id === editingTaskId ? { ...task, title: editTaskTitle, assignee: editTaskAssignee ? plan.participants.find(p => p.id === editTaskAssignee) : undefined, dueDate: editTaskDueDate || undefined } : task
    ));
    setEditingTaskId(null);
    setEditTaskTitle("");
    setEditTaskAssignee("");
    setEditTaskDueDate("");
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const handleLinkOccasion = (occasionId: string) => {
    const occasion = allOccasions.find(o => o.id === occasionId);
    if (occasion && plan) {
      setPlan({
        ...plan,
        linkedOccasion: { id: occasion.id, title: occasion.title }
      });
      setShowLinkOccasionModal(false);
    }
  };

  const handleRemoveOccasion = () => {
    if (plan && confirm("Are you sure you want to unlink this occasion?")) {
      setPlan({
        ...plan,
        linkedOccasion: undefined
      });
    }
  };

  const handleAddParticipant = (personId: string) => {
    const person = allPeople.find(p => p.id === personId);
    if (person && plan) {
      const initials = person.name.split(' ').map(n => n[0]).join('').toUpperCase();
      const newParticipant: Participant = {
        id: person.id,
        name: person.name,
        initials: initials
      };
      setPlan({
        ...plan,
        participants: [...plan.participants, newParticipant]
      });
      setShowEditParticipantsModal(false);
    }
  };

  const handleRemoveParticipant = (participantId: string) => {
    if (plan && plan.participants.length > 1 && confirm("Are you sure you want to remove this participant?")) {
      setPlan({
        ...plan,
        participants: plan.participants.filter(p => p.id !== participantId)
      });
    } else if (plan && plan.participants.length === 1) {
      alert("Cannot remove the last participant from the plan.");
    }
  };

  return (
    <div className="p-8">
      <Link to="/app/plans" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
        ← Back to Plans
      </Link>

      <h1 className="mb-6">{plan.title}</h1>

      <div className="space-y-6">
        {/* PLAN OVERVIEW */}
        <section>
          <h2 className="mb-3">Plan Overview</h2>
          <div className="border border-gray-200 rounded p-4 space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Description</div>
              {plan.description ? (
                <p className="text-gray-900">{plan.description}</p>
              ) : (
                <p className="text-gray-400 italic">No description provided</p>
              )}
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Plan Organizer</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                  {plan.leader.initials}
                </div>
                <span>{plan.leader.name}</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Participants</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {plan.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-2 px-3 py-1 border border-gray-200 rounded group"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                      {participant.initials}
                    </div>
                    <span className="text-sm">{participant.name}</span>
                    {plan.participants.length > 1 && (
                      <button
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="ml-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove participant"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowEditParticipantsModal(true)}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                + Add Participant
              </button>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Related Occasion</div>
              {plan.linkedOccasion ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={`/app/occasions/${plan.linkedOccasion.id}`}
                    className="text-sm text-gray-900 hover:underline"
                  >
                    {plan.linkedOccasion.title}
                  </Link>
                  <button
                    onClick={() => setShowLinkOccasionModal(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Change
                  </button>
                  <button
                    onClick={handleRemoveOccasion}
                    className="text-sm text-gray-600 hover:text-red-600 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLinkOccasionModal(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  + Link to Occasion
                </button>
              )}
            </div>
          </div>
        </section>

        {/* COORDINATION SECTIONS */}
        <section>
          <h2 className="mb-3">Tasks</h2>
          <div className="border border-gray-200 rounded p-4">
            {showAddTaskForm && (
              <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
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
                  <label className="block text-sm text-gray-700 mb-1">Assignee (optional)</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Unassigned</option>
                    {plan.participants.map(participant => (
                      <option key={participant.id} value={participant.id}>{participant.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Due Date (optional)</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Task
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTaskForm(false);
                      setNewTaskTitle("");
                      setNewTaskAssignee("");
                      setNewTaskDueDate("");
                    }}
                    className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 border border-gray-200 rounded ${
                      task.completed ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        {task.assignee && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                              {task.assignee.initials}
                            </div>
                            <span className="text-xs text-gray-600">{task.assignee.name}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-gray-600">
                            Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditTask(task.id)}
                      className="px-2 py-1 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-2 py-1 bg-red-200 text-red-600 hover:bg-red-300 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                No tasks yet. Add tasks to break down the work needed for this plan.
              </p>
            )}

            {!showAddTaskForm && (
              <button
                onClick={() => setShowAddTaskForm(true)}
                className="mt-4 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                + Add Task
              </button>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3">Timeline</h2>
          <div className="border border-gray-200 rounded p-4">
            {showAddTimelineForm && (
              <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Content</label>
                  <input
                    type="text"
                    value={newTimelineContent}
                    onChange={(e) => setNewTimelineContent(e.target.value)}
                    placeholder="Enter content"
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
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
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
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Entry
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTimelineForm(false);
                      setNewTimelineContent("");
                      setNewTimelineDate("");
                    }}
                    className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {timelineEntries.length > 0 ? (
              <div className="space-y-3">
                {timelineEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900">
                        {entry.content}
                      </div>
                      {entry.date && (
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-600">
                            {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEditingTimelineId(entry.id);
                        setEditTimelineContent(entry.content);
                        setEditTimelineDate(entry.date || "");
                      }}
                      className="px-2 py-1 text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this entry?")) {
                          setTimelineEntries(timelineEntries.filter(e => e.id !== entry.id));
                        }
                      }}
                      className="px-2 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                No timeline entries yet. Add entries to schedule important preparation steps or milestones.
              </p>
            )}

            {!showAddTimelineForm && (
              <button
                onClick={() => setShowAddTimelineForm(true)}
                className="mt-4 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                + Add Entry
              </button>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3">Notes</h2>
          <div className="border border-gray-200 rounded p-4">
            {showAddNoteForm && (
              <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
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
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      const newNote: Note = {
                        id: Date.now().toString(),
                        content: newNoteContent,
                      };
                      setNotes([...notes, newNote]);
                      setNewNoteContent("");
                      setShowAddNoteForm(false);
                    }}
                    disabled={!newNoteContent.trim()}
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Note
                  </button>
                  <button
                    onClick={() => {
                      setShowAddNoteForm(false);
                      setNewNoteContent("");
                    }}
                    className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map(note => (
                  <div
                    key={note.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 whitespace-pre-wrap">
                        {note.content}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setEditNoteContent(note.content);
                      }}
                      className="px-2 py-1 text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this note?")) {
                          setNotes(notes.filter(n => n.id !== note.id));
                        }
                      }}
                      className="px-2 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                No notes yet. Add notes for freeform ideas, updates, or planning context.
              </p>
            )}

            {!showAddNoteForm && (
              <button
                onClick={() => setShowAddNoteForm(true)}
                className="mt-4 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                + Add Note
              </button>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3">Logistics</h2>
          <div className="border border-gray-200 rounded p-4">
            {showAddLogisticForm && (
              <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
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
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
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
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Entry
                  </button>
                  <button
                    onClick={() => {
                      setShowAddLogisticForm(false);
                      setNewLogisticLabel("");
                      setNewLogisticContent("");
                    }}
                    className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {logistics.length > 0 ? (
              <div className="space-y-3">
                {logistics.map(logistic => (
                  <div
                    key={logistic.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {logistic.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {logistic.content}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingLogisticId(logistic.id);
                        setEditLogisticLabel(logistic.label);
                        setEditLogisticContent(logistic.content);
                      }}
                      className="px-2 py-1 text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this entry?")) {
                          setLogistics(logistics.filter(l => l.id !== logistic.id));
                        }
                      }}
                      className="px-2 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                No logistics yet. Add entries for practical information like locations, schedules, or reservations.
              </p>
            )}

            {!showAddLogisticForm && (
              <button
                onClick={() => setShowAddLogisticForm(true)}
                className="mt-4 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                + Add Entry
              </button>
            )}
          </div>
        </section>
      </div>

      {showLinkOccasionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="mb-4">Link Existing Occasion</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select an occasion to connect to this plan. Note: A plan can only be linked to one occasion at a time.
            </p>
            <div className="space-y-2 mb-4">
              {allOccasions.map((occasion) => {
                const isCurrentlyLinked = plan.linkedOccasion?.id === occasion.id;
                return (
                  <button
                    key={occasion.id}
                    onClick={() => handleLinkOccasion(occasion.id)}
                    disabled={isCurrentlyLinked}
                    className={`w-full text-left p-4 border rounded ${
                      isCurrentlyLinked
                        ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">{occasion.title}</div>
                    <div className="text-sm text-gray-500 mt-1">{occasion.type}</div>
                    {isCurrentlyLinked && (
                      <div className="text-sm text-gray-500 mt-1">
                        Currently linked to this plan
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {plan.linkedOccasion && (
              <button
                onClick={handleRemoveOccasion}
                className="w-full px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
              >
                Unlink Occasion
              </button>
            )}
            <button
              onClick={() => setShowLinkOccasionModal(false)}
              className="w-full px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showEditParticipantsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="mb-4">Edit Participants</h2>
            <p className="text-sm text-gray-600 mb-4">
              Add or remove participants from this plan.
            </p>
            <div className="space-y-2 mb-4">
              {allPeople.map((person) => {
                const isParticipant = plan.participants.some(p => p.id === person.id);
                return (
                  <button
                    key={person.id}
                    onClick={() => handleAddParticipant(person.id)}
                    disabled={isParticipant}
                    className={`w-full text-left p-4 border rounded ${
                      isParticipant
                        ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">{person.name}</div>
                    {isParticipant && (
                      <div className="text-sm text-gray-500 mt-1">
                        Already a participant
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {plan.participants.length > 1 && (
              <button
                onClick={() => handleRemoveParticipant(plan.participants[0].id)}
                className="w-full px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
              >
                Remove Participant
              </button>
            )}
            <button
              onClick={() => setShowEditParticipantsModal(false)}
              className="w-full px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="mb-4">Edit Task</h2>
            <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Assignee (optional)</label>
                <select
                  value={editTaskAssignee}
                  onChange={(e) => setEditTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="">Unassigned</option>
                  {plan.participants.map(participant => (
                    <option key={participant.id} value={participant.id}>{participant.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Due Date (optional)</label>
                <input
                  type="date"
                  value={editTaskDueDate}
                  onChange={(e) => setEditTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveTaskEdit}
                  disabled={!editTaskTitle.trim()}
                  className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingTaskId(null);
                    setEditTaskTitle("");
                    setEditTaskAssignee("");
                    setEditTaskDueDate("");
                  }}
                  className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingTimelineId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="mb-4">Edit Timeline Entry</h2>
            <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Content</label>
                <input
                  type="text"
                  value={editTimelineContent}
                  onChange={(e) => setEditTimelineContent(e.target.value)}
                  placeholder="Enter content"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date (optional)</label>
                <input
                  type="date"
                  value={editTimelineDate}
                  onChange={(e) => setEditTimelineDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setTimelineEntries(timelineEntries.map(entry => 
                      entry.id === editingTimelineId ? { ...entry, content: editTimelineContent, date: editTimelineDate || undefined } : entry
                    ));
                    setEditingTimelineId(null);
                    setEditTimelineContent("");
                    setEditTimelineDate("");
                  }}
                  disabled={!editTimelineContent.trim()}
                  className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingTimelineId(null);
                    setEditTimelineContent("");
                    setEditTimelineDate("");
                  }}
                  className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingNoteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="mb-4">Edit Note</h2>
            <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Note</label>
                <textarea
                  value={editNoteContent}
                  onChange={(e) => setEditNoteContent(e.target.value)}
                  placeholder="Enter note content"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setNotes(notes.map(note => 
                      note.id === editingNoteId ? { ...note, content: editNoteContent } : note
                    ));
                    setEditingNoteId(null);
                    setEditNoteContent("");
                  }}
                  disabled={!editNoteContent.trim()}
                  className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingNoteId(null);
                    setEditNoteContent("");
                  }}
                  className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingLogisticId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="mb-4">Edit Logistic Entry</h2>
            <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Label</label>
                <input
                  type="text"
                  value={editLogisticLabel}
                  onChange={(e) => setEditLogisticLabel(e.target.value)}
                  placeholder="Enter label"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Content</label>
                <input
                  type="text"
                  value={editLogisticContent}
                  onChange={(e) => setEditLogisticContent(e.target.value)}
                  placeholder="Enter content"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setLogistics(logistics.map(logistic => 
                      logistic.id === editingLogisticId ? { ...logistic, label: editLogisticLabel, content: editLogisticContent } : logistic
                    ));
                    setEditingLogisticId(null);
                    setEditLogisticLabel("");
                    setEditLogisticContent("");
                  }}
                  disabled={!editLogisticLabel.trim() || !editLogisticContent.trim()}
                  className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingLogisticId(null);
                    setEditLogisticLabel("");
                    setEditLogisticContent("");
                  }}
                  className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}