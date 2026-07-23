import { useState, useEffect } from 'react'
import { procurementAPI } from '../utils/api'
import AnalyticsCharts from '../components/AnalyticsCharts'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const [overview, risk] = await Promise.all([
  procurementAPI.getOverview(),
  procurementAPI.getRiskAnalysis(),
])

setData({
  ...overview.data,
  ...risk.data,
})
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        toast.error('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Procurement Analytics</h2>
        <p className="text-gray-600">
          Track procurement trends, supplier performance, and cost analysis over time.
        </p>
      </div>

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Total Procurements</p>
              <p className="text-3xl font-bold text-gray-900">{data.total_procurements || 0}</p>
              <p className="text-xs text-gray-500 mt-2">All-time</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {data.avg_score?.toFixed(1) || '0.0'}
              </p>
              <p className="text-xs text-gray-500 mt-2">Out of 100</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Top Supplier</p>
              <p className="text-2xl font-bold text-gray-900">{data.top_supplier || 'N/A'}</p>
              <p className="text-xs text-gray-500 mt-2">Most recommended</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Cost Savings</p>
              <p className="text-3xl font-bold text-green-600">
                ${(data.total_savings / 1000)?.toFixed(1) || '0'}K
              </p>
              <p className="text-xs text-gray-500 mt-2">Total</p>
            </div>
          </div>

          {/* Analytics Charts */}
          <AnalyticsCharts data={data} />
        </>
      )}
    </div>
  )
}

export default Analytics
