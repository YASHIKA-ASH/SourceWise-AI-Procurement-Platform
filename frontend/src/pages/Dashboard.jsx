import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp, Users, Package } from 'lucide-react'
import { procurementAPI } from '../utils/api'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
export default Dashboard
function Dashboard() {
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    avgLeadTime: 0,
    costSavings: 0,
    activeProcurements: 0,
  })
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
  try {
    setLoading(true);

    const [overview, risk] = await Promise.all([
      procurementAPI.getOverview(),
      procurementAPI.getRiskAnalysis(),
    ]);

    const overviewData = overview.data;
    const riskData = risk.data;

    setAnalytics({
      ...overviewData,
      ...riskData,
    });

    setStats({
      totalSuppliers: overviewData.suppliers_count || 0,
      avgLeadTime: overviewData.avg_lead_time || 0,
      costSavings: overviewData.lowest_cost || 0,
      activeProcurements:
        (riskData.summary?.low_risk || 0) +
        (riskData.summary?.medium_risk || 0) +
        (riskData.summary?.high_risk || 0),
    });
  } catch (error) {
    console.error(error);
    toast.error("Failed to load dashboard data");
  } finally {
    setLoading(false);
  }
};

    fetchDashboardData()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome to SourceWise</h1>
        <p className="text-blue-100">
          AI-powered procurement decision support platform. Make confident supplier choices with
          transparent, explainable scoring.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Suppliers"
          value={stats.totalSuppliers}
          icon={<Users className="text-blue-600" />}
          trend="+12%"
        />
        <StatCard
          title="Avg Lead Time"
          value={`${stats.avgLeadTime} days`}
          icon={<TrendingUp className="text-green-600" />}
          trend="-8%"
        />
        <StatCard
          title="Cost Savings"
          value={`$${(stats.costSavings / 1000).toFixed(1)}K`}
          icon={<Package className="text-purple-600" />}
          trend="+23%"
        />
        <StatCard
          title="Active Procurements"
          value={stats.activeProcurements}
          icon={<TrendingUp className="text-orange-600" />}
          trend={`+${Math.floor(stats.activeProcurements * 0.15)}`}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/simulation"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">New Simulation</h3>
            <ArrowRight className="text-blue-600 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-gray-600">
            Run a procurement simulation to compare suppliers and get AI recommendations.
          </p>
        </Link>

        <Link
          to="/analytics"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">View Analytics</h3>
            <ArrowRight className="text-green-600 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-gray-600">
            Explore procurement trends, supplier performance, and cost analysis.
          </p>
        </Link>

        <Link
          to="/reports"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Download Reports</h3>
            <ArrowRight className="text-purple-600 group-hover:translate-x-1 transition" />
          </div>
          <p className="text-gray-600">
            Generate and download PDF procurement reports with detailed analysis.
          </p>
        </Link>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Procurements</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.suppliers_count|| 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.avg_lead_time?.toFixed(1) || '0.0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Top Supplier</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.suppliers?.[0]?.supplier || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Risk Level</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.summary.high_risk > 0
  ? "High"
  : analytics.summary.medium_risk > 0
  ? "Medium"
  : "Low" || 'Medium'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


