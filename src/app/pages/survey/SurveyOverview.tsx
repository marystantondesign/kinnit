import { Link } from "react-router";
import { ChevronRight, List, Mic } from "lucide-react";
import type { SurveyDef } from "../../config/surveys";
import { getResolvedSurveyRequestIds } from "../../utils/surveyRequests";
import { getSharingTarget, sharingSummary } from "../../utils/aboutMeSharing";
import { answerCount, useSurveyState } from "../../utils/surveyAnswers";
import { IntegrationTiles } from "../../components/surveys/Integrations";
import { BackLink, IconCircle, SectionLabel, SharingLine, StatusPill, TagOptional } from "../../components/surveys/SurveyBits";

// What opens when a survey card on About Me is tapped.

export function SurveyOverview({ def }: { def: SurveyDef }) {
  const state = useSurveyState(def.id);
  const completed = state.status === "completed";
  const started = state.status !== "not-started";
  const sharing = completed ? sharingSummary(getSharingTarget(def.id, getResolvedSurveyRequestIds())) : "";
  const base = `/app/about-me/${def.id}`;
  const resume = state.lastSection ? `?section=${state.lastSection}` : "";

  const talkLabel = completed ? "Add more" : started ? "Continue" : "Start talking";
  const tapLabel = completed ? "Review answers" : started ? "Continue" : "Start survey";

  return (
    <div className="px-6 md:px-10 py-6 md:py-10 max-w-[1240px] mx-auto">
      <BackLink />

      <div className="mt-5 md:mt-7 flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-6">
        <div className="min-w-0">
          <h1 className="text-[30px] md:text-[38px] leading-tight font-bold text-gray-900">{def.title}</h1>
          <p className="text-[15px] md:text-[17px] text-gray-500 mt-1">{def.intro}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:justify-end flex-shrink-0">
          <StatusPill status={state.status} />
          <SharingLine completed={completed} summary={sharing} />
        </div>
      </div>

      {/* Two equal ways to answer */}
      <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <section className="rounded-2xl bg-gray-900 text-white p-6 md:p-8 flex flex-col">
          <IconCircle dark size="lg">
            <Mic size={20} strokeWidth={1.75} />
          </IconCircle>
          <h2 className="mt-5 text-[20px] md:text-[22px] font-semibold">Talk it through with Kinnit</h2>
          <p className="mt-2 text-[15px] leading-6 text-gray-300 flex-1">
            Say whatever comes to mind. Kinnit asks a few easy questions and turns it into answers you can review before anything is saved.
          </p>
          <Link
            to={`${base}/talk`}
            aria-label={started && !completed ? "Continue talking" : undefined}
            className="mt-5 self-start inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-white text-gray-900 text-[15px] font-medium hover:bg-gray-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <Mic size={17} strokeWidth={2} />
            {talkLabel}
          </Link>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 flex flex-col">
          <IconCircle size="lg">
            <List size={20} strokeWidth={1.75} />
          </IconCircle>
          <h2 className="mt-5 text-[20px] md:text-[22px] font-semibold text-gray-900">Fill it out yourself</h2>
          <p className="mt-2 text-[15px] leading-6 text-gray-500 flex-1">
            Tap through quick choices at your own pace. You can switch to talking any time.
          </p>
          <Link
            to={`${base}/answer${resume}`}
            aria-label={started && !completed ? "Continue survey" : undefined}
            className="mt-5 self-start inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-gray-200 bg-white text-gray-900 text-[15px] font-medium hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight size={17} strokeWidth={2} />
            {tapLabel}
          </Link>
        </section>
      </div>

      {/* What's in it */}
      <div className="mt-10">
        <SectionLabel>What's in it</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {def.sections.map((s) => {
            const n = answerCount(s, state.sections[s.id], state.attachments);
            const Icon = s.icon;
            return (
              <Link
                key={s.id}
                to={`${base}/answer?section=${s.id}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-3">
                  <IconCircle>
                    <Icon size={17} strokeWidth={1.75} />
                  </IconCircle>
                  <span className="text-[16px] font-semibold text-gray-900">{s.title}</span>
                  {s.optional && <TagOptional />}
                </span>
                <span className="mt-3 text-[14px] leading-[22px] text-gray-500 flex-1">{s.prompt}</span>
                <span className="mt-3 text-[13px] text-gray-400">
                  {n ? `${n} answer${n === 1 ? "" : "s"}` : "Not started"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {def.integrations.length > 0 && (
        <div className="mt-10">
          <SectionLabel>Pull in what you've already saved</SectionLabel>
          <IntegrationTiles def={def} sectionId={def.sections[0].id} />
        </div>
      )}
    </div>
  );
}
