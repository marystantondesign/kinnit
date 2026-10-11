import type { ItemIconKey } from "../config/itemTypes";
// Utility for managing plan data in sessionStorage

export interface PlanData {
  id: string;
  title: string;
  /** Situation icon from config/itemTypes (dinner, trip, ...) */
  kind?: ItemIconKey<"plan">;
  description?: string;
  status: "draft" | "active";
  linkedOccasionIds: string[]; // Changed from linkedOccasion to support many-to-many
  leader: { id: string; name: string; initials: string };
  planFor: string;
  participants: { id: string; name: string; initials: string }[];
  organizers: { id: string; name: string; initials: string }[];
  template?: string;
  timing: {
    mode: "single" | "range" | "recurring";
    singleDate?: string;
    startDate?: string;
    endDate?: string;
    recurrencePattern?: "weekly" | "monthly" | "yearly";
  };
  createdAt?: string;
  updatedAt?: string;
}

const demoPlans: PlanData[] = [
  {
    id: "1",
    title: "Birthday Dinner Planning",
    status: "active",
    linkedOccasionIds: [],
    leader: { id: "you", name: "You", initials: "YO" },
    planFor: "Sarah's Birthday",
    participants: [
      { id: "you", name: "You", initials: "YO" },
      { id: "1", name: "Sarah Johnson", initials: "SJ" },
      { id: "2", name: "Michael Chen", initials: "MC" },
      { id: "4", name: "Alex Chen", initials: "AC" },
    ],
    organizers: [{ id: "you", name: "You", initials: "YO" }],
    timing: {
      mode: "single",
      singleDate: "2026-04-15",
    },
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "4",
    title: "Recovery Support Schedule",
    status: "active",
    linkedOccasionIds: [],
    leader: { id: "you", name: "You", initials: "YO" },
    planFor: "Emma's Surgery",
    participants: [
      { id: "you", name: "You", initials: "YO" },
      { id: "3", name: "Emma Davis", initials: "ED" },
      { id: "2", name: "Michael Chen", initials: "MC" },
    ],
    organizers: [{ id: "you", name: "You", initials: "YO" }],
    timing: {
      mode: "range",
      startDate: "2026-03-20",
      endDate: "2026-03-30",
    },
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "5",
    title: "Mexico Trip Planning",
    status: "draft",
    linkedOccasionIds: [],
    leader: { id: "2", name: "Michael Chen", initials: "MC" },
    planFor: "Group Trip to Mexico",
    participants: [
      { id: "you", name: "You", initials: "YO" },
      { id: "1", name: "Sarah Johnson", initials: "SJ" },
      { id: "2", name: "Michael Chen", initials: "MC" },
      { id: "3", name: "Emma Davis", initials: "ED" },
    ],
    organizers: [{ id: "2", name: "Michael Chen", initials: "MC" }],
    timing: {
      mode: "range",
      startDate: "2026-12-10",
      endDate: "2026-12-17",
    },
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

export function savePlan(planData: PlanData): void {
  sessionStorage.setItem(`plan-${planData.id}`, JSON.stringify(planData));
  
  // Add to the list of created plans
  const existingPlansJson = sessionStorage.getItem('created-plans');
  const existingPlans: string[] = existingPlansJson ? JSON.parse(existingPlansJson) : [];
  
  if (!existingPlans.includes(planData.id)) {
    existingPlans.push(planData.id);
    sessionStorage.setItem('created-plans', JSON.stringify(existingPlans));
  }
}

export function getPlan(planId: string): PlanData | null {
  const planJson = sessionStorage.getItem(`plan-${planId}`);
  if (planJson) return JSON.parse(planJson);

  const demoPlan = demoPlans.find((plan) => plan.id === planId);
  return demoPlan || null;
}

export function getAllCreatedPlans(): PlanData[] {
  const planIdsJson = sessionStorage.getItem('created-plans');
  if (!planIdsJson) return [];
  
  const planIds: string[] = JSON.parse(planIdsJson);
  return planIds
    .map(id => getPlan(id))
    .filter((plan): plan is PlanData => plan !== null);
}
export function getAllPlans(): PlanData[] {
  const createdPlans = getAllCreatedPlans();

  const createdIds = new Set(createdPlans.map((plan) => plan.id));
  const mergedDemoPlans = demoPlans.filter((plan) => !createdIds.has(plan.id));

  return [...mergedDemoPlans, ...createdPlans];
}
export function deletePlan(planId: string): void {
  sessionStorage.removeItem(`plan-${planId}`);
  
  const existingPlansJson = sessionStorage.getItem('created-plans');
  if (existingPlansJson) {
    const existingPlans: string[] = JSON.parse(existingPlansJson);
    const filtered = existingPlans.filter(id => id !== planId);
    sessionStorage.setItem('created-plans', JSON.stringify(filtered));
  }
}