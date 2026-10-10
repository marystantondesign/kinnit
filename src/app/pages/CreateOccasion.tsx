import { useSearchParams, Link, useNavigate, useParams } from "react-router";
import { useState, useEffect, useRef } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { saveOccasion, getOccasion, type OccasionData } from "../utils/occasionStorage";
import { getAllPlans, getPlan } from "../utils/planStorage";
import { linkPlanToOccasion, removePlanFromOccasion } from "../utils/linkingUtils";

const mockPeople = [
  { id: "1", name: "Sarah Johnson" },
  { id: "2", name: "Michael Chen" },
  { id: "3", name: "Emma Davis" },
  { id: "4", name: "Alex Chen" },
  { id: "5", name: "Jordan Smith" },
];

const occasionTypes = [
  "Birthday",
  "Anniversary",
  "Gathering or Dinner",
  "Trip or Travel",
  "Major Milestone",
  "Breakup or Support",
  "Illness or Recovery",
  "Loss or Grief",
  "Living Will or End-of-Life",
  "Custom Occasion",
];

type TimingMode = "single" | "range" | "ongoing";
const toStoredDate = (date?: Date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromStoredDate = (value: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDisplayDate = (value: string) => {
  if (!value) return "";
  const date = fromStoredDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatRangeDisplay = (start: string, end: string) => {
  if (start && end) return `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`;
  if (start) return `${formatDisplayDate(start)} – Select end date`;
  return "";
};

const getWeekdayLabel = (value: string) => {
  const date = fromStoredDate(value);
  if (!date) return "this day";
  return date.toLocaleDateString("en-US", { weekday: "long" });
};

const getMonthDayLabel = (value: string) => {
  const date = fromStoredDate(value);
  if (!date) return "this date";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
};

export function CreateOccasion() {
  const navigate = useNavigate();
  const { occasionId } = useParams();
  const [searchParams] = useSearchParams();
  const typeFromUrl = searchParams.get("type");
  const dateFromUrl = searchParams.get("date") ?? "";
  
  const isEditing = !!occasionId;
  
  // Form state
  const [title, setTitle] = useState("");
  const [occasionType, setOccasionType] = useState(typeFromUrl || "");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "active">("draft");
  const [timingMode, setTimingMode] = useState<TimingMode>("single");
  const [singleDate, setSingleDate] = useState(dateFromUrl);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showTimingPopover, setShowTimingPopover] = useState(false);
const [rangeDraft, setRangeDraft] = useState<DateRange | undefined>(undefined);
const timingPopoverRef = useRef<HTMLDivElement | null>(null);

const [recurrencePreset, setRecurrencePreset] = useState("daily");
const [showCustomRecurrenceModal, setShowCustomRecurrenceModal] = useState(false);
const [customRepeatEvery, setCustomRepeatEvery] = useState(1);
const [customRepeatUnit, setCustomRepeatUnit] = useState<"day" | "week" | "month" | "year">("week");
const [customEndsMode, setCustomEndsMode] = useState<"never" | "on" | "after">("never");
const [customEndsOnDate, setCustomEndsOnDate] = useState("");
const [customEndsAfterCount, setCustomEndsAfterCount] = useState(10);
  const [showSingleDatePicker, setShowSingleDatePicker] = useState(false);
const [showRangeStartPicker, setShowRangeStartPicker] = useState(false);
const [showRangeEndPicker, setShowRangeEndPicker] = useState(false);
  const [whatShouldPeopleKnow, setWhatShouldPeopleKnow] = useState("");
  const [whatDoesSupportLookLike, setWhatDoesSupportLookLike] = useState("");
  const [recurring, setRecurring] = useState(false);

  // Additional details state (chip-based expansion)
  const [activeChip, setActiveChip] = useState<string | null>(null);
  
  // Do/Don't state
  const [thingsToDo, setThingsToDo] = useState("");
  const [thingsToAvoid, setThingsToAvoid] = useState("");
  
  // Contributions state
  const [contributionsOptions, setContributionsOptions] = useState<string[]>([]);
  const [contributionsOther, setContributionsOther] = useState("");
  
  // Ask from Others state
  const [askFromOthersOptions, setAskFromOthersOptions] = useState<string[]>([]);
  const [askFromOthersOther, setAskFromOthersOther] = useState("");
  const [askFromOthersNotes, setAskFromOthersNotes] = useState("");
  
  // Tone state
  const [tone, setTone] = useState<"low-key" | "celebratory" | "sensitive" | "private" | "">("");
  
  // Media & Links state
  const [mediaLinks, setMediaLinks] = useState<{ title: string; url: string }[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Plans linking state
  const [linkedPlans, setLinkedPlans] = useState<any[]>([]);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [isPeopleDropdownOpen, setIsPeopleDropdownOpen] = useState(false);
  const peopleDropdownRef = useRef<HTMLDivElement | null>(null);

  const removePerson = (personId: string) => {
    setSelectedPeople((prev) => prev.filter((id) => id !== personId));
  };

  const selectedPeopleData = mockPeople.filter((person) =>
    selectedPeople.includes(person.id)
  );

  // Handle click outside for timing popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timingPopoverRef.current &&
        !timingPopoverRef.current.contains(event.target as Node)
      ) {
        setShowTimingPopover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle click outside for people dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        peopleDropdownRef.current &&
        !peopleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPeopleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load existing occasion data if editing
  useEffect(() => {
    // Always load available plans
const allPlans = getAllPlans();
    
    if (isEditing && occasionId) {
      const existingOccasion = getOccasion(occasionId);
      if (existingOccasion) {
        setTitle(existingOccasion.title);
        setOccasionType(existingOccasion.type);
        setSelectedPeople(existingOccasion.people.map(p => p.id));
        setStatus(existingOccasion.status);
        setTimingMode(existingOccasion.timing.mode);
        setSingleDate(existingOccasion.timing.singleDate || "");
        setStartDate(existingOccasion.timing.startDate || "");
        setEndDate(existingOccasion.timing.endDate || "");
        setWhatShouldPeopleKnow(existingOccasion.context.whatShouldPeopleKnow || "");
        setWhatDoesSupportLookLike(existingOccasion.context.whatDoesSupportLookLike || "");
        setRecurring(existingOccasion.recurring);
        
        // Load additional details if they exist
        if (existingOccasion.additionalDetails) {
          const details = existingOccasion.additionalDetails;
          
          if (details.doAndDont) {
            setThingsToDo(details.doAndDont.thingsToDo || "");
            setThingsToAvoid(details.doAndDont.thingsToAvoid || "");
          }
          
          if (details.contributions) {
            setContributionsOptions(details.contributions.options || []);
            setContributionsOther(details.contributions.otherText || "");
          }
          
          if (details.askFromOthers) {
            setAskFromOthersOptions(details.askFromOthers.options || []);
            setAskFromOthersOther(details.askFromOthers.otherText || "");
            setAskFromOthersNotes(details.askFromOthers.notes || "");
          }
          
          if (details.tone) {
            setTone(details.tone);
          }
          
          if (details.mediaLinks) {
            setMediaLinks(details.mediaLinks);
          }
        }
        
        // Load linked plans
        const linked = allPlans.filter(plan => existingOccasion.relatedPlanIds.includes(plan.id));
        setLinkedPlans(linked);
        setAvailablePlans(allPlans.filter(plan => !linked.find(l => l.id === plan.id)));
      }
    } else {
      // For new occasions, all plans are available
      setAvailablePlans(allPlans);
    }
  }, [isEditing, occasionId]);

  const togglePerson = (personId: string) => {
    setSelectedPeople((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  // Auto-close timing popover and set recurring when timingMode changes
  useEffect(() => {
    setShowTimingPopover(false);
  }, [timingMode]);

  const handleChipClick = (chipId: string) => {
    setActiveChip(activeChip === chipId ? null : chipId);
  };

  const toggleContributionOption = (option: string) => {
    setContributionsOptions(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const toggleAskFromOthersOption = (option: string) => {
    setAskFromOthersOptions(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const addMediaLink = () => {
    if (newLinkTitle && newLinkUrl) {
      setMediaLinks([...mediaLinks, { title: newLinkTitle, url: newLinkUrl }]);
      setNewLinkTitle("");
      setNewLinkUrl("");
    }
  };

  const removeMediaLink = (index: number) => {
    setMediaLinks(mediaLinks.filter((_, i) => i !== index));
  };

  // Check if each chip has data (for completed state)
  const chipHasData = (chipId: string) => {
    switch (chipId) {
      case "do-dont":
        return !!(thingsToDo || thingsToAvoid);
      case "contributions":
        return contributionsOptions.length > 0 || !!contributionsOther;
      case "ask-from-others":
        return askFromOthersOptions.length > 0 || !!askFromOthersOther || !!askFromOthersNotes;
      case "tone":
        return !!tone;
      case "media-links":
        return mediaLinks.length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const occasionDataId = isEditing && occasionId ? occasionId : `occasion-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Get existing occasion to preserve createdAt and relatedPlanIds if editing
    const existingOccasion = isEditing && occasionId ? getOccasion(occasionId) : null;
    
    // Build additional details object
    const additionalDetails: OccasionData['additionalDetails'] = {};
    
    // Only include sections that have data
    if (thingsToDo || thingsToAvoid) {
      additionalDetails.doAndDont = {
        thingsToDo: thingsToDo || undefined,
        thingsToAvoid: thingsToAvoid || undefined,
      };
    }
    
    if (contributionsOptions.length > 0 || contributionsOther) {
      additionalDetails.contributions = {
        options: contributionsOptions,
        otherText: contributionsOther || undefined,
      };
    }
    
    if (askFromOthersOptions.length > 0 || askFromOthersOther || askFromOthersNotes) {
      additionalDetails.askFromOthers = {
        options: askFromOthersOptions,
        otherText: askFromOthersOther || undefined,
        notes: askFromOthersNotes || undefined,
      };
    }
    
    if (tone) {
      additionalDetails.tone = tone;
    }
    
    if (mediaLinks.length > 0) {
      additionalDetails.mediaLinks = mediaLinks;
    }
    
    const occasionData: OccasionData = {
      id: occasionDataId,
      title,
      type: occasionType,
      people: selectedPeople.map(id => {
        const person = mockPeople.find(p => p.id === id);
        return person ? { id: person.id, name: person.name } : { id, name: "Unknown" };
      }),
      status,
      timing: {
        mode: timingMode,
        singleDate: timingMode === "single" ? singleDate : undefined,
        startDate: timingMode === "range" ? startDate : undefined,
        endDate: timingMode === "range" ? endDate : undefined,
      },
      context: {
        whatShouldPeopleKnow,
        whatDoesSupportLookLike,
      },
    recurring: timingMode === "ongoing",
      relatedPlanIds: linkedPlans.map(p => p.id), // Save linked plan IDs
      additionalDetails: Object.keys(additionalDetails).length > 0 ? additionalDetails : undefined,
      createdAt: existingOccasion?.createdAt || now,
      updatedAt: now,
    };
    
    saveOccasion(occasionData);
    
    // Update each linked plan to reference this occasion (many-to-many)
    linkedPlans.forEach(plan => {
      if (!plan.linkedOccasionIds) {
        plan.linkedOccasionIds = [];
      }
      if (!plan.linkedOccasionIds.includes(occasionDataId)) {
        plan.linkedOccasionIds.push(occasionDataId);
        // Update the plan in storage
        linkPlanToOccasion(plan.id, occasionDataId);
      }
    });
    
    navigate(`/app/occasions/${occasionDataId}`);
  };

  return (
    <div className="p-4 md:p-8">
      <Link to="/app/occasions" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
        ← Back to Occasions
      </Link>

      <h1 className="mb-6">{isEditing ? "Edit Occasion" : "Create New Occasion"}</h1>

      <div className="max-w-2xl">
        <p className="text-gray-600 mb-6">
          {isEditing 
            ? "Update the details for this occasion."
            : "Create a meaningful occasion to document and share with your trusted network."
          }
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="border border-gray-200 rounded p-4">
            <h2 className="mb-3">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm text-gray-600 mb-1">
                  Occasion Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Sarah's 30th Birthday"
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                  required
                />
              </div>

              <div>
                <label htmlFor="occasionType" className="block text-sm text-gray-600 mb-1">
                  Occasion Type *
                </label>
                <select
                  id="occasionType"
                  value={occasionType}
                  onChange={(e) => setOccasionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                  required
                >
                  <option value="">Select a type...</option>
                  {occasionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={status === "draft"}
                      onChange={(e) => setStatus(e.target.value as "draft" | "active")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Draft</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={status === "active"}
                      onChange={(e) => setStatus(e.target.value as "draft" | "active")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </div>
            </div>
          </section>
<section className="border border-gray-200 rounded p-4">
  <h2 className="mb-3">People</h2>
  <p className="text-sm text-gray-600 mb-3">
    Add people from your network connected to this occasion
  </p>

  <div className="relative" ref={peopleDropdownRef}>
    <button
      type="button"
      onClick={() => setIsPeopleDropdownOpen((prev) => !prev)}
      className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-left flex items-center justify-between"
    >
      <span className={selectedPeopleData.length > 0 ? "text-gray-900" : "text-gray-500"}>
        {selectedPeopleData.length > 0
          ? `${selectedPeopleData.length} participant${selectedPeopleData.length > 1 ? "s" : ""} selected`
          : "Select people"}
      </span>
      <span className="text-gray-400">{isPeopleDropdownOpen ? "▲" : "▼"}</span>
    </button>

    {isPeopleDropdownOpen && (
      <div className="absolute z-10 mt-2 w-full rounded border border-gray-200 bg-white shadow-sm">
        <div className="max-h-60 overflow-y-auto py-1">
          {mockPeople.map((person) => {
            const isSelected = selectedPeople.includes(person.id);

            return (
              <label
                key={person.id}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePerson(person.id)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-900">{person.name}</span>
              </label>
            );
          })}
        </div>
      </div>
    )}
  </div>

  {selectedPeopleData.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-3">
      {selectedPeopleData.map((person) => (
        <span
          key={person.id}
          className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
        >
          {person.name}
          <button
            type="button"
            onClick={() => removePerson(person.id)}
            className="text-gray-500 hover:text-gray-700"
            aria-label={`Remove ${person.name}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )}
</section>
 <section className="border border-gray-200 rounded p-4">
  <h2 className="mb-3">Timing</h2>

  <div className="space-y-4">
    <div>
      <label className="block text-sm text-gray-600 mb-2">
        Select timing type
      </label>

      <div className="flex flex-wrap gap-4">
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
            value="ongoing"
            checked={timingMode === "ongoing"}
            onChange={(e) => setTimingMode(e.target.value as TimingMode)}
            className="w-4 h-4"
          />
          <span className="text-sm">Ongoing</span>
        </label>
      </div>
    </div>

    <div className="relative" ref={timingPopoverRef}>
      {(timingMode === "single" || timingMode === "ongoing") && (
        <div className={timingMode === "ongoing" ? "grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3" : ""}>
          <button
            type="button"
            onClick={() => setShowTimingPopover((prev) => !prev)}
            className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-left flex items-center justify-between"
          >
            <span className={singleDate ? "text-gray-900" : "text-gray-500"}>
              {singleDate ? formatDisplayDate(singleDate) : "Select date"}
            </span>
            <span className="text-gray-400">📅</span>
          </button>

          {timingMode === "ongoing" && (
            <select
              value={recurrencePreset}
              onChange={(e) => {
                const value = e.target.value;
                setRecurrencePreset(value);
                if (value === "custom") {
                  setShowCustomRecurrenceModal(true);
                }
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded bg-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly on {getWeekdayLabel(singleDate)}</option>
              <option value="monthly">Monthly on the last {getWeekdayLabel(singleDate)}</option>
              <option value="annually">Annually on {getMonthDayLabel(singleDate)}</option>
              <option value="weekdays">Every weekday</option>
              <option value="custom">Custom…</option>
            </select>
          )}

          {showTimingPopover && (
            <div className="absolute left-0 top-full z-20 mt-2 rounded-xl border border-gray-200 bg-white shadow-lg p-4">
              <DayPicker
                mode="single"
                selected={fromStoredDate(singleDate)}
                onSelect={(date) => {
                  setSingleDate(toStoredDate(date));
                  setShowTimingPopover(false);
                }}
                numberOfMonths={2}
                fixedWeeks
                showOutsideDays
              />
            </div>
          )}
        </div>
      )}

      {timingMode === "range" && (
        <div>
          <button
            type="button"
            onClick={() => setShowTimingPopover((prev) => !prev)}
            className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-left flex items-center justify-between"
          >
            <span className={startDate || endDate ? "text-gray-900" : "text-gray-500"}>
              {formatRangeDisplay(startDate, endDate) || "Select date range"}
            </span>
            <span className="text-gray-400">📅</span>
          </button>

          {showTimingPopover && (
            <div className="absolute left-0 top-full z-20 mt-2 rounded-xl border border-gray-200 bg-white shadow-lg p-4">
              <DayPicker
                mode="range"
                selected={rangeDraft ?? { from: fromStoredDate(startDate), to: fromStoredDate(endDate) }}
                onSelect={(range) => {
                  setRangeDraft(range);
                  setStartDate(toStoredDate(range?.from));
                  setEndDate(toStoredDate(range?.to));
                  if (range?.from && range?.to) {
                    setShowTimingPopover(false);
                  }
                }}
                numberOfMonths={2}
                fixedWeeks
                showOutsideDays
              />
            </div>
          )}
        </div>
      )}
    </div>
  </div>
</section>

          <section className="border border-gray-200 rounded p-4">
            <h2 className="mb-3">Context</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="whatShouldPeopleKnow" className="block text-sm text-gray-600 mb-1">
                  What should people know?
                </label>
                <textarea
                  id="whatShouldPeopleKnow"
                  value={whatShouldPeopleKnow}
                  onChange={(e) => setWhatShouldPeopleKnow(e.target.value)}
                  placeholder="Share context, traditions, or important details about this occasion..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                />
              </div>

              <div>
                <label htmlFor="whatDoesSupportLookLike" className="block text-sm text-gray-600 mb-1">
                  What does support look like?
                </label>
                <textarea
                  id="whatDoesSupportLookLike"
                  value={whatDoesSupportLookLike}
                  onChange={(e) => setWhatDoesSupportLookLike(e.target.value)}
                  placeholder="Describe how people can show support, what would be helpful, or what you need..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                />
              </div>
            </div>
          </section>

          {/* Plans Section */}
          <section className="border border-gray-200 rounded p-4">
            <h2 className="mb-3">Plans</h2>
            <p className="text-sm text-gray-600 mb-3">
              Link collaborative planning workspaces to this occasion
            </p>
            
            {linkedPlans.length > 0 && (
              <div className="space-y-2 mb-3">
                {linkedPlans.map((plan: any) => (
                  <div
                    key={plan.id}
                    className="border border-gray-200 rounded p-3 flex items-start justify-between bg-white"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{plan.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {plan.leader ? `Led by ${plan.leader.name}` : ""} 
                        {plan.participants && ` • ${plan.participants.length} participants`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Remove from linked plans (optimistic update)
                        setLinkedPlans(linkedPlans.filter(p => p.id !== plan.id));
                        setAvailablePlans([...availablePlans, plan]);
                        // Only update storage if editing existing occasion
                        if (occasionId) {
                          removePlanFromOccasion(plan.id, occasionId);
                        }
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 ml-3"
                    >
                      Unlink
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {!showPlanSelector ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlanSelector(true)}
                  className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
                >
                  Attach Existing Plan
                </button>
                <Link
                  to={`/app/plans/create${occasionId ? `?occasionId=${occasionId}&occasionTitle=${encodeURIComponent(title)}` : `?occasionTitle=${encodeURIComponent(title)}`}`}
                  className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 inline-block text-center"
                >
                  Create New Plan
                </Link>
              </div>
            ) : (
              <div className="border border-gray-300 rounded p-4 bg-gray-50">
                <h3 className="text-sm font-medium mb-3">Select Plans to Link</h3>
                {availablePlans.length > 0 ? (
                  <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                    {availablePlans.map((plan: any) => {
                      const isAlreadyLinked = linkedPlans.some(p => p.id === plan.id);
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => {
                            if (!isAlreadyLinked) {
                              // Add to linked plans
                              setLinkedPlans([...linkedPlans, plan]);
                              // Remove from available
                              setAvailablePlans(availablePlans.filter(p => p.id !== plan.id));
                              // Update storage if editing
                              if (occasionId) {
                                linkPlanToOccasion(plan.id, occasionId);
                              }
                            }
                          }}
                          disabled={isAlreadyLinked}
                          className={`w-full text-left p-3 border rounded ${
                            isAlreadyLinked
                              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="font-medium text-sm">{plan.title}</div>
                          {isAlreadyLinked && (
                            <div className="text-xs text-gray-500 mt-1">
                              Already linked
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic mb-3">
                    No available plans to link. Create a new plan to get started.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowPlanSelector(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-white"
                >
                  Done
                </button>
              </div>
            )}
          </section>

          {/* Additional Details with Chip-based Expansion */}
          <section className="border border-gray-200 rounded p-4">
            <h2 className="mb-3">Additional Details</h2>
            <p className="text-sm text-gray-600 mb-3">
              Optional fields to add more context and structure
            </p>
            
            {/* Chip Row */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleChipClick("do-dont")}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  activeChip === "do-dont"
                    ? "bg-gray-900 text-white border-gray-900"
                    : chipHasData("do-dont")
                    ? "bg-gray-100 border-gray-300 hover:bg-gray-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                Do / Don't {chipHasData("do-dont") && "✓"}
              </button>
              
              <button
                type="button"
                onClick={() => handleChipClick("contributions")}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  activeChip === "contributions"
                    ? "bg-gray-900 text-white border-gray-900"
                    : chipHasData("contributions")
                    ? "bg-gray-100 border-gray-300 hover:bg-gray-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                Contributions {chipHasData("contributions") && "✓"}
              </button>
              
              <button
                type="button"
                onClick={() => handleChipClick("ask-from-others")}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  activeChip === "ask-from-others"
                    ? "bg-gray-900 text-white border-gray-900"
                    : chipHasData("ask-from-others")
                    ? "bg-gray-100 border-gray-300 hover:bg-gray-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                Ask from Others {chipHasData("ask-from-others") && "✓"}
              </button>
              
              <button
                type="button"
                onClick={() => handleChipClick("tone")}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  activeChip === "tone"
                    ? "bg-gray-900 text-white border-gray-900"
                    : chipHasData("tone")
                    ? "bg-gray-100 border-gray-300 hover:bg-gray-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                Tone {chipHasData("tone") && "✓"}
              </button>
              
              <button
                type="button"
                onClick={() => handleChipClick("media-links")}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  activeChip === "media-links"
                    ? "bg-gray-900 text-white border-gray-900"
                    : chipHasData("media-links")
                    ? "bg-gray-100 border-gray-300 hover:bg-gray-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                Media & Links {chipHasData("media-links") && "✓"}
              </button>
            </div>

            {/* Expansion Container */}
            {activeChip && (
              <div className="border border-gray-300 rounded p-4 bg-gray-50">
                {/* Do / Don't Content */}
                {activeChip === "do-dont" && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="thingsToDo" className="block text-sm text-gray-700 mb-1">
                        Things to do
                      </label>
                      <textarea
                        id="thingsToDo"
                        value={thingsToDo}
                        onChange={(e) => setThingsToDo(e.target.value)}
                        placeholder="What should people do or know about..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="thingsToAvoid" className="block text-sm text-gray-700 mb-1">
                        Things to avoid
                      </label>
                      <textarea
                        id="thingsToAvoid"
                        value={thingsToAvoid}
                        onChange={(e) => setThingsToAvoid(e.target.value)}
                        placeholder="What should people avoid or be mindful of..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Contributions Content */}
                {activeChip === "contributions" && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 mb-2">Select all that apply:</p>
                    <div className="space-y-2">
                      {["Bring something", "Help plan", "Show up", "Coordinate"].map((option) => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contributionsOptions.includes(option)}
                            onChange={() => toggleContributionOption(option)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                    <div>
                      <label htmlFor="contributionsOther" className="block text-sm text-gray-700 mb-1">
                        Other
                      </label>
                      <input
                        type="text"
                        id="contributionsOther"
                        value={contributionsOther}
                        onChange={(e) => setContributionsOther(e.target.value)}
                        placeholder="Describe other ways to contribute..."
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Ask from Others Content */}
                {activeChip === "ask-from-others" && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 mb-2">What I'm asking for:</p>
                    <div className="space-y-2">
                      {["Meals", "Company", "Space", "Help with logistics"].map((option) => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={askFromOthersOptions.includes(option)}
                            onChange={() => toggleAskFromOthersOption(option)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                    <div>
                      <label htmlFor="askFromOthersOther" className="block text-sm text-gray-700 mb-1">
                        Other
                      </label>
                      <input
                        type="text"
                        id="askFromOthersOther"
                        value={askFromOthersOther}
                        onChange={(e) => setAskFromOthersOther(e.target.value)}
                        placeholder="Other needs..."
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="askFromOthersNotes" className="block text-sm text-gray-700 mb-1">
                        Additional notes
                      </label>
                      <textarea
                        id="askFromOthersNotes"
                        value={askFromOthersNotes}
                        onChange={(e) => setAskFromOthersNotes(e.target.value)}
                        placeholder="Any additional context..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Tone Content */}
                {activeChip === "tone" && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 mb-2">Select one:</p>
                    {["low-key", "celebratory", "sensitive", "private"].map((toneOption) => (
                      <label key={toneOption} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tone"
                          value={toneOption}
                          checked={tone === toneOption}
                          onChange={(e) => setTone(e.target.value as typeof tone)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm capitalize">{toneOption}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Media & Links Content */}
                {activeChip === "media-links" && (
                  <div className="space-y-4">
                    {mediaLinks.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {mediaLinks.map((link, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{link.title}</div>
                              <div className="text-xs text-gray-600 truncate">{link.url}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMediaLink(index)}
                              className="text-sm text-gray-500 hover:text-gray-700 ml-2"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <label htmlFor="newLinkTitle" className="block text-sm text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        id="newLinkTitle"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        placeholder="e.g., Event Photos"
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="newLinkUrl" className="block text-sm text-gray-700 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        id="newLinkUrl"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addMediaLink}
                      disabled={!newLinkTitle || !newLinkUrl}
                      className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add another link
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
{showCustomRecurrenceModal && (
  <div className="fixed inset-0 z-30 bg-black/30 flex items-center justify-center p-4">
    <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-5 space-y-4">
      <div>
        <h3 className="text-lg font-medium">Custom recurrence</h3>
        <p className="text-sm text-gray-600 mt-1">
          Set a custom repeating schedule for this ongoing occasion.
        </p>
      </div>

      <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-3 items-center">
        <label className="text-sm text-gray-700">Repeat every</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={customRepeatEvery}
            onChange={(e) => setCustomRepeatEvery(Number(e.target.value) || 1)}
            className="w-24 px-3 py-2 border border-gray-200 rounded"
          />
          <select
            value={customRepeatUnit}
            onChange={(e) => setCustomRepeatUnit(e.target.value as "day" | "week" | "month" | "year")}
            className="flex-1 px-3 py-2 border border-gray-200 rounded"
          >
            <option value="day">day</option>
            <option value="week">week</option>
            <option value="month">month</option>
            <option value="year">year</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Ends</label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="customEndsMode"
            checked={customEndsMode === "never"}
            onChange={() => setCustomEndsMode("never")}
          />
          <span className="text-sm">Never</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="customEndsMode"
            checked={customEndsMode === "on"}
            onChange={() => setCustomEndsMode("on")}
          />
          <span className="text-sm">On date</span>
        </label>

        {customEndsMode === "on" && (
          <input
            type="date"
            value={customEndsOnDate}
            onChange={(e) => setCustomEndsOnDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded"
          />
        )}

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="customEndsMode"
            checked={customEndsMode === "after"}
            onChange={() => setCustomEndsMode("after")}
          />
          <span className="text-sm">After number of occurrences</span>
        </label>

        {customEndsMode === "after" && (
          <input
            type="number"
            min={1}
            value={customEndsAfterCount}
            onChange={(e) => setCustomEndsAfterCount(Number(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-200 rounded"
          />
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            setRecurrencePreset("daily");
            setShowCustomRecurrenceModal(false);
          }}
          className="px-4 py-2 border border-gray-200 rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setShowCustomRecurrenceModal(false)}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Done
        </button>
      </div>
    </div>
  </div>
)}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              {isEditing ? "Save Changes" : "Save Draft"}
            </button>
            <Link
              to={isEditing && occasionId ? `/app/occasions/${occasionId}` : "/app/occasions"}
              className="px-6 py-2 bg-gray-100 rounded hover:bg-gray-200 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
