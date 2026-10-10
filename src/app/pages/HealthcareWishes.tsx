import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PersonPicker } from "../components/PersonPicker";

type Approach = "comfort-focused" | "all-available-measures" | "decision-maker-judgment";

const approachOptions: { value: Approach; label: string }[] = [
  { value: "comfort-focused", label: "Comfort-focused" },
  { value: "all-available-measures", label: "All available measures" },
  { value: "decision-maker-judgment", label: "Decision-maker's judgment" },
];

export function HealthcareWishes() {
  const navigate = useNavigate();
  const [decisionMakerId, setDecisionMakerId] = useState<string | null>("2");
  const [approach, setApproach] = useState<Approach | "">("");
  const [additionalWishes, setAdditionalWishes] = useState("");

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

      <h1 className="mb-1">Healthcare wishes & decision-maker</h1>
      <p className="text-sm text-gray-500 mb-6">
        Who should make medical decisions for you, and what they should know about your preferences.
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">Decision-maker</h2>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Who will make healthcare decisions for you
            </label>
            <PersonPicker value={decisionMakerId} onChange={setDecisionMakerId} />
          </div>
        </section>

        <section className="border border-gray-200 rounded p-4">
          <h2 className="mb-3">General approach</h2>
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              General approach
            </label>
            <div className="flex flex-wrap gap-2">
              {approachOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setApproach(opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    approach === opt.value
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
          <h2 className="mb-3">Additional wishes</h2>
          <div>
            <label
              htmlFor="additionalWishes"
              className="block text-sm text-gray-600 mb-1"
            >
              Additional wishes
            </label>
            <textarea
              id="additionalWishes"
              value={additionalWishes}
              onChange={(e) => setAdditionalWishes(e.target.value)}
              placeholder="Specific instructions, DNR preferences, or anything else your decision-maker should know..."
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
