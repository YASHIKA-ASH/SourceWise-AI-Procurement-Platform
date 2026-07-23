import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { procurementAPI } from "../api/api";
import toast from "react-hot-toast";

export default function Search() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  async function handleSearch(e) {
    e.preventDefault();

    if (!query.trim()) return;

    try {
      setLoading(true);

      const res = await procurementAPI.search(query);

      if (Array.isArray(res.data)) {
        setResults(res.data);
      } else if (res.data.results) {
        setResults(res.data.results);
      } else {
        setResults([res.data]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          Procurement Search
        </h1>

        <p className="text-gray-500 mt-2">
          Search suppliers, materials and AI knowledge.
        </p>

      </div>

      <form
        onSubmit={handleSearch}
        className="flex gap-4"
      >

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="flex-1 border rounded-lg p-4"
        />

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg flex items-center gap-2"
        >
          <SearchIcon size={20} />
          {loading ? "Searching..." : "Search"}
        </button>

      </form>

      <div className="space-y-5">

        {results.map((item, index) => (

          <div
            key={index}
            className="bg-white rounded-xl shadow p-6"
          >

            <pre className="whitespace-pre-wrap">
              {JSON.stringify(item, null, 2)}
            </pre>

          </div>

        ))}

      </div>

    </div>
  );
}