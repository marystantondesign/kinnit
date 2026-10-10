import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PersonPicker } from "../components/PersonPicker";

type WillStatus = "yes" | "no" | "not-sure";

const willOptions: { value: WillStatus; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not-sure", label: "Not sure" },
];

export function WillEstate() {
  const navigate = useNavigate();
  const [willStatus, setWillStatus] = useState<WillStatus | "">("");
  const [storageLocation, setStorageLocation] = useState("");
  const [executorId, setExecutorId] = useState<string | null>(null);
  const [attorneyContact, setAttorneyContact] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/app/about-me/life-legacy");
  };

  return (
    <div className="p-8">
      <div className="mb-2">
        <Link
          to="/app/about-me/life-legacy"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Life & Legacy
        </Link>
      </div>

      <h1 className="mb-1">Will & estate reference</h1>
      <p className="text-sm text-gray-500 mb-6">
        A pointer to your will and who's responsible for carrying it out. Kinnit doesn't draft legal
        documents — this just keeps the reference somewhere your executor can find it.
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">Do you have a will</h2>
          <div className="flex flex-wrap gap-2">
            {willOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWillStatus(opt.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  willStatus === opt.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">Where it's stored</h2>
          <div>
            <label
              htmlFor="storageLocation"
              className="block text-sm text-gray-600 mb-1"
            >
              Where it's stored
            </label>
            <input
              type="text"
              id="storageLocation"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder="e.g., Safe deposit box at First National, home safe, attorney's office..."
              className="w-full px-3 py-2 border border-gray-200 rounded"
            />
          </div>
        </section>

        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">Executor</h2>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Who is your executor
            </label>
            <PersonPicker value={executorId} onChange={setExecutorId} />
          </div>
        </section>

        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">Attorney or advisor contact</h2>
          <div>
            <label
              htmlFor="attorneyContact"
              className="block text-sm text-gray-600 mb-1"
            >
              Attorney or advisor contact (optional)
            </label>
            <input
              type="text"
              id="attorneyContact"
              value={attorneyContact}
              onChange={(e) => setAttorneyContact(e.target.value)}
              placeholder="Name, firm, phone number, or email..."
              className="w-full px-3 py-2 border border-gray-200 rounded"
            />
          </div>
        </section>

        <div className="pt-2">
          <button
            type="submit"
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
