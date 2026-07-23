import { CheckCircle } from 'lucide-react'

function SupplierComparison({ suppliers }) {
  if (!suppliers || suppliers.length === 0) {
    return null
  }

  // Sort by overall score descending
  const sortedSuppliers = [...suppliers].sort((a, b) => b.overall_score - a.overall_score)
  const bestSupplier = sortedSuppliers[0]

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Supplier Comparison</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Supplier</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Unit Cost
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Lead Time (days)
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Cost Efficiency
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Lead Time Score
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Risk Score
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Overall Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedSuppliers.map((supplier, index) => (
              <tr
                key={supplier.name}
                className={`hover:bg-gray-50 transition ${
                  supplier.name === bestSupplier.name ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    {supplier.name === bestSupplier.name && (
                      <CheckCircle size={18} className="text-green-600" />
                    )}
                    <span>{supplier.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-gray-600">
                  ${supplier.unit_cost?.toFixed(2) || 'N/A'}
                </td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {supplier.lead_time || 'N/A'}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {supplier.cost_efficiency?.toFixed(1) || '0.0'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {supplier.lead_time_score?.toFixed(1) || '0.0'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {supplier.risk_score?.toFixed(1) || '0.0'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                      supplier.overall_score >= 75
                        ? 'bg-green-100 text-green-700'
                        : supplier.overall_score >= 50
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {supplier.overall_score?.toFixed(1) || '0.0'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Recommendation:</span> Based on weighted
          scoring (Cost Efficiency 40%, Lead Time 35%, Risk 25%),{' '}
          <span className="font-bold text-blue-600">{bestSupplier.name}</span> is the recommended
          supplier with an overall score of{' '}
          <span className="font-bold">{bestSupplier.overall_score?.toFixed(1)}/100</span>.
        </p>
      </div>
    </div>
  )
}

export default SupplierComparison
