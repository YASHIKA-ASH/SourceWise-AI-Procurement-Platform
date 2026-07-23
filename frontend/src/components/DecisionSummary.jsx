import { AlertCircle, CheckCircle, TrendingDown } from 'lucide-react'

function DecisionSummary({ result }) {
  if (!result) return null

  const recommendation = result.recommendation || {}
  const riskLevel = recommendation.risk_level || 'medium'

  const getRiskIcon = (level) => {
    switch (level.toLowerCase()) {
      case 'high':
        return <AlertCircle className="text-red-600" size={24} />
      case 'low':
        return <CheckCircle className="text-green-600" size={24} />
      default:
        return <TrendingDown className="text-yellow-600" size={24} />
    }
  }

  const getRiskColor = (level) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-red-50 border-red-200'
      case 'low':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-yellow-50 border-yellow-200'
    }
  }

  return (
    <div className={`p-8 rounded-lg border ${getRiskColor(riskLevel)}`}>
      <div className="flex items-start gap-4 mb-6">
        {getRiskIcon(riskLevel)}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Executive Decision Summary</h2>
          <p className="text-gray-600">
            AI-assisted recommendation based on transparent, weighted scoring model
          </p>
        </div>
      </div>

      {/* Recommended Supplier */}
      {recommendation.recommended_supplier && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Recommended Supplier</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {recommendation.recommended_supplier}
              </p>
              {recommendation.recommendation_score && (
                <p className="text-sm text-gray-600 mt-1">
                  Overall Score: <span className="font-bold">{recommendation.recommendation_score.toFixed(1)}/100</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Risk Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Risk Level</p>
          <p className="text-lg font-bold capitalize text-gray-900">{riskLevel}</p>
          {recommendation.risk_explanation && (
            <p className="text-xs text-gray-600 mt-2">{recommendation.risk_explanation}</p>
          )}
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Estimated Cost</p>
          <p className="text-lg font-bold text-gray-900">
            ${recommendation.estimated_cost?.toFixed(2) || 'N/A'}
          </p>
          {recommendation.cost_note && (
            <p className="text-xs text-gray-600 mt-2">{recommendation.cost_note}</p>
          )}
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Lead Time</p>
          <p className="text-lg font-bold text-gray-900">
            {recommendation.delivery_days || 'N/A'} days
          </p>
          {recommendation.lead_time_note && (
            <p className="text-xs text-gray-600 mt-2">{recommendation.lead_time_note}</p>
          )}
        </div>
      </div>

      {/* Key Reasoning */}
      {recommendation.reasoning && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Key Decision Factors</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{recommendation.reasoning}</p>
        </div>
      )}

      {/* Warnings/Alerts */}
      {recommendation.warnings && recommendation.warnings.length > 0 && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="font-semibold text-orange-900 mb-2">Considerations</h4>
          <ul className="space-y-2">
            {recommendation.warnings.map((warning, idx) => (
              <li key={idx} className="text-sm text-orange-800 flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default DecisionSummary
