import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">

      <div className="text-center">

        <h1 className="text-8xl font-bold text-blue-600">
          404
        </h1>

        <h2 className="text-3xl font-semibold mt-5">
          Page Not Found
        </h2>

        <p className="text-gray-500 mt-4">
          The page you are looking for doesn't exist.
        </p>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
        >
          <Home size={20} />
          Go to Dashboard
        </Link>

      </div>

    </div>
  );
}