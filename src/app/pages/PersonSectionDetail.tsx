import { useParams, Link } from "react-router";

interface PersonData {
  id: string;
  name: string;
  initials: string;
  relationship: string;
}

// Mock data - in a real app, this would come from a database
const mockPeople: Record<string, PersonData> = {
  "1": { id: "1", name: "Sarah Johnson", initials: "SJ", relationship: "Friend" },
  "2": { id: "2", name: "Michael Chen", initials: "MC", relationship: "Partner" },
  "3": { id: "3", name: "Emma Davis", initials: "ED", relationship: "Sister" },
  "4": { id: "4", name: "David Martinez", initials: "DM", relationship: "Coworker" },
  "5": { id: "5", name: "Lisa Anderson", initials: "LA", relationship: "Friend" },
  "6": { id: "6", name: "James Wilson", initials: "JW", relationship: "Brother" },
};

const sectionContent: Record<string, { title: string; content: string }> = {
  "important-dates": {
    title: "Important Dates",
    content:
      "Birthday: April 15\nAnniversary: June 10\n\nPlaceholder for other important dates this person has chosen to share with you.",
  },
  "gift-preferences": {
    title: "Gift Preferences",
    content:
      "Placeholder for gift guidance, favorite stores, interests, hobbies, and things to avoid that this person has shared with you.",
  },
  sizes: {
    title: "Sizes",
    content:
      "Placeholder for clothing sizes, shoe sizes, and other size information this person has shared with you.",
  },
  "food-drink": {
    title: "Food & Drink Preferences",
    content:
      "Placeholder for favorite foods, favorite drinks, cuisines they enjoy, and dietary preferences this person has shared with you.",
  },
  allergies: {
    title: "Allergies / Restrictions",
    content:
      "Placeholder for food allergies, sensitivities, and dietary restrictions this person has shared with you.",
  },
  "flowers-plants": {
    title: "Flowers, Plants, or Objects",
    content:
      "Placeholder for favorite flowers, plants, decorative objects, and home preferences this person has shared with you.",
  },
  celebration: {
    title: "Celebration Preferences",
    content:
      "Placeholder for how this person likes to celebrate special occasions—whether they prefer large gatherings or intimate celebrations, surprises or planned events.",
  },
  care: {
    title: "Care Preferences",
    content:
      "Placeholder for how this person prefers to be supported during difficult times—whether they prefer company or solitude, practical help or emotional support.",
  },
  communication: {
    title: "Communication Preferences",
    content:
      "Placeholder for preferred communication methods, response times, and ways to stay in touch that this person has shared with you.",
  },
  "survey-responses": {
    title: "Survey Responses",
    content:
      "Placeholder for survey responses this person has completed and chosen to share with you.",
  },
  "life-legacy": {
    title: "Life & Legacy",
    content:
      "Placeholder for end-of-life preferences, funeral or memorial wishes, and legacy information this person has chosen to share with you.",
  },
};

export function PersonSectionDetail() {
  const { personId, sectionId } = useParams();
  const section = sectionContent[sectionId || ""];
  const person = personId ? mockPeople[personId] : undefined;

  if (!section) {
    return (
      <div className="p-8">
        <h1>Section not found</h1>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="p-8">
        <h1>Person not found</h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to={`/app/people/${personId}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to {person.name}
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
          {person.initials}
        </div>
        <div>
          <h1 className="mb-1">{section.title}</h1>
          <p className="text-sm text-gray-600">{person.name}</p>
        </div>
      </div>

      <div className="border border-gray-200 rounded p-6">
        <p className="text-gray-700 whitespace-pre-line">{section.content}</p>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          This information is read-only. Only {person.name} can update their About Me
          sections.
        </p>
      </div>
    </div>
  );
}