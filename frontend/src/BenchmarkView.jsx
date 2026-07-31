import { useMemo, useState } from 'react'
import { api } from './api.js'
import Badge from './components/Badge.jsx'
import { formatMoney, formatNumber } from './format.js'

const baselineStrategies = [
  ['manual_baseline', 'First feasible supplier (manual-like baseline)'],
  ['lowest_cost', 'Lowest landed cost'],
  ['lowest_risk', 'Lowest supplier risk'],
  ['fastest_delivery', 'Fastest delivery'],
]

const optimizedStrategies = [
  ['balanced', 'Guardrailed SourceWise optimization'],
  ['lowest_cost', 'Lowest landed cost'],
  ['lowest_risk', 'Lowest supplier risk'],
  ['fastest_delivery', 'Fastest delivery'],
]

const initialForm = {
  scenario_count: 500,
  seed: 42,
  baseline_strategy: 'manual_baseline',
  optimized_strategy: 'balanced',
  demand_volatility_percentage: 25,
  supplier_price_volatility_percentage: 15,
  transportation_volatility_percentage: 20,
  maximum_lead_time_delay_days: 14,
  supplier_disruption_probability_percentage: 8,
}

function signed(value, suffix = '%') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  const numeric = Number(value)
  return `${numeric > 0 ? '+' : ''}${formatNumber(numeric)}${suffix}`
}

function metricTone(value) {
  if (value === null || value === undefined) return 'neutral'
  return Number(value) >= 0 ? 'positive' : 'warning'
}

function averageValue(key, value) {
  if (value === null || value === undefined) return '—'
  if (key === 'procurement_cost') return formatMoney(value)
  if (['supplier_dependency', 'profit_margin', 'on_time_rate', 'component_feasibility_rate', 'full_allocation_rate'].includes(key)) {
    return `${formatNumber(value)}%`
  }
  return formatNumber(value)
}

