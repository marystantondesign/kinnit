import { useState } from "react";
import { useNavigate } from "react-router";

interface Invite {
  id: string;
  contact: string;
  status: "pending" | "accepted";
}

export function ConnectionSetup() {
  const navigate = useNavigate();
  const [inviteContact, setInviteContact] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteContact) {
      setInvites([
        ...invites,
        {
          id: Date.now().toString(),
          contact: inviteContact,
          status: "pending",
        },
      ]);
      setInviteContact("");
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="mb-4">Connection Setup</h1>
        <p className="mb-8">
          Both you and the person you invite must agree before becoming
          connected. Connections are private and consent-based. Each person object represents a real individual in your trusted network.
        </p>

        <div className="mb-8">
          <h2 className="mb-4">Invite Someone</h2>
          <form onSubmit={handleSendInvite} className="flex gap-2">
            <input
              type="text"
              placeholder="Email or phone number"
              value={inviteContact}
              onChange={(e) => setInviteContact(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Send Invite
            </button>
          </form>
        </div>

        <div className="mb-8">
          <h2 className="mb-4">Pending Invites</h2>
          {invites.filter((i) => i.status === "pending").length === 0 ? (
            <p className="text-gray-500">No pending invites</p>
          ) : (
            <div className="space-y-2">
              {invites
                .filter((i) => i.status === "pending")
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="p-3 border border-gray-200 rounded"
                  >
                    {invite.contact} - Pending
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="mb-4">Accepted Connections</h2>
          {invites.filter((i) => i.status === "accepted").length === 0 ? (
            <p className="text-gray-500">No connections yet</p>
          ) : (
            <div className="space-y-2">
              {invites
                .filter((i) => i.status === "accepted")
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="p-3 border border-gray-200 rounded"
                  >
                    {invite.contact} - Connected
                  </div>
                ))}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/app")}
          className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Continue to App
        </button>
      </div>
    </div>
  );
}