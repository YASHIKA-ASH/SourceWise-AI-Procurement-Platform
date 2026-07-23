function Reports() {
  return (
    <div className="bg-white rounded-lg p-10">
      <h1 className="text-3xl font-bold">
        Reports
      </h1>

      <p className="mt-4 text-gray-500">
        Download procurement report generated
        from the latest simulation.
      </p>

      <button
        className="mt-6 bg-blue-600 text-white px-5 py-3 rounded-lg"
      >
        Download Report
      </button>
    </div>
  );
}

export default Reports;