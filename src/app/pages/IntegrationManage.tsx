import { useParams, Link, useNavigate } from "react-router";
import { useState } from "react";

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

export function IntegrationManage() {
  const { integrationId } = useParams();
  const navigate = useNavigate();
  const integration = integrationId ? integrationDetails[integrationId] : undefined;
  const [isDisconnecting, setIsDisconnecting] = useState(false);

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

  const handleDisconnect = () => {
    if (confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      // Placeholder: In a real app, this would revoke access tokens
      alert(`${integration.name} has been disconnected. This is a placeholder action.`);
      navigate("/app/settings/integrations");
    }
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

      <h1 className="mb-6">Manage {integration.name}</h1>

      <div className="max-w-2xl">
        <div className="p-6 border border-gray-200 rounded mb-6">
          <h2 className="mb-3">{integration.name}</h2>
          <p className="text-gray-600 mb-4">{integration.description}</p>

          <div className="mb-6">
            <div className="text-sm mb-2">
              <span className="text-gray-500">Status: </span>
              <span className="text-green-600">Connected</span>
            </div>
            <div className="text-sm text-gray-500">
              Connected on March 10, 2026
            </div>
          </div>

          <section className="mb-6">
            <h3 className="text-base mb-2">Permissions</h3>
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-2">
                This integration has access to:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Read your {integration.name} content</li>
                <li>Link items to occasions and plans</li>
                <li>View shared content from collaborators</li>
              </ul>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="text-base mb-2">Usage</h3>
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                This integration is not yet linked to any occasions or plans.
              </p>
            </div>
          </section>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-gray-100 rounded text-sm hover:bg-gray-200 text-red-600"
            >
              Disconnect {integration.name}
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            Placeholder management interface. Real integration features will be added in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}