import { useState } from "react";
import { useNavigate } from "react-router";

export function AccountSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    birthday: "",
    email: "",
    phone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/connection-setup");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <h1 className="mb-6">Account Setup</h1>
        <p className="mb-6 text-sm text-gray-600">
This info helps trusted connections recognize and reach you. Your name is how you’ll appear in invitations, contact matching, and connected spaces.        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div>
            
            
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="w-full px-6 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >👀 Preview the app with demo data 👀</button>
        </form>
      </div>
    </div>
  );
}