// Simple localStorage utility for survey responses

export interface SurveyResponse {
  surveyId: string;
  completed: boolean;
  lastSaved: string;
  responses: Record<string, any>;
}

export function saveSurveyResponse(surveyId: string, responses: Record<string, any>): void {
  const surveyData: SurveyResponse = {
    surveyId,
    completed: true,
    lastSaved: new Date().toISOString(),
    responses,
  };
  
  localStorage.setItem(`survey_${surveyId}`, JSON.stringify(surveyData));
}

export function getSurveyResponse(surveyId: string): SurveyResponse | null {
  const data = localStorage.getItem(`survey_${surveyId}`);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function isSurveyCompleted(surveyId: string): boolean {
  const response = getSurveyResponse(surveyId);
  return response?.completed ?? false;
}
