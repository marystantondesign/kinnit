import { Link } from "react-router";

// Placeholder for the full "View all" pages linked from the notifications panel.
// These pages haven't been designed yet.

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="mb-2">{title}</h1>
      <p className="text-sm text-gray-500 mb-6">This page hasn't been designed yet.</p>
      <Link to="/app" className="text-sm text-gray-900 underline underline-offset-2">
        Back to Home
      </Link>
    </div>
  );
}

export function AllActionItems() {
  return <Placeholder title="All action items" />;
}

export function AllActivity() {
  return <Placeholder title="All activity" />;
}

export function AllShared() {
  return <Placeholder title="Everything shared" />;
}
