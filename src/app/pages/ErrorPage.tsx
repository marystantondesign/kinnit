import { useRouteError, Link } from "react-router";

export function ErrorPage() {
  const error = useRouteError() as any;

  return (
    <div className="p-8">
      <h1 className="mb-4">Oops!</h1>
      <p className="text-gray-600 mb-4">Sorry, an unexpected error has occurred.</p>
      <p className="text-gray-500 mb-6">
        <i>{error?.statusText || error?.message || "Unknown error"}</i>
      </p>
      <Link to="/app" className="text-blue-600 hover:underline">
        Return to Home
      </Link>
    </div>
  );
}
