import { isSurveyCompleted } from "./surveyStorage";

export interface SurveyRequester {
  id: string;
  name: string;
  initials: string;
  colorClass: string;
}

export interface SurveyRequest {
  id: string;
  surveyId: string;
  category: string;
  kind: "fill" | "access";
  isAnonymous: boolean;
  requester?: SurveyRequester;
}

export const SURVEY_REQUESTS: SurveyRequest[] = [
  {
    id: "s1",
    surveyId: "sizes",
    category: "Sizes",
    kind: "fill",
    isAnonymous: false,
    requester: {
      id: "sarah",
      name: "Sarah",
      initials: "SJ",
      colorClass: "bg-amber-100 text-amber-700",
    },
  },
  {
    id: "s2",
    surveyId: "celebration",
    category: "Celebration Preferences",
    kind: "fill",
    isAnonymous: true,
  },
  {
    id: "s3",
    surveyId: "communication",
    category: "Communication Preferences",
    kind: "fill",
    isAnonymous: false,
    requester: {
      id: "michael",
      name: "Michael",
      initials: "MC",
      colorClass: "bg-blue-100 text-blue-700",
    },
  },
  {
    id: "s4",
    surveyId: "allergies",
    category: "Allergies / Restrictions",
    kind: "access",
    isAnonymous: false,
    requester: {
      id: "david",
      name: "David",
      initials: "DM",
      colorClass: "bg-violet-100 text-violet-700",
    },
  },
];

const RESOLVED_REQUESTS_KEY = "resolved-survey-requests";

export function getResolvedSurveyRequestIds(): string[] {
  const stored = localStorage.getItem(RESOLVED_REQUESTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function resolveSurveyRequest(requestId: string): void {
  const resolved = getResolvedSurveyRequestIds();
  if (!resolved.includes(requestId)) {
    resolved.push(requestId);
    localStorage.setItem(RESOLVED_REQUESTS_KEY, JSON.stringify(resolved));
  }
}

export function getOpenAboutMeRequests(): SurveyRequest[] {
  const resolved = new Set(getResolvedSurveyRequestIds());
  return SURVEY_REQUESTS.filter((request) => {
    if (resolved.has(request.id)) return false;
    if (request.kind === "fill" && isSurveyCompleted(request.surveyId)) return false;
    return true;
  });
}

export function getOpenSurveyRequests(): SurveyRequest[] {
  return getOpenAboutMeRequests().filter((request) => request.kind === "fill");
}
