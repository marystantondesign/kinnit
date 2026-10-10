import { Link } from "react-router";

interface Survey {
  id: string;
  title: string;
  type: "app-provided" | "user-created";
  completed: boolean;
}

const mockSurveys: Survey[] = [
  {
    id: "flowers-plants-objects",
    title: "Flowers, Plants & Objects",
    type: "app-provided",
    completed: false,
  },
  {
    id: "1",
    title: "Gift Preferences Survey",
    type: "app-provided",
    completed: true,
  },
  {
    id: "2",
    title: "Celebration Style Survey",
    type: "app-provided",
    completed: false,
  },
  {
    id: "3",
    title: "Food and Dining Survey",
    type: "app-provided",
    completed: true,
  },
  {
    id: "4",
    title: "Custom Family Survey",
    type: "user-created",
    completed: true,
  },
];

export function SurveyLibrary() {
  return (
    <div className="p-8">
      <h1 className="mb-6">Survey Library</h1>
      
      <p className="mb-6 text-sm text-gray-600">
        Survey responses are part of your About Me object. They help you document preferences and share structured information with your trusted connections.
      </p>

      <section className="mb-8">
        <h2 className="mb-3">App-Provided Surveys</h2>
        <p className="mb-4 text-sm text-gray-600">
          Standard surveys designed to help you document preferences and share
          helpful information with your connections.
        </p>
        <div className="space-y-2">
          {mockSurveys
            .filter((s) => s.type === "app-provided")
            .map((survey) => (
              <Link
                key={survey.id}
                to={`/app/surveys/${survey.id}`}
                className="block p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>{survey.title}</div>
                  <div className="text-sm text-gray-500">
                    {survey.completed ? "Completed" : "Not Started"}
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3">User-Created Surveys</h2>
        <p className="mb-4 text-sm text-gray-600">
          Custom surveys you have created or received from connections.
        </p>
        <div className="space-y-2">
          {mockSurveys
            .filter((s) => s.type === "user-created")
            .map((survey) => (
              <Link
                key={survey.id}
                to={`/app/surveys/${survey.id}`}
                className="block p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>{survey.title}</div>
                  <div className="text-sm text-gray-500">
                    {survey.completed ? "Completed" : "Not Started"}
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}