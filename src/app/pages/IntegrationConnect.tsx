import { useParams, Link, useNavigate } from "react-router";

const integrationDetails: Record<string, { name: string; description: string }> = {
  pinterest: {
    name: "Pinterest",
    description: "Used for inspiration boards and event mood boards",
  },
  spotify: {
    name: "Spotify",
    description: "Used for playlists connected to celebrations or gatherings",
  },
  "google-calendar": {
    name: "Google Calendar",
    description: "Overlay calendar events on your home timeline",
  },
  "apple-calendar": {
    name: "Apple Calendar",
    description: "Overlay calendar events on your home timeline",
  },
  airbnb: {
    name: "Airbnb",
    description: "Used for accommodation planning and travel coordination",
  },
  eventbrite: {
    name: "Eventbrite",
    description: "Used for event ticketing and registration management",
  },
  etsy: {
    name: "Etsy",
    description: "Used for gift ideas and handmade item shopping",
  },
  wishlist: {
    name: "Wishlist Services",
    description: "Used for shared wishlists and gift registries",
  },
};

export function IntegrationConnect() {
  const { integrationId } = useParams();
  const navigate = useNavigate();
  const integration = integrationId ? integrationDetails[integrationId] : undefined;

  if (!integration) {
    return (
      <div className="p-8">
        <Link
          to="/app/settings/integrations"
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Integrations
        </Link>
        <h1>Integration not found</h1>
      </div>
    );
  }

  const handleConnect = () => {
    // Placeholder: In a real app, this would initiate OAuth or API key flow
    alert(`Connection flow for ${integration.name} would happen here. This is a placeholder.`);
    navigate("/app/settings/integrations");
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to="/app/settings/integrations"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Integrations
        </Link>
      </div>

      <h1 className="mb-6">Connect {integration.name}</h1>

      <div className="max-w-2xl">
        <div className="p-6 border border-gray-200 rounded mb-6">
          <h2 className="mb-3">{integration.name}</h2>
          <p className="text-gray-600 mb-4">{integration.description}</p>

          <div className="p-4 bg-gray-50 rounded mb-4">
            <p className="text-sm text-gray-600 mb-2">
              By connecting {integration.name}, you'll be able to:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Link content from {integration.name} to your occasions and plans</li>
              <li>Access your {integration.name} content within the app</li>
              <li>Collaborate with others using shared {integration.name} resources</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            This is a placeholder connection flow. Real authentication is not implemented.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Connect {integration.name}
            </button>
            <Link
              to="/app/settings/integrations"
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 inline-block"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}