import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PersonPicker } from "../components/PersonPicker";

type PoaStatus = "yes" | "no" | "not-sure";

const poaOptions: { value: PoaStatus; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not-sure", label: "Not sure" },
];

export function FinancialAffairs() {
  const navigate = useNavigate();
  const [decisionMakerId, setDecisionMakerId] = useState<string | null>(null);
  const [poaStatus, setPoaStatus] = useState<PoaStatus | "">("");
  const [notes, setNotes] = useState("");

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

      <h1 className="mb-1">Financial affairs & decision-maker</h1>
      <p className="text-sm text-gray-500 mb-6">
        Who should manage your financial affairs if you can't, and what they'll need to get started.
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">Decision-maker</h2>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Who will manage your financial affairs
            </label>
            <PersonPicker value={decisionMakerId} onChange={setDecisionMakerId} />
          </div>
        </section>

        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">Power of attorney</h2>
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Do you have a financial power of attorney document
            </label>
            <div className="flex flex-wrap gap-2">
              {poaOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPoaStatus(opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    poaStatus === opt.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">Notes for your decision-maker</h2>
          <div>
            <label
              htmlFor="notes"
              className="block text-sm text-gray-600 mb-1"
            >
              Notes for your decision-maker
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Accounts, where to find statements, who to contact..."
              rows={5}
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
