import { createBrowserRouter } from "react-router";
import { OnboardingStart } from "./pages/OnboardingStart";
import { AccountSetup } from "./pages/AccountSetup";
import { ConnectionSetup } from "./pages/ConnectionSetup";
import { MainLayout } from "./layouts/MainLayout";
import { Home } from "./pages/Home";
import { PeopleList } from "./pages/PeopleList";
import { PersonDetail } from "./pages/PersonDetail";
import { PersonSectionDetail } from "./pages/PersonSectionDetail";
import { OccasionsIndex } from "./pages/OccasionsIndex";
import { OccasionDetail } from "./pages/OccasionDetail";
import { CreateOccasion } from "./pages/CreateOccasion";
import { PlansIndex } from "./pages/PlansIndex";
import { PlanDetail } from "./pages/PlanDetail";
import { CreatePlan } from "./pages/CreatePlan";
import { RemindersIndex } from "./pages/RemindersIndex";
import { ReminderDetail } from "./pages/ReminderDetail";
import { CreateReminder } from "./pages/CreateReminder";
import { AboutMe } from "./pages/AboutMe";
import { AboutMeSection } from "./pages/AboutMeSection";
import { LifeAndLegacy } from "./pages/LifeAndLegacy";
import { HealthcareWishes } from "./pages/HealthcareWishes";
import { FinancialAffairs } from "./pages/FinancialAffairs";
import { WillEstate } from "./pages/WillEstate";
import { PrivacySettings } from "./pages/PrivacySettings";
import { SurveyLibrary } from "./pages/SurveyLibrary";
import { SurveyDetail } from "./pages/SurveyDetail";
import { Settings } from "./pages/Settings";
import { IntegrationsIndex } from "./pages/IntegrationsIndex";
import { IntegrationConnect } from "./pages/IntegrationConnect";
import { IntegrationManage } from "./pages/IntegrationManage";
import { AllActionItems, AllActivity } from "./pages/NotificationsPlaceholder";
import { ErrorPage } from "./pages/ErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <OnboardingStart />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/account-setup",
    element: <AccountSetup />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/connection-setup",
    element: <ConnectionSetup />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/app",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "people", element: <PeopleList /> },
      { path: "people/:personId", element: <PersonDetail /> },
      { path: "people/:personId/:sectionId", element: <PersonSectionDetail /> },
      { path: "occasions", element: <OccasionsIndex /> },
      { path: "occasions/create", element: <CreateOccasion /> },
      { path: "occasions/:occasionId", element: <OccasionDetail /> },
      { path: "occasions/:occasionId/edit", element: <CreateOccasion /> },
      { path: "plans", element: <PlansIndex /> },
      { path: "plans/create", element: <CreatePlan /> },
      { path: "plans/:planId", element: <PlanDetail /> },
      { path: "reminders", element: <RemindersIndex /> },
      { path: "reminders/create", element: <CreateReminder /> },
      { path: "reminders/:reminderId", element: <ReminderDetail /> },
      { path: "about-me", element: <AboutMe /> },
      { path: "about-me/:sectionId", element: <AboutMeSection /> },
      { path: "about-me/life-legacy", element: <LifeAndLegacy /> },
      { path: "about-me/life-legacy/healthcare-wishes", element: <HealthcareWishes /> },
      { path: "about-me/life-legacy/financial-affairs", element: <FinancialAffairs /> },
      { path: "about-me/life-legacy/will-estate", element: <WillEstate /> },
      { path: "privacy", element: <PrivacySettings /> },
      { path: "survey-library", element: <SurveyLibrary /> },
      { path: "surveys/:surveyId", element: <SurveyDetail /> },
      { path: "settings", element: <Settings /> },
      { path: "settings/integrations", element: <IntegrationsIndex /> },
      { path: "settings/integrations/:integrationId/connect", element: <IntegrationConnect /> },
      { path: "settings/integrations/:integrationId/manage", element: <IntegrationManage /> },
      { path: "notifications/action-items", element: <AllActionItems /> },
      { path: "notifications/activity", element: <AllActivity /> },
    ],
  },
]);