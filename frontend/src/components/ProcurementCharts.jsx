import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function ProcurementCharts({ result }) {
  if (!result) return null

  // Prepare data for charts
  const suppliers = result.supplier_scores || []
  const chartData = suppliers.map((supplier) => ({
    name: supplier.name,
    cost: supplier.unit_cost || 0,
    leadTime: supplier.lead_time || 0,
    overallScore: supplier.overall_score || 0,
    costEfficiency: supplier.cost_efficiency || 0,
    leadTimeScore: supplier.lead_time_score || 0,
    riskScore: supplier.risk_score || 0,
  }))

  const scoreBreakdown = [
    { name: 'Cost Efficiency (40%)', value: 40 },
    { name: 'Lead Time (35%)', value: 35 },
    { name: 'Risk Management (25%)', value: 25 },
  ]

  return (
    <div className="space-y-6">
      {/* Overall Score Comparison */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Score Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="overallScore" fill="#3b82f6" name="Overall Score" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost vs Lead Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Unit Cost Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cost" fill="#10b981" name="Unit Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Lead Time Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leadTime" fill="#f59e0b" name="Lead Time (days)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Scoring Model Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scoreBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {scoreBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Score Components by Supplier</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="costEfficiency" stackId="a" fill="#3b82f6" name="Cost" />
              <Bar dataKey="leadTimeScore" stackId="a" fill="#10b981" name="Lead Time" />
              <Bar dataKey="riskScore" stackId="a" fill="#f59e0b" name="Risk" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Simulation Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Material</p>
            <p className="font-semibold text-gray-900">{result.material || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Quantity Required</p>
            <p className="font-semibold text-gray-900">{result.quantity_required || 'N/A'} units</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Inventory</p>
            <p className="font-semibold text-gray-900">{result.current_inventory || 'N/A'} units</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Daily Usage</p>
            <p className="font-semibold text-gray-900">{result.daily_usage || 'N/A'} units/day</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcurementCharts
