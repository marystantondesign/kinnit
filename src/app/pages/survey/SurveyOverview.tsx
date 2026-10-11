import { Link } from "react-router";
import { ArrowLeft, List, Mic } from "lucide-react";
import type { SurveyDef } from "../../config/surveys";
import { getResolvedSurveyRequestIds } from "../../utils/surveyRequests";
import { getSharingTarget, sharingSummary } from "../../utils/aboutMeSharing";
import { answerCount, useSurveyState } from "../../utils/surveyAnswers";
import { IntegrationTiles } from "../../components/surveys/Integrations";
import { IconCircle, RoundIconLink, SectionLabel, SharingLine, StatusPill, TagOptional } from "../../components/surveys/SurveyBits";

// What opens when a survey card on About Me is tapped.

export function SurveyOverview({ def }: { def: SurveyDef }) {
  const state = useSurveyState(def.id);
  const completed = state.status === "completed";
  const started = state.status !== "not-started";
  const sharing = completed ? sharingSummary(getSharingTarget(def.id, getResolvedSurveyRequestIds())) : "";
  const base = `/app/about-me/${def.id}`;
  const resume = state.lastSection ? `?section=${state.lastSection}` : "";

  const talkLabel = completed ? "Add more" : started ? "Continue" : "Talk it through";
  const tapLabel = completed ? "Review answers" : started ? "Continue" : "Fill it out yourself";

  return (
    <div className="px-6 md:px-10 py-5 md:py-6 max-w-[1240px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
        <div className="flex items-start gap-4 min-w-0">
          <RoundIconLink to="/app/about-me" label="Back to About Me">
            <ArrowLeft size={18} strokeWidth={2} />
          </RoundIconLink>
          <div className="min-w-0">
            <h1 className="text-[28px] md:text-[32px] leading-tight font-bold text-gray-900">{def.title}</h1>
            <p className="text-[15px] md:text-[16px] text-gray-500 mt-0.5">{def.intro}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:justify-end flex-shrink-0 pl-16 md:pl-0">
          <StatusPill status={state.status} />
          <SharingLine completed={completed} summary={sharing} />
        </div>
      </div>

      {/* Two equal ways to answer, in one slim bar */}
      <section
        aria-labelledby="how-heading"
        className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 md:px-7 md:min-h-[80px] flex flex-col md:flex-row md:items-center gap-4 md:gap-8"
      >
        <div className="flex-1 min-w-0">
          <h2 id="how-heading" className="text-[16px] font-semibold text-gray-900">
            How would you like to do this?
          </h2>
          <p className="text-[14px] leading-5 text-gray-600 mt-0.5">
            Kinnit asks a few easy questions and you review before anything is saved. Or tap through at your own pace. Switch any time.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
          <Link
            to={`${base}/talk`}
            aria-label={started && !completed ? "Continue talking" : undefined}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-gray-900 text-white text-[15px] font-medium hover:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Mic size={17} strokeWidth={2} />
            {talkLabel}
          </Link>
          <Link
            to={`${base}/answer${resume}`}
            aria-label={started && !completed ? "Continue survey" : undefined}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-gray-200 bg-white text-gray-900 text-[15px] font-medium hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <List size={17} strokeWidth={2} />
            {tapLabel}
          </Link>
        </div>
      </section>

      {/* What's in it */}
      <div className="mt-6">
        <SectionLabel>What's in it</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {def.sections.map((s) => {
            const n = answerCount(s, state.sections[s.id], state.attachments);
            const Icon = s.icon;
            return (
              <Link
                key={s.id}
                to={`${base}/answer?section=${s.id}`}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-3.5 flex flex-col hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-3">
                  <IconCircle size="sm">
                    <Icon size={16} strokeWidth={1.75} />
                  </IconCircle>
                  <span className="text-[15px] font-semibold text-gray-900">{s.title}</span>
                  {s.optional && <TagOptional />}
                </span>
                <span className="mt-2 text-[14px] leading-5 text-gray-500 flex-1">{s.prompt}</span>
                <span className="mt-2 text-[13px] text-gray-400">{n ? `${n} answer${n === 1 ? "" : "s"}` : "Not started"}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {def.integrations.length > 0 && (
        <div className="mt-6">
          <SectionLabel>Pull in what you've already saved</SectionLabel>
          <IntegrationTiles def={def} sectionId={def.sections[0].id} />
        </div>
      )}
    </div>
  );
}
