import { useParams, Link } from "react-router";
import { isSurveyCompleted } from "../utils/surveyStorage";

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
  
  // Special handling for flowers-plants section
  if (sectionId === "flowers-plants") {
    const isCompleted = isSurveyCompleted("flowers-plants-objects");
    
    return (
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <Link
            to="/app/about-me"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to About Me
          </Link>
        </div>

        <h1 className="mb-4 md:mb-6">Flowers, Plants, or Objects</h1>

        <div className="border border-gray-200 rounded p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
            <div className="mb-3 md:mb-0">
              <h2 className="mb-1">Flowers, Plants & Objects</h2>
              <p className="text-sm text-gray-600">
                Status: <span className={isCompleted ? "text-green-600" : "text-gray-500"}>
                  {isCompleted ? "Completed" : "Not Started"}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Link
              to="/app/surveys/flowers-plants-objects"
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-center"
            >
              {isCompleted ? "View Responses" : "Start Survey"}
            </Link>
            {isCompleted && (
              <Link
                to="/app/surveys/flowers-plants-objects"
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-center"
              >
                Edit Survey
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
          <h2 className="text-sm font-medium mb-2">Privacy Controls</h2>
          <p className="text-sm text-gray-600">
            You can control which connections see this information from your Privacy Settings.
          </p>
        </div>
      </div>
    );
  }

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

      <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
        <h2 className="text-sm font-medium mb-2">Privacy Controls</h2>
        <p className="text-sm text-gray-600">
          You can control which connections see this information from your Privacy Settings.
        </p>
      </div>
    </div>
  );
}