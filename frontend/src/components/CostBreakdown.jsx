import { formatMoney } from '../format.js'

const labels = {
  material_cost: 'Material',
  transportation_cost: 'Transportation',
  customs_import_duty: 'Customs & duty',
  packaging_cost: 'Packaging',
  warehousing_cost: 'Warehousing',
  taxes: 'Taxes',
  delay_related_cost: 'Delay cost',
}

export default function CostBreakdown({ breakdown }) {
  return (
    <div className="cost-breakdown">
      {Object.entries(labels).map(([key, label]) => (
        <div className="cost-row" key={key}>
          <span>{label}</span>
          <strong>{formatMoney(breakdown[key])}</strong>
        </div>
      ))}
      <div className="cost-row cost-total">
        <span>Total landed cost</span>
        <strong>{formatMoney(breakdown.total_landed_cost)}</strong>
      </div>
    </div>
  )
}
