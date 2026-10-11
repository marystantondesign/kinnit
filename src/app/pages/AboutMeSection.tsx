import { useParams, Link } from "react-router";
import { getSurvey } from "../config/surveys";
import { SurveyOverview } from "./survey/SurveyOverview";

const sectionContent: Record<string, { title: string; placeholder: string }> = {
  "basic-info": {
    title: "Basic Info",
    placeholder:
      "Editable area for your basic information including name, birthday, contact information, and other fundamental details you want to share with your connections.",
  },
  "important-dates": {
    title: "Important Dates",
    placeholder:
      "Editable area for anniversaries, birthdays, and other significant dates you want to share with your connections.",
  },
  "gift-preferences": {
    title: "Gift Preferences",
    placeholder:
      "Editable area for gift guidance, favorite stores, interests, hobbies, and things to avoid.",
  },
  "sizes": {
    title: "Sizes",
    placeholder:
      "Editable area for clothing sizes, shoe sizes, and other size information.",
  },
  "food-drink": {
    title: "Food & Drink Preferences",
    placeholder:
      "Editable area for favorite foods, drinks, cuisines you enjoy, and dietary preferences.",
  },
  "allergies": {
    title: "Allergies / Restrictions",
    placeholder:
      "Editable area for food allergies, sensitivities, and dietary restrictions.",
  },
  "flowers-plants": {
    title: "Flowers, Plants, or Objects",
    placeholder:
      "Editable area for favorite flowers, plants, decorative objects, and home preferences.",
  },
  "celebration": {
    title: "Celebration Preferences",
    placeholder:
      "Editable area for how you like to celebrate special occasions—whether you prefer large gatherings or intimate celebrations, surprises or planned events.",
  },
  "care": {
    title: "Care Preferences",
    placeholder:
      "Editable area for how you prefer to be supported during difficult times—whether you prefer company or solitude, practical help or emotional support.",
  },
  "communication": {
    title: "Communication Preferences",
    placeholder:
      "Editable area for preferred communication methods, response times, and ways to stay in touch.",
  },
};

export function AboutMeSection() {
  const { sectionId } = useParams();
  const survey = getSurvey(sectionId);
  if (survey) return <SurveyOverview key={survey.id} def={survey} />;

  const section = sectionId ? sectionContent[sectionId] : undefined;

  if (!section) {
    return (
      <div className="p-8">
        <Link to="/app/about-me" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to About Me
        </Link>
        <h1>Section not found</h1>
      </div>
    );
  }

  // Placeholder until this survey is defined.
  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to="/app/about-me"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to About Me
        </Link>
      </div>

      <h1 className="mb-6">{section.title}</h1>

      <div className="border border-gray-200 rounded p-6">
        <p className="text-gray-600 mb-4">{section.placeholder}</p>

        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            Placeholder for editable form fields and content management for this section.
            In the full application, you would be able to add, edit, and manage your {section.title.toLowerCase()} here.
          </p>
        </div>
      </div>
    </div>
  );
}
