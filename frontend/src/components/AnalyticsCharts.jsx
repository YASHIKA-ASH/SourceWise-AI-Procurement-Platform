import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

function AnalyticsCharts({ data }) {
  if (!data) return null

  // Prepare data for supplier performance chart
  const supplierData = (data.supplier_performance || []).slice(0, 6).map((supplier) => ({
    name: supplier.name,
    score: supplier.avg_score || 0,
    procurements: supplier.procurements || 0,
  }))

  // Prepare data for trend chart
  const trendData = (data.trend_data || []).map((item) => ({
    date: item.date || item.month || 'N/A',
    score: item.avg_score || 0,
    procurements: item.count || 0,
  }))

  // Risk distribution
  const riskDistribution = [
    { name: 'Low Risk', value: data.low_risk_count || 0 },
    { name: 'Medium Risk', value: data.medium_risk_count || 0 },
    { name: 'High Risk', value: data.high_risk_count || 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Supplier Performance */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Supplier Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={supplierData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" fill="#3b82f6" name="Avg Score" />
            <Bar dataKey="procurements" fill="#10b981" name="Procurements" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Over Time */}
      {trendData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Procurement Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                name="Avg Score"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="procurements"
                stroke="#10b981"
                name="Count"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.name === 'Low Risk'
                        ? '#10b981'
                        : entry.name === 'Medium Risk'
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Score Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Score Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Excellent (80-100)</span>
                <span className="font-semibold">{data.excellent_score_count || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${
                      ((data.excellent_score_count || 0) / (data.total_procurements || 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Good (60-79)</span>
                <span className="font-semibold">{data.good_score_count || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${
                      ((data.good_score_count || 0) / (data.total_procurements || 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Fair (40-59)</span>
                <span className="font-semibold">{data.fair_score_count || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{
                    width: `${
                      ((data.fair_score_count || 0) / (data.total_procurements || 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Poor (&lt;40)</span>
                <span className="font-semibold">{data.poor_score_count || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{
                    width: `${
                      ((data.poor_score_count || 0) / (data.total_procurements || 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Procurements</p>
            <p className="text-2xl font-bold text-gray-900">{data.total_procurements || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Score</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.avg_score?.toFixed(1) || '0.0'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Unique Suppliers</p>
            <p className="text-2xl font-bold text-gray-900">{data.unique_suppliers || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Lead Time</p>
            <p className="text-2xl font-bold text-gray-900">{data.avg_lead_time || 0} days</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Savings</p>
            <p className="text-2xl font-bold text-green-600">
              ${(data.total_savings / 1000)?.toFixed(1) || '0'}K
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsCharts
