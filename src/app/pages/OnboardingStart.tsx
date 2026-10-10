import { useNavigate } from "react-router";

export function OnboardingStart() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-8">
      <div className="max-w-2xl">
        <h1 className="mb-6">Welcome to Kinnit</h1>
        <div className="space-y-4 mb-8">
          <p>
            Kinnit is a private platform for sharing how you want to be known, celebrated, supported, and remembered by your trusted communities. In turn, it helps you hold onto meaningful details and stay thoughtful in how to show up for one another. This is a trusted community space and no data is ever observed, accessed or stored and it never will be. 
          </p>
          <p>This invitation-only space is built on mutual agreement; you choose what to share and with whom. Within that trusted space, Kinnit helps you organize, remember and act on what's been intentionally shared. </p>
          <p>Kinnit helps you manage five core aspects of your relationships: 1. your connections (People), 2. meaningful moments (Occasions), 3. collaborative coordination (Plans), 4. personal preferences (About Me), 5. end-of-life wishes (Life & Legacy).</p>
        </div>
        <button
          onClick={() => navigate("/account-setup")}
          className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}