import { Link } from "react-router";

export function Settings() {
  return (
    <div className="p-8">
      <h1 className="mb-6">Settings</h1>

      <div className="space-y-4">
        <section>
          <h2 className="mb-3">Account</h2>
          <div className="space-y-2">
            <div className="p-4 border border-gray-200 rounded">
              Email and phone number
            </div>
            <div className="p-4 border border-gray-200 rounded">
              Password and security
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3">Privacy</h2>
          <Link
            to="/app/privacy"
            className="block p-4 border border-gray-200 rounded hover:bg-gray-50"
          >
            Privacy and sharing settings
          </Link>
        </section>

        <section>
          <h2 className="mb-3">Notifications</h2>
          <div className="p-4 border border-gray-200 rounded">
            Notification preferences (placeholder)
          </div>
        </section>

        <section>
          <h2 className="mb-3">Integrations</h2>
          <Link
            to="/app/settings/integrations"
            className="block p-4 border border-gray-200 rounded hover:bg-gray-50"
          >
            Connect external services
          </Link>
        </section>

        <section>
          <h2 className="mb-3">Data</h2>
          <div className="space-y-2">
            <div className="p-4 border border-gray-200 rounded">
              Export your data
            </div>
            <div className="p-4 border border-gray-200 rounded">
              Delete account
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}