import type { ItemIconKey } from "../config/itemTypes";
// Utility for managing occasion data in sessionStorage

export interface OccasionData {
  id: string;
  title: string;
  type: string;
  /** Situation icon from config/itemTypes (birthday, anniversary, ...) */
  kind?: ItemIconKey<"occasion">;
  people: { id: string; name: string; initials?: string; role?: string }[];
  status: "draft" | "active";
  timing: {
    mode: "single" | "range" | "ongoing";
    singleDate?: string;
    startDate?: string;
    endDate?: string;
  };
  context: {
    whatShouldPeopleKnow?: string;
    whatDoesSupportLookLike?: string;
  };
  recurring: boolean;
  relatedPlanIds: string[]; // Array of plan IDs linked to this occasion
  // Additional details (chip-based expansion)
  additionalDetails?: {
    doAndDont?: {
      thingsToDo?: string;
      thingsToAvoid?: string;
    };
    contributions?: {
      options: string[]; // Array of selected options
      otherText?: string; // Text for "Other" option
    };
    askFromOthers?: {
      options: string[]; // Array of selected options
      otherText?: string; // Text for "Other" option
      notes?: string; // Additional notes
    };
    tone?: "low-key" | "celebratory" | "sensitive" | "private";
    mediaLinks?: {
      title: string;
      url: string;
    }[];
  };
  createdAt: string;
  updatedAt: string;
  // Legacy mock data fields
  date?: string;
  recurringText?: string;
  notes?: string;
  relatedPlans?: {
    id: string;
    title: string;
    leader: string;
    participants: number;
    status: string;
  }[];
}

export function saveOccasion(occasionData: OccasionData): void {
  sessionStorage.setItem(`occasion-${occasionData.id}`, JSON.stringify(occasionData));
  
  // Add to the list of created occasions
  const existingOccasionsJson = sessionStorage.getItem('created-occasions');
  const existingOccasions: string[] = existingOccasionsJson ? JSON.parse(existingOccasionsJson) : [];
  
  if (!existingOccasions.includes(occasionData.id)) {
    existingOccasions.push(occasionData.id);
    sessionStorage.setItem('created-occasions', JSON.stringify(existingOccasions));
  }
}

export function getOccasion(occasionId: string): OccasionData | null {
  const occasionJson = sessionStorage.getItem(`occasion-${occasionId}`);
  return occasionJson ? JSON.parse(occasionJson) : null;
}

export function getAllCreatedOccasions(): OccasionData[] {
  const occasionIdsJson = sessionStorage.getItem('created-occasions');
  if (!occasionIdsJson) return [];
  
  const occasionIds: string[] = JSON.parse(occasionIdsJson);
  return occasionIds
    .map(id => getOccasion(id))
    .filter((occasion): occasion is OccasionData => occasion !== null);
}

export function deleteOccasion(occasionId: string): void {
  sessionStorage.removeItem(`occasion-${occasionId}`);
  
  const existingOccasionsJson = sessionStorage.getItem('created-occasions');
  if (existingOccasionsJson) {
    const existingOccasions: string[] = JSON.parse(existingOccasionsJson);
    const filtered = existingOccasions.filter(id => id !== occasionId);
    sessionStorage.setItem('created-occasions', JSON.stringify(filtered));
  }
}