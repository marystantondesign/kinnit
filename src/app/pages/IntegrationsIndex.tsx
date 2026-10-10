import { Link, useNavigate } from "react-router";
import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
}

const availableIntegrations: Integration[] = [
  {
    id: "pinterest",
    name: "Pinterest",
    description: "Used for inspiration boards and event mood boards",
    connected: false,
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Used for playlists connected to celebrations or gatherings",
    connected: true,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Overlay calendar events on your home timeline",
    connected: false,
  },
  {
    id: "apple-calendar",
    name: "Apple Calendar",
    description: "Overlay calendar events on your home timeline",
    connected: false,
  },
  {
    id: "airbnb",
    name: "Airbnb",
    description: "Used for accommodation planning and travel coordination",
    connected: false,
  },
  {
    id: "eventbrite",
    name: "Eventbrite",
    description: "Used for event ticketing and registration management",
    connected: false,
  },
  {
    id: "etsy",
    name: "Etsy",
    description: "Used for gift ideas and handmade item shopping",
    connected: false,
  },
  {
    id: "wishlist",
    name: "Wishlist Services",
    description: "Used for shared wishlists and gift registries",
    connected: false,
  },
];

export function IntegrationsIndex() {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState<Integration[]>(availableIntegrations);

  const handleConnect = (id: string) => {
    navigate(`/app/settings/integrations/${id}/connect`);
  };

  const handleManage = (id: string) => {
    navigate(`/app/settings/integrations/${id}/manage`);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to="/app/settings"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Settings
        </Link>
      </div>

      <h1 className="mb-6">Integrations</h1>

      <p className="mb-6 text-gray-600">
        Integrations allow you to link content from external services into plans, occasions, or personal preferences. Connect the services you use to enhance your experience.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="p-4 border border-gray-200 rounded"
          >
            <div className="mb-3">
              <h2 className="mb-1">{integration.name}</h2>
              <p className="text-sm text-gray-600">{integration.description}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">Status: </span>
                <span className={integration.connected ? "text-green-600" : "text-gray-400"}>
                  {integration.connected ? "Connected" : "Not Connected"}
                </span>
              </div>

              {integration.connected ? (
                <button
                  onClick={() => handleManage(integration.id)}
                  className="px-4 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
                >
                  Manage
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(integration.id)}
                  className="px-4 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}