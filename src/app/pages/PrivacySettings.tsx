interface VisibilitySection {
  section: string;
  connections: string[];
}

const mockVisibilitySettings: VisibilitySection[] = [
  {
    section: "Basic Info",
    connections: ["All Connections"],
  },
  {
    section: "Important Dates",
    connections: ["All Connections"],
  },
  {
    section: "Gift Preferences",
    connections: ["Sarah Johnson", "Michael Chen"],
  },
  {
    section: "Sizes",
    connections: ["Sarah Johnson"],
  },
  {
    section: "Food and Drink Preferences",
    connections: ["All Connections"],
  },
  {
    section: "Allergies / Restrictions",
    connections: ["All Connections"],
  },
  {
    section: "Celebration Preferences",
    connections: ["Sarah Johnson", "Michael Chen"],
  },
  {
    section: "Care Preferences",
    connections: ["Sarah Johnson"],
  },
  {
    section: "Life & Legacy",
    connections: ["Sarah Johnson"],
  },
];

export function PrivacySettings() {
  return (
    <div className="p-8">
      <h1 className="mb-6">Privacy and Sharing Settings</h1>

      <p className="mb-6">
        Control which connections can see each section of your About Me information. You can
        choose to share different information with different people.
      </p>

      <div className="space-y-4">
        {mockVisibilitySettings.map((setting) => (
          <div
            key={setting.section}
            className="border border-gray-200 rounded p-4"
          >
            <div className="mb-2">{setting.section}</div>
            <div className="text-sm text-gray-600">
              Visible to: {setting.connections.join(", ")}
            </div>
            <button className="text-sm text-blue-600 mt-2 hover:underline">
              Edit visibility
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}