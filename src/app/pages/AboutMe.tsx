import { useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, User, Users } from "lucide-react";
import { getSurveyResponse } from "../utils/surveyStorage";
import {
  SURVEY_REQUESTS,
  getOpenAboutMeRequests,
  getResolvedSurveyRequestIds,
  resolveSurveyRequest,
  type SurveyRequest,
  type SurveyRequester,
} from "../utils/surveyRequests";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

// ─── Section config ───────────────────────────────────────────────────────────

interface SectionCard {
  id: string;
  title: string;
  description: string;
  link?: string;
  surveyId?: string; // storage key when it differs from id
}

const sections: SectionCard[] = [
  {
    id: "basic-info",
    title: "Basic Info",
    description: "Name, birthday, contact information",
    link: "/app/about-me/basic-info",
  },
  {
    id: "important-dates",
    title: "Important Dates",
    description: "Anniversaries, birthdays, and other significant dates",
    link: "/app/about-me/important-dates",
  },
  {
    id: "gift-preferences",
    title: "Gift Preferences",
    description: "Gift guidance, favorite stores, interests, and things to avoid",
    link: "/app/about-me/gift-preferences",
  },
  {
    id: "sizes",
    title: "Sizes",
    description: "Clothing, shoe, and other size information",
    link: "/app/about-me/sizes",
  },
  {
    id: "food-drink",
    title: "Food and Drink Preferences",
    description: "Favorite foods, drinks, dietary preferences",
    link: "/app/about-me/food-drink",
  },
  {
    id: "allergies",
    title: "Allergies / Restrictions",
    description: "Food allergies, sensitivities, and dietary restrictions",
    link: "/app/about-me/allergies",
  },
  {
    id: "flowers-plants",
    title: "Flowers / Plants / Objects",
    description: "Favorite flowers, plants, and decorative objects",
    link: "/app/about-me/flowers-plants",
    surveyId: "flowers-plants-objects",
  },
  {
    id: "celebration",
    title: "Celebration Preferences",
    description: "How you like to celebrate special occasions",
    link: "/app/about-me/celebration",
  },
  {
    id: "care",
    title: "Care Preferences",
    description: "How you prefer to be supported during difficult times",
    link: "/app/about-me/care",
  },
  {
    id: "communication",
    title: "Communication Preferences",
    description: "Preferred ways to communicate and stay in touch",
    link: "/app/about-me/communication",
  },
  {
    id: "survey-responses",
    title: "Survey Responses",
    description: "Access to survey library and your completed survey responses",
    link: "/app/survey-library",
  },
  {
    id: "life-legacy",
    title: "Life & Legacy",
    description: "End-of-life preferences, funeral or memorial wishes, instructions for belongings",
    link: "/app/about-me/life-legacy",
  },
];

// ─── Completion helpers ───────────────────────────────────────────────────────

// Survey Responses card has its own "X of Y complete" display — skip treatment.
const SKIP_TREATMENT = new Set(["survey-responses"]);

// Mock pre-completed sections so the prototype shows the green-border state.
// Real survey completions (from localStorage) take precedence over these.
const MOCK_COMPLETED: Record<string, string> = {
  "basic-info":       "Oct 10, 2026",
  "gift-preferences": "Sep 5, 2026",
  "food-drink":       "Sep 5, 2026",
  "allergies":        "Sep 5, 2026",
};

function getCompletion(section: SectionCard): { completed: boolean; date: string | null } {
  if (SKIP_TREATMENT.has(section.id)) return { completed: false, date: null };

  // Real data from localStorage wins
  const response = getSurveyResponse(section.surveyId ?? section.id);
  if (response?.completed && response.lastSaved) {
    const d = new Date(response.lastSaved);
    return {
      completed: true,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
  }

  // Prototype mock fallback
  const mock = MOCK_COMPLETED[section.id];
  if (mock) return { completed: true, date: mock };

  return { completed: false, date: null };
}

// ─── Sharing data ─────────────────────────────────────────────────────────────

interface SharingPerson {
  id: string;
  name: string;
  initials: string;
  colorClass: string;
}

type SharingTarget =
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

function getSharingTarget(surveyId: string, resolvedIds: string[]): SharingTarget | null {
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

// ─── Bottom-line primitives ───────────────────────────────────────────────────

function PersonAvatar({
  person,
  size = "small",
  anonymous = false,
  outlined = false,
}: {
  person?: SharingPerson | SurveyRequester;
  size?: "small" | "large" | "row";
  anonymous?: boolean;
  outlined?: boolean;
}) {
  const sizeClass = size === "large" ? "size-8" : size === "row" ? "size-[22px]" : "size-5";
  const avatar = (
    <Avatar className={`${sizeClass} ${outlined ? "ring-[1.5px] ring-card" : ""}`}>
      <AvatarFallback
        className={
          anonymous
            ? "bg-muted text-muted-foreground"
            : person?.colorClass ?? "bg-muted text-muted-foreground"
        }
      >
        {anonymous ? (
          <User size={size === "large" ? 17 : 11} />
        ) : (
          <span className={size === "large" ? "text-xs font-medium" : "text-[9px] font-medium"}>
            {person?.initials}
          </span>
        )}
      </AvatarFallback>
    </Avatar>
  );

  return avatar;
}

function SharedAvatarStack({ people }: { people: SharingPerson[] }) {
  const visible = people.slice(0, 3);
  const remaining = people.length - visible.length;

  return (
    <span className="flex items-center">
      {visible.map((person, index) => (
        <span key={person.id} className={index > 0 ? "-ml-1.5" : ""}>
          <PersonAvatar person={person} outlined />
        </span>
      ))}
      {remaining > 0 && (
        <span className="-ml-1.5 size-5 rounded-full bg-muted ring-[1.5px] ring-card flex items-center justify-center text-[9px] font-medium text-muted-foreground">
          +{remaining}
        </span>
      )}
    </span>
  );
}

function RequestAvatarStack({ requests }: { requests: SurveyRequest[] }) {
  const visible = requests.slice(0, 3);
  const remaining = requests.length - visible.length;

  return (
    <span className="flex items-center">
      {visible.map((request, index) => (
        <span
          key={request.id}
          className={`rounded-full border-[1.5px] border-dashed border-foreground p-0.5 ${
            index > 0 ? "-ml-1.5" : ""
          }`}
        >
          <PersonAvatar
            person={request.requester}
            anonymous={request.isAnonymous}
          />
        </span>
      ))}
      {remaining > 0 && (
        <span className="-ml-1.5 size-5 rounded-full bg-muted ring-[1.5px] ring-card flex items-center justify-center text-[9px] font-medium text-muted-foreground">
          +{remaining}
        </span>
      )}
    </span>
  );
}

function SharingPopoverBody({ sharing }: { sharing: SharingTarget }) {
  const people = sharing.type === "group" ? sharing.members : sharing.people;
  const heading =
    sharing.type === "group"
      ? `Shared with ${sharing.name}`
      : `Shared with ${people.length} ${people.length === 1 ? "person" : "people"}`;
  const visiblePeople = people.slice(0, 5);
  const remaining = people.length - visiblePeople.length;

  return (
    <>
      <p className="text-sm font-semibold text-foreground mb-3">{heading}</p>
      <div className="space-y-2">
        {visiblePeople.map((person) => (
          <div key={person.id} className="flex items-center gap-2">
            <PersonAvatar person={person} size="row" />
            <span className="text-sm text-foreground">{person.name}</span>
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-xs text-muted-foreground mt-2">and {remaining} others</p>
      )}
      <div className="border-t border-border mt-3 pt-2">
        <Link
          to="#"
          onClick={(event) => event.preventDefault()}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Manage sharing
        </Link>
      </div>
    </>
  );
}

function RequestPopoverBody({
  requests,
  surveyName,
  surveyLink,
  onClose,
  onShare,
}: {
  requests: SurveyRequest[];
  surveyName: string;
  surveyLink: string;
  onClose: () => void;
  onShare: (request: SurveyRequest) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {requests.map((request, index) => {
        const requesterName = request.isAnonymous
          ? "A friend"
          : request.requester?.name ?? "A friend";
        const isAccess = request.kind === "access";

        return (
          <div
            key={request.id}
            className={index > 0 ? "border-t border-border pt-3" : ""}
          >
            <div className="flex items-start gap-3">
              <PersonAvatar
                person={request.requester}
                anonymous={request.isAnonymous}
                size="large"
              />
              <p className="text-sm text-foreground leading-snug">
                <span className="font-semibold">{requesterName}</span>{" "}
                {isAccess ? "asked for access to" : "asked you to fill out"}{" "}
                {surveyName}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (isAccess) {
                    onShare(request);
                  } else {
                    onClose();
                    navigate(surveyLink);
                  }
                }}
                className="px-2"
              >
                {isAccess
                  ? request.isAnonymous
                    ? "Share with them"
                    : `Share with ${request.requester?.name}`
                  : "Take survey"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Not now
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClusterPopover({
  id,
  openId,
  setOpenId,
  label,
  children,
  content,
}: {
  id: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  label: string;
  children: React.ReactNode;
  content: React.ReactNode;
}) {
  const isOpen = openId === id;

  return (
    <Popover open={isOpen} onOpenChange={(open) => setOpenId(open ? id : null)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label={label}
          onClick={(event) => event.stopPropagation()}
          className={`h-auto min-h-0 rounded-md p-1 ${
            isOpen ? "bg-muted" : "hover:bg-muted"
          }`}
        >
          {children}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={24}
        className="w-72 max-w-[calc(100vw-3rem)] rounded-[var(--request-card-radius)] border-border bg-card p-3.5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <PopoverArrow className="fill-card stroke-border" />
        {content}
      </PopoverContent>
    </Popover>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AboutMe() {
  const navigate = useNavigate();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [resolvedRequestIds, setResolvedRequestIds] = useState(
    getResolvedSurveyRequestIds
  );
  const openRequests = getOpenAboutMeRequests();
  const requestsBySurveyId = new Map<string, typeof openRequests>();

  for (const request of openRequests) {
    const requests = requestsBySurveyId.get(request.surveyId) ?? [];
    requests.push(request);
    requestsBySurveyId.set(request.surveyId, requests);
  }

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    link?: string
  ) => {
    if (!link || event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(link);
    }
  };

  const handleShare = (request: SurveyRequest) => {
    resolveSurveyRequest(request.id);
    setResolvedRequestIds(getResolvedSurveyRequestIds());
    setOpenPopoverId(null);
  };

  return (
    <div className="px-6 py-4 md:p-8">

      {/* Header row */}
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h1>About Me</h1>
        <Link
          to="/app/survey-library"
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
        >
          <Plus size={15} />
          Custom Survey
        </Link>
      </div>

      <p className="mb-4 md:mb-6 text-muted-foreground text-sm">
        Your About Me information helps your trusted connections know how to celebrate, support, and care for you in meaningful ways.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {sections.map((section) => {
          const { completed, date } = getCompletion(section);
          const skipTreatment = SKIP_TREATMENT.has(section.id);
          const surveyId = section.surveyId ?? section.id;
          const sharing = completed
            ? getSharingTarget(surveyId, resolvedRequestIds)
            : null;
          const sharedPersonIds = new Set(
            sharing
              ? sharing.type === "group"
                ? sharing.members.map((person) => person.id)
                : sharing.people.map((person) => person.id)
              : []
          );
          const requests = (requestsBySurveyId.get(surveyId) ?? []).filter(
            (request) =>
              request.kind === (completed ? "access" : "fill") &&
              (!request.requester || !sharedPersonIds.has(request.requester.id))
          );
          const hasBottomLine = !skipTreatment || sharing || requests.length > 0;

          return (
            <div
              key={section.id}
              role={section.link ? "link" : undefined}
              tabIndex={section.link ? 0 : undefined}
              aria-label={section.link ? `Open ${section.title}` : undefined}
              onClick={() => section.link && navigate(section.link)}
              onKeyDown={(event) => handleCardKeyDown(event, section.link)}
              className={[
                "border rounded p-4 flex flex-col transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                section.link ? "hover:bg-accent cursor-pointer" : "",
                completed
                  ? "border-border border-l-[3px] border-l-green-500"
                  : "border-border",
              ].join(" ")}
            >
              <h2 className="mb-1">{section.title}</h2>
              <p className="text-sm text-muted-foreground flex-1">{section.description}</p>

              {hasBottomLine && (
                <div className="mt-3 h-5 flex items-center justify-between gap-2">
                  {!skipTreatment ? (
                    <p className="min-w-0 truncate text-xs text-muted-foreground">
                      {completed && date ? `Last updated ${date}` : "Not started"}
                    </p>
                  ) : (
                    <span />
                  )}

                  {(sharing || requests.length > 0) && (
                    <div className="flex items-center flex-shrink-0">
                      {sharing && (
                        <ClusterPopover
                          id={`${surveyId}-sharing`}
                          openId={openPopoverId}
                          setOpenId={setOpenPopoverId}
                          label={
                            sharing.type === "group"
                              ? `View ${sharing.name} sharing`
                              : `View ${sharing.people.length} shared people`
                          }
                          content={<SharingPopoverBody sharing={sharing} />}
                        >
                          {sharing.type === "group" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                              <Users size={11} />
                              {sharing.name}
                            </span>
                          ) : (
                            <SharedAvatarStack people={sharing.people} />
                          )}
                        </ClusterPopover>
                      )}

                      {sharing && requests.length > 0 && (
                        <span className="mx-1.5 h-5 w-px bg-border" />
                      )}

                      {requests.length > 0 && (
                        <ClusterPopover
                          id={`${surveyId}-requests`}
                          openId={openPopoverId}
                          setOpenId={setOpenPopoverId}
                          label={`View ${requests.length} survey request${requests.length === 1 ? "" : "s"}`}
                          content={
                            <RequestPopoverBody
                              requests={requests}
                              surveyName={section.title}
                              surveyLink={section.link ?? "/app/about-me"}
                              onClose={() => setOpenPopoverId(null)}
                              onShare={handleShare}
                            />
                          }
                        >
                          <RequestAvatarStack requests={requests} />
                        </ClusterPopover>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
