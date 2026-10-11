import { Navigate, useParams } from "react-router";
import { getSurvey } from "../../config/surveys";
import { SurveyFill } from "./SurveyFill";
import { SurveyTalk } from "./SurveyTalk";

// /app/about-me/:sectionId/answer and /talk for the redesigned surveys.

export function SurveyAnswerRoute() {
  const def = getSurvey(useParams().sectionId);
  return def ? <SurveyFill key={def.id} def={def} /> : <Navigate to="/app/about-me" replace />;
}

export function SurveyTalkRoute() {
  const def = getSurvey(useParams().sectionId);
  return def ? <SurveyTalk key={def.id} def={def} /> : <Navigate to="/app/about-me" replace />;
}

// Old links (/app/surveys/:surveyId) from notifications and the survey library.
const LEGACY: Record<string, string> = {
  "gift-preferences": "gift-preferences",
  "food-drink": "food-drink",
  "important-dates": "important-dates",
  "1": "gift-preferences",
  "3": "food-drink",
  "flowers-plants-objects": "flowers-plants",
  "flowers-plants": "flowers-plants",
};

export function LegacySurveyRedirect() {
  const { surveyId = "" } = useParams();
  const target = LEGACY[surveyId] ?? surveyId;
  return <Navigate to={`/app/about-me/${target}`} replace />;
}