export default function BenchmarkView({ productId, product }) {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const metricRows = useMemo(() => [
    ['procurement_cost', 'Average procurement cost'],
    ['quality_score', 'Average quality score'],
    ['risk_exposure', 'Average risk exposure'],
    ['supplier_dependency', 'Supplier dependency'],
    ['on_time_rate', 'On-time allocation rate'],
    ['full_allocation_rate', 'Full-allocation success'],
    ['profit_margin', 'Expected profit margin'],
  ], [])

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setCopied(false)
    setLoading(true)
    try {
      const payload = {
        ...form,
        scenario_count: Number(form.scenario_count),
        seed: Number(form.seed),
        demand_volatility_percentage: Number(form.demand_volatility_percentage),
        supplier_price_volatility_percentage: Number(form.supplier_price_volatility_percentage),
        transportation_volatility_percentage: Number(form.transportation_volatility_percentage),
        maximum_lead_time_delay_days: Number(form.maximum_lead_time_delay_days),
        supplier_disruption_probability_percentage: Number(form.supplier_disruption_probability_percentage),
      }
      setResult(await api.simulationBenchmark(productId, payload))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function copyEvidence() {
    if (!result?.evidence_statement) return
    await navigator.clipboard.writeText(result.evidence_statement)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="benchmark-layout">
      <form className="panel benchmark-form" onSubmit={submit}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">MONTE CARLO VALIDATION</p>
            <h2>Measure improvement across purchasing scenarios</h2>
            <p className="helper">
              Run the same randomized demand, price, transport, lead-time, and supplier-disruption shocks
              against a baseline and a SourceWise strategy.
            </p>
          </div>
          <Badge type="neutral">{product?.name || 'Selected product'}</Badge>
        </div>

        <div className="form-grid three-columns">
          <label className="field"><span>Number of scenarios</span><input type="number" min="50" max="2000" value={form.scenario_count} onChange={(e) => update('scenario_count', e.target.value)} /></label>
          <label className="field"><span>Repeatable random seed</span><input type="number" min="0" value={form.seed} onChange={(e) => update('seed', e.target.value)} /></label>
          <label className="field"><span>Supplier disruption probability (%)</span><input type="number" min="0" max="100" step="0.5" value={form.supplier_disruption_probability_percentage} onChange={(e) => update('supplier_disruption_probability_percentage', e.target.value)} /></label>
        </div>

        <div className="benchmark-strategies">
          <label className="field"><span>Baseline process</span><select value={form.baseline_strategy} onChange={(e) => update('baseline_strategy', e.target.value)}>{baselineStrategies.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="benchmark-versus">VS</div>
          <label className="field"><span>Strategy being evaluated</span><select value={form.optimized_strategy} onChange={(e) => update('optimized_strategy', e.target.value)}>{optimizedStrategies.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>

        <div className="scenario-section">
          <strong>Shock ranges</strong>
          <div className="form-grid four-columns benchmark-shocks">
            <label className="field"><span>Demand volatility (%)</span><input type="number" min="0" max="100" value={form.demand_volatility_percentage} onChange={(e) => update('demand_volatility_percentage', e.target.value)} /></label>
            <label className="field"><span>Supplier price volatility (%)</span><input type="number" min="0" max="100" value={form.supplier_price_volatility_percentage} onChange={(e) => update('supplier_price_volatility_percentage', e.target.value)} /></label>
            <label className="field"><span>Transport volatility (%)</span><input type="number" min="0" max="150" value={form.transportation_volatility_percentage} onChange={(e) => update('transportation_volatility_percentage', e.target.value)} /></label>
            <label className="field"><span>Maximum delay (days)</span><input type="number" min="0" max="180" value={form.maximum_lead_time_delay_days} onChange={(e) => update('maximum_lead_time_delay_days', e.target.value)} /></label>
          </div>
        </div>

        {error && <div className="inline-error">{error}</div>}
        <button className="primary-button benchmark-run" type="submit" disabled={loading}>
          {loading ? `Running ${form.scenario_count} scenarios…` : `Run ${form.scenario_count} simulations`}
        </button>
      </form>

      {!result ? (
        <section className="panel empty-state benchmark-empty">
          <strong>No benchmark has been run</strong>
          <span>The default run evaluates 500 scenarios and reports measured simulation percentages.</span>
        </section>
      ) : (
        <>
          <section className="panel benchmark-headline">
            <div>
              <p className="eyebrow">EVIDENCE-BASED RESULT</p>
              <h2>{result.scenario_count} simulated purchasing scenarios</h2>
              <p>{result.evidence_statement}</p>
            </div>
            <div className="benchmark-actions">
              <Badge type={result.cache?.hit ? 'neutral' : 'success'}>{result.cache?.hit ? 'Cached result' : `${formatNumber(result.runtime_ms)} ms`}</Badge>
              <button className="secondary-button" type="button" onClick={copyEvidence}>{copied ? 'Copied' : 'Copy statement'}</button>
            </div>
          </section>

          <section className="benchmark-kpis">
            <BenchmarkKpi label="Cost reduction" value={signed(result.improvement.cost_reduction_percentage)} tone={metricTone(result.improvement.cost_reduction_percentage)} note="Positive means lower average cost" />
            <BenchmarkKpi label="Quality improvement" value={signed(result.improvement.quality_improvement_percentage)} tone={metricTone(result.improvement.quality_improvement_percentage)} note="Positive means higher quality" />
            <BenchmarkKpi label="Risk reduction" value={signed(result.improvement.risk_reduction_percentage)} tone={metricTone(result.improvement.risk_reduction_percentage)} note="Positive means lower exposure" />
            <BenchmarkKpi label="Allocation success change" value={signed(result.improvement.full_allocation_rate_change_points, ' pts')} tone={metricTone(result.improvement.full_allocation_rate_change_points)} note="Percentage-point change" />
          </section>

          <section className="panel benchmark-comparison">
            <div className="panel-header">
              <div><p className="eyebrow">AVERAGE OUTCOMES</p><h2>Baseline versus evaluated strategy</h2></div>
              <Badge type="neutral">{result.comparable_fully_allocated_scenarios} comparable feasible scenarios</Badge>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Metric</th><th>{result.baseline_strategy_label}</th><th>{result.optimized_strategy_label}</th></tr></thead>
                <tbody>{metricRows.map(([key, label]) => <tr key={key}><td>{label}</td><td>{averageValue(key, result.baseline_averages[key])}</td><td><strong>{averageValue(key, result.optimized_averages[key])}</strong></td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className="benchmark-detail-grid">
            <article className="panel">
              <div className="panel-header"><div><p className="eyebrow">ROBUSTNESS</p><h2>Optimized win rate</h2></div></div>
              <div className="benchmark-win-list">
                {Object.entries(result.optimized_win_rate_percentage).map(([key, value]) => (
                  <div key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{value === null ? '—' : `${formatNumber(value)}%`}</strong></div>
                ))}
              </div>
            </article>
            <article className="panel">
              <div className="panel-header"><div><p className="eyebrow">COST DISTRIBUTION</p><h2>Feasible-scenario range</h2></div></div>
              <div className="benchmark-distribution">
                <DistributionRow label="P10" baseline={result.cost_distribution.baseline.p10} optimized={result.cost_distribution.optimized.p10} />
                <DistributionRow label="Median" baseline={result.cost_distribution.baseline.median} optimized={result.cost_distribution.optimized.median} />
                <DistributionRow label="P90" baseline={result.cost_distribution.baseline.p90} optimized={result.cost_distribution.optimized.p90} />
              </div>
            </article>
          </section>

          <section className="panel benchmark-methodology">
            <p className="eyebrow">HOW TO INTERPRET THIS</p>
            <p>{result.methodology.comparison}</p>
            {result.methodology.optimization_policy && <p>{result.methodology.optimization_policy}</p>}
            <p>{result.methodology.cost_metric_scope}</p>
            <p><strong>Important:</strong> {result.methodology.claim_limit}</p>
          </section>
        </>
      )}
    </div>
  )
}

function BenchmarkKpi({ label, value, tone, note }) {
  return <article className={`benchmark-kpi ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
}

function DistributionRow({ label, baseline, optimized }) {
  return <div><span>{label}</span><em>{formatMoney(baseline)}</em><strong>{formatMoney(optimized)}</strong></div>
}
