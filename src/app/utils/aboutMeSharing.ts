import { SURVEY_REQUESTS, type SurveyRequester } from "./surveyRequests";

// Who each About Me survey is shared with. Only completed surveys are shared;
// accepted access requests add people to the list.

export interface SharingPerson {
  id: string;
  name: string;
  initials: string;
  colorClass: string;
}

export type SharingTarget =
  | { type: "individuals"; people: SharingPerson[] }
  | { type: "group"; name: string; members: SharingPerson[] };

const PEOPLE: Record<string, SharingPerson> = {
  sarah:   { id: "sarah",   name: "Sarah",   initials: "SJ", colorClass: "bg-amber-100 text-amber-700" },
  michael: { id: "michael", name: "Michael", initials: "MC", colorClass: "bg-blue-100 text-blue-700" },
  lisa:    { id: "lisa",    name: "Lisa",    initials: "LA", colorClass: "bg-orange-100 text-orange-700" },
  jen:     { id: "jen",     name: "Jen",     initials: "JW", colorClass: "bg-pink-100 text-pink-700" },
  tom:     { id: "tom",     name: "Tom",     initials: "TB", colorClass: "bg-slate-200 text-slate-600" },
  emma:    { id: "emma",    name: "Emma",    initials: "ED", colorClass: "bg-violet-100 text-violet-700" },
  david:   { id: "david",   name: "David",   initials: "DM", colorClass: "bg-emerald-100 text-emerald-700" },
  alex:    { id: "alex",    name: "Alex",    initials: "AC", colorClass: "bg-cyan-100 text-cyan-700" },
  jordan:  { id: "jordan",  name: "Jordan",  initials: "JS", colorClass: "bg-rose-100 text-rose-700" },
  priya:   { id: "priya",   name: "Priya",   initials: "PP", colorClass: "bg-lime-100 text-lime-700" },
};

const INITIAL_SHARING: Record<string, SharingTarget> = {
  "basic-info": {
    type: "group",
    name: "NYC friends",
    members: [PEOPLE.sarah, PEOPLE.lisa, PEOPLE.jen, PEOPLE.tom],
  },
  "gift-preferences": {
    type: "individuals",
    people: [PEOPLE.lisa],
  },
  "food-drink": {
    type: "individuals",
    people: [
      PEOPLE.sarah,
      PEOPLE.michael,
      PEOPLE.jen,
      PEOPLE.lisa,
      PEOPLE.tom,
      PEOPLE.emma,
      PEOPLE.david,
      PEOPLE.alex,
      PEOPLE.jordan,
      PEOPLE.priya,
    ],
  },
  allergies: {
    type: "individuals",
    people: [PEOPLE.emma],
  },
};

function requesterAsSharingPerson(requester: SurveyRequester): SharingPerson {
  return {
    id: requester.id,
    name: requester.name,
    initials: requester.initials,
    colorClass: requester.colorClass,
  };
}

export function getSharingTarget(surveyId: string, resolvedIds: string[]): SharingTarget | null {
  const initial = INITIAL_SHARING[surveyId];
  const acceptedPeople = SURVEY_REQUESTS.filter(
    (request) =>
      request.surveyId === surveyId &&
      request.kind === "access" &&
      resolvedIds.includes(request.id) &&
      request.requester
  ).map((request) => requesterAsSharingPerson(request.requester!));

  if (acceptedPeople.length === 0) return initial ?? null;
  if (!initial) return { type: "individuals", people: acceptedPeople };
  if (initial.type === "group") return initial;

  const peopleById = new Map(initial.people.map((person) => [person.id, person]));
  for (const person of acceptedPeople) peopleById.set(person.id, person);
  return { type: "individuals", people: [...peopleById.values()] };
}

/** "Shared with Lisa", "Shared with NYC friends", "Shared with Sarah, Michael, and 8 others". */
export function sharingSummary(target: SharingTarget | null): string {
  if (!target) return "Not shared with anyone yet";
  if (target.type === "group") return `Shared with ${target.name}`;
  const names = target.people.map((p) => p.name);
  if (names.length === 1) return `Shared with ${names[0]}`;
  if (names.length === 2) return `Shared with ${names[0]} and ${names[1]}`;
  if (names.length === 3) return `Shared with ${names[0]}, ${names[1]}, and ${names[2]}`;
  return `Shared with ${names[0]}, ${names[1]}, and ${names.length - 2} others`;
}
