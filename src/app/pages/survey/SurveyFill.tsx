import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Check, ChevronRight, Mic } from "lucide-react";
import type { SurveyDef } from "../../config/surveys";
import { answerCount, finishSurvey, setLastSection, useSurveyState } from "../../utils/surveyAnswers";
import { BringItInCard, BringItInMobile } from "../../components/surveys/Integrations";
import { AnswersSummary, SectionEditor, sectionHint } from "../../components/surveys/SectionEditors";
import { BackLink, ProgressBar, TagOptional } from "../../components/surveys/SurveyBits";

// Tap route: one section at a time. Changes save as you go.

function SavedIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[14px] text-gray-500" aria-live="polite">
      <Check size={16} strokeWidth={2} aria-hidden />
      Saved
    </span>
  );
}

export function SurveyFill({ def }: { def: SurveyDef }) {
  const state = useSurveyState(def.id);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const base = `/app/about-me/${def.id}`;

  const requested = params.get("section");
  const index = Math.max(0, def.sections.findIndex((s) => s.id === (requested ?? state.lastSection)));
  const section = def.sections[index];
  const next = def.sections[index + 1];
  const prev = def.sections[index - 1];
  const total = def.sections.length;

  useEffect(() => {
    setLastSection(def.id, section.id);
    document.querySelector("main")?.scrollTo({ top: 0 });
  }, [def.id, section.id]);

  const go = (id: string) => setParams({ section: id }, { replace: true });
  const onNext = () => {
    if (next) go(next.id);
    else {
      finishSurvey(def.id);
      navigate(base);
    }
  };
  const nextLabel = next ? `Next: ${next.title.charAt(0).toLowerCase()}${next.title.slice(1)}` : "Finish";
  const talkHref = `${base}/talk?section=${section.id}`;

  return (
    <div className="px-6 lg:px-10 pt-5 lg:pt-8 pb-32 lg:pb-12 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <BackLink />
        <div className="flex items-center gap-5">
          <SavedIndicator />
          <Link
            to={talkHref}
            className="hidden lg:inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Mic size={17} strokeWidth={2} />
            Talk to Kinnit instead
          </Link>
        </div>
      </div>

      <h1 className="mt-3 lg:mt-2 text-[28px] lg:text-[34px] leading-tight font-bold text-gray-900">{def.title}</h1>
      <div className="mt-3">
        <ProgressBar
          value={index + 1}
          total={total}
          label={
            <>
              {index + 1} of {total}
              <span className="hidden lg:inline"> sections</span>
            </>
          }
        />
      </div>

      <div className="mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_320px] xl:grid-cols-[260px_minmax(0,1fr)_360px] gap-6 lg:gap-8 items-start">
        {/* Section list (desktop) */}
        <nav aria-label="Sections" className="hidden lg:block">
          <ol className="space-y-1">
            {def.sections.map((s, i) => {
              const current = i === index;
              const done = !current && answerCount(s, state.sections[s.id], state.attachments) > 0;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(s.id)}
                    aria-current={current ? "step" : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[15px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      current ? "bg-gray-100 text-gray-900 font-semibold" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`size-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        current ? "bg-gray-900" : done ? "bg-gray-900 text-white" : "border-[1.5px] border-gray-300"
                      }`}
                    >
                      {current ? <span className="size-2 rounded-full bg-white" /> : done ? <Check size={13} strokeWidth={2.5} /> : null}
                    </span>
                    <span className="flex-1 min-w-0">{s.title}</span>
                    {done && <span className="sr-only">(answered)</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Current section */}
        <section aria-labelledby="section-title" className="lg:rounded-2xl lg:border lg:border-gray-200 lg:bg-white lg:p-8">
          <div className="flex items-center gap-2">
            <h2 id="section-title" className="text-[22px] lg:text-[26px] font-semibold text-gray-900">
              {section.title}
            </h2>
            {section.optional && <TagOptional />}
          </div>
          <p className="text-[15px] text-gray-500 mt-1 mb-5">
            <span className="lg:hidden">{sectionHint(section, true)}</span>
            <span className="hidden lg:inline">{sectionHint(section)}</span>
          </p>
          <div className="lg:hidden">
            <SectionEditor key={`m-${section.id}`} def={def} section={section} state={state} compact />
          </div>
          <div className="hidden lg:block">
            <SectionEditor key={`d-${section.id}`} def={def} section={section} state={state} />
          </div>

          {def.bringItIn && (
            <div className="mt-6 lg:hidden">
              <BringItInMobile def={def} sectionId={section.id} />
            </div>
          )}

          <div className="hidden lg:flex items-center justify-between gap-3 mt-8 pt-6 border-t border-gray-100">
            {prev ? (
              <button
                type="button"
                onClick={() => go(prev.id)}
                className="h-11 px-5 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 hover:bg-gray-50"
              >
                Back
              </button>
            ) : (
              <Link to={base} className="h-11 px-5 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 hover:bg-gray-50 inline-flex items-center">
                Back
              </Link>
            )}
            <button
              type="button"
              onClick={onNext}
              className="h-11 px-5 rounded-xl bg-gray-900 text-white text-[15px] font-medium hover:bg-gray-800 inline-flex items-center gap-2"
            >
              {next && <ChevronRight size={17} strokeWidth={2} />}
              {nextLabel}
            </button>
          </div>
        </section>

        {/* Right column (desktop) */}
        <aside className="hidden lg:block space-y-5">
          <BringItInCard def={def} sectionId={section.id} />
          <AnswersSummary section={section} state={state} />
        </aside>
      </div>

      {/* Sticky bar (mobile) */}
      <div
        className="lg:hidden fixed left-0 right-0 bottom-0 z-20 bg-white border-t border-gray-200 px-6 pt-3"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-3">
          <Link
            to={talkHref}
            aria-label="Talk to Kinnit instead"
            className="size-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-900 flex-shrink-0 hover:bg-gray-50"
          >
            <Mic size={20} strokeWidth={2} />
          </Link>
          <button
            type="button"
            onClick={onNext}
            className="flex-1 h-12 rounded-xl bg-gray-900 text-white text-[16px] font-medium hover:bg-gray-800 truncate px-4"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
