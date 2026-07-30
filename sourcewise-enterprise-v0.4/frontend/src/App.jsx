import { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import Badge from './components/Badge.jsx'
import CostBreakdown from './components/CostBreakdown.jsx'
import StatCard from './components/StatCard.jsx'
import { formatMoney, formatNumber } from './format.js'

const strategies = [
  ['balanced', 'Balanced'],
  ['lowest_cost', 'Lowest cost'],
  ['lowest_risk', 'Lowest risk'],
  ['fastest_delivery', 'Fastest delivery'],
]

const scenarioPresets = [
  { label: 'Prices +10%', payload: { supplier_price_change_percentage: 10 } },
  { label: 'Demand +25%', payload: { demand_change_percentage: 25 } },
  { label: 'Delivery +14 days', payload: { lead_time_delay_days: 14 } },
  { label: 'Domestic only', payload: { domestic_suppliers_only: true } },
]

const blankProduct = {
  name: '',
  sku: '',
  target_manufacturing_cost: '',
  expected_selling_price: '',
  minimum_profit_margin: '',
  maximum_procurement_budget: '',
  production_days: 7,
}

const blankComponent = () => ({
  part_name: '',
  category: '',
  required_quantity: '',
  current_inventory: 0,
  reserved_inventory: 0,
  safety_stock: 0,
  default_minimum_order_quantity: 1,
  required_delivery_date: futureDate(30),
  is_critical: true,
})

const blankSupplier = {
  name: '',
  country: '',
  is_domestic: false,
  is_approved: true,
  iso_certified: false,
  quality_rating: 75,
  risk_score: 25,
  on_time_delivery_percentage: 80,
  average_lead_time_days: 14,
  defect_percentage: 2,
  fulfilment_percentage: 90,
  contract_compliance_percentage: 90,
  monthly_production_capacity: '',
  current_committed_capacity: 0,
  maximum_order_size: 0,
  historical_spending: 0,
}

const blankOffer = {
  component_id: '',
  supplier_id: '',
  unit_price: '',
  transportation_cost_per_unit: 0,
  customs_import_duty_percentage: 0,
  packaging_cost_per_unit: 0,
  warehousing_cost_per_unit: 0,
  tax_percentage: 0,
  delay_related_cost_per_unit: 0,
  lead_time_days: 14,
  minimum_order_quantity: 1,
}

export default function App() {
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState(null)
  const [bomRows, setBomRows] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [strategy, setStrategy] = useState('balanced')
  const [settings, setSettings] = useState(null)
  const [scenarioResult, setScenarioResult] = useState(null)
  const [expandedAllocation, setExpandedAllocation] = useState(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const selectedProduct = products.find((product) => product.id === productId) || null

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true)
        const [productRows, dashboardData, settingsData, supplierRows] = await Promise.all([
          api.products(), api.dashboard(), api.settings(), api.suppliers(),
        ])
        setProducts(productRows)
        setDashboard(dashboardData)
        setSettings(settingsData)
        setSuppliers(supplierRows)
        if (productRows.length) setProductId(productRows[0].id)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [])

  useEffect(() => {
    if (!productId) {
      setRecommendation(null)
      setBomRows([])
      return
    }
    loadProductWorkspace(productId, strategy)
  }, [productId, strategy])

  async function loadProductWorkspace(id, selectedStrategy, options = {}) {
    try {
      setLoading(true)
      setError('')
      if (!options.keepScenario) setScenarioResult(null)
      const [recommendationData, components, dashboardData] = await Promise.all([
        api.recommendation(id, selectedStrategy),
        api.bom(id),
        api.dashboard(),
      ])
      setRecommendation(recommendationData)
      setBomRows(components)
      setDashboard(dashboardData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function reloadProducts(selectedId = productId) {
    const rows = await api.products()
    setProducts(rows)
    if (selectedId && rows.some((item) => item.id === selectedId)) setProductId(selectedId)
    else if (rows.length) setProductId(rows[0].id)
    else setProductId(null)
    return rows
  }

  async function runScenario(definition) {
    if (!productId) return
    try {
      setLoading(true)
      setError('')
      const data = await api.scenario(productId, { strategy, ...definition.payload })
      setScenarioResult({ label: definition.label || 'Custom scenario', ...data })
      setActiveSection('scenarios')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings(event) {
    event.preventDefault()
    try {
      setLoading(true)
      const payload = {
        ...settings,
        cost_weight: Number(settings.cost_weight),
        quality_weight: Number(settings.quality_weight),
        lead_time_weight: Number(settings.lead_time_weight),
        risk_weight: Number(settings.risk_weight),
      }
      const saved = await api.saveSettings(payload)
      setSettings(saved)
      setNotice('Supplier scoring and procurement filters saved.')
      if (productId) await loadProductWorkspace(productId, strategy)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function uploadBom(event) {
    const file = event.target.files?.[0]
    if (!file || !productId) return
    try {
      setLoading(true)
      const result = await api.uploadBom(productId, file)
      setNotice(`${result.created_components} BOM components imported successfully.`)
      await loadProductWorkspace(productId, strategy)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  async function createProduct(payload) {
    try {
      setLoading(true)
      const saved = await api.createProduct(productPayload(payload))
      await reloadProducts(saved.id)
      setProductId(saved.id)
      setNotice(`${saved.name} created. Add BOM components and supplier quotations next.`)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function updateProductTargets(payload) {
    if (!productId) return false
    try {
      setLoading(true)
      const saved = await api.updateProduct(productId, productPayload(payload))
      setProducts((current) => current.map((item) => item.id === saved.id ? saved : item))
      setNotice('Product targets saved and procurement results recalculated.')
      await loadProductWorkspace(productId, strategy)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function addComponent(payload) {
    if (!productId) return false
    try {
      setLoading(true)
      const saved = await api.addComponent(productId, numericPayload(payload, [
        'required_quantity', 'current_inventory', 'reserved_inventory', 'safety_stock',
        'default_minimum_order_quantity',
      ]))
      setNotice(`${saved.part_name} added to the BOM. Add at least one supplier quotation for calculation.`)
      await loadProductWorkspace(productId, strategy)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function deleteComponent(component) {
    if (!productId || !window.confirm(`Delete ${component.part_name} and all of its supplier offers?`)) return
    try {
      setLoading(true)
      await api.deleteComponent(productId, component.id)
      setNotice(`${component.part_name} removed from the BOM.`)
      await loadProductWorkspace(productId, strategy)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createSupplier(payload) {
    try {
      setLoading(true)
      const saved = await api.createSupplier(numericPayload(payload, [
        'quality_rating', 'risk_score', 'on_time_delivery_percentage', 'average_lead_time_days',
        'defect_percentage', 'fulfilment_percentage', 'contract_compliance_percentage',
        'monthly_production_capacity', 'current_committed_capacity', 'maximum_order_size',
        'historical_spending',
      ]))
      setSuppliers(await api.suppliers())
      setNotice(`${saved.name} added. You can now create component quotations for this supplier.`)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function createOffer(payload) {
    if (!payload.component_id) {
      setError('Select a BOM component before adding a supplier quotation.')
      return false
    }
    try {
      setLoading(true)
      const componentId = Number(payload.component_id)
      const body = numericPayload(payload, [
        'supplier_id', 'unit_price', 'transportation_cost_per_unit',
        'customs_import_duty_percentage', 'packaging_cost_per_unit',
        'warehousing_cost_per_unit', 'tax_percentage', 'delay_related_cost_per_unit',
        'lead_time_days', 'minimum_order_quantity',
      ])
      delete body.component_id
      await api.createOffer(componentId, body)
      setNotice('Supplier quotation saved. Landed cost and recommendations have been recalculated.')
      await loadProductWorkspace(productId, strategy)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const summary = recommendation?.summary
  const allocationRows = useMemo(
    () => recommendation?.component_results?.flatMap((component) =>
      component.allocations.map((allocation) => ({ ...allocation, component }))) || [],
    [recommendation],
  )

  if (loading && !recommendation && !dashboard && products.length === 0) {
    return <div className="center-state"><div className="spinner" />Loading SourceWise…</div>
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div><strong>SourceWise</strong><span>Procurement Intelligence</span></div>
        </div>
        <nav>
          {[
            ['overview', '▦', 'Executive overview'],
            ['data', '+', 'Manual data entry'],
            ['bom', '▤', 'Bill of Materials'],
            ['recommendations', '◎', 'Recommendations'],
            ['copilot', '✦', 'AI Copilot'],
            ['scenarios', '↗', 'Scenario simulation'],
            ['settings', '⚙', 'Scoring & filters'],
          ].map(([key, icon, label]) => (
            <button key={key} className={activeSection === key ? 'nav-item active' : 'nav-item'} onClick={() => setActiveSection(key)}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="status-dot" /> API connected
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">PROCUREMENT CONTROL CENTER</p>
            <h1>{sectionTitle(activeSection)}</h1>
          </div>
          <div className="topbar-actions">
            <select value={productId || ''} onChange={(event) => setProductId(Number(event.target.value))} disabled={!products.length}>
              {!products.length && <option value="">Create a product first</option>}
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <label className={`upload-button ${!productId ? 'disabled' : ''}`}>
              Upload BOM
              <input type="file" accept=".csv,.xlsx" onChange={uploadBom} hidden disabled={!productId} />
            </label>
          </div>
        </header>

        {error && <div className="alert error"><strong>Something needs attention:</strong> {error}<button onClick={() => setError('')}>×</button></div>}
        {notice && <div className="alert success">{notice}<button onClick={() => setNotice('')}>×</button></div>}
        {loading && <div className="progress-bar" />}

        {!productId && activeSection !== 'data' && (
          <div className="empty-state panel"><strong>No product selected</strong><span>Create a product from Manual data entry to begin.</span><button className="primary-button compact" onClick={() => setActiveSection('data')}>Create product</button></div>
        )}

        {productId && activeSection === 'overview' && (
          <>
            <section className="stat-grid">
              <StatCard icon="₹" label="Simulated procurement cost" value={formatMoney(summary?.final_product_procurement_cost)} note={summary?.target_status === 'within_target' ? 'Within configured target' : 'Review target variance'} tone={summary?.target_status === 'within_target' ? 'positive' : 'warning'} />
              <StatCard icon="↗" label="Expected profit margin" value={summary?.expected_profit_margin === null ? 'Not configured' : `${formatNumber(summary?.expected_profit_margin)}%`} note={`Expected profit ${formatMoney(summary?.expected_profit)}`} tone={summary?.expected_profit_margin >= 0 ? 'positive' : 'warning'} />
              <StatCard icon="◷" label="Production start" value={summary?.expected_production_start_date || '—'} note={`Bottleneck: ${summary?.production_bottleneck || 'None'}`} tone="neutral" />
              <StatCard icon="!" label="Average risk exposure" value={`${formatNumber(summary?.average_risk_exposure)}/100`} note={`${dashboard?.high_risk_suppliers || 0} high-risk suppliers`} tone={summary?.average_risk_exposure > 50 ? 'warning' : 'positive'} />
            </section>

            <section className="dashboard-grid">
              <article className="panel span-2">
                <div className="panel-header">
                  <div><p className="eyebrow">ALLOCATION VIEW</p><h2>Component sourcing plan</h2></div>
                  <StrategySelector strategy={strategy} setStrategy={setStrategy} />
                </div>
                <ComponentTable results={recommendation?.component_results || []} />
              </article>
              <article className="panel">
                <div className="panel-header">
                  <div><p className="eyebrow">TARGET CONTROL</p><h2>Business viability</h2></div>
                  <button className="text-button" onClick={() => setActiveSection('data')}>Edit targets</button>
                </div>
                <div className="target-meter">
                  <div className="target-ring"><strong>{summary?.target_status === 'within_target' ? 'PASS' : summary?.target_status === 'not_configured' ? 'SET' : 'CHECK'}</strong><span>Target status</span></div>
                  <div className="target-details">
                    <div><span>Maximum acceptable</span><strong>{formatMoney(summary?.maximum_acceptable_cost)}</strong></div>
                    <div><span>Simulated cost</span><strong>{formatMoney(summary?.final_product_procurement_cost)}</strong></div>
                    <div><span>Variance</span><strong className={summary?.target_cost_variance > 0 ? 'negative' : 'positive'}>{formatMoney(summary?.target_cost_variance)}</strong></div>
                  </div>
                </div>
              </article>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div><p className="eyebrow">WHAT-IF ANALYSIS</p><h2>Test sourcing assumptions</h2></div>
                <button className="text-button" onClick={() => setActiveSection('scenarios')}>Build custom scenario</button>
              </div>
              <div className="scenario-buttons">
                {scenarioPresets.map((preset) => <button key={preset.label} onClick={() => runScenario(preset)}>{preset.label}<span>→</span></button>)}
              </div>
            </section>
          </>
        )}

        {activeSection === 'data' && (
          <ManualDataView
            selectedProduct={selectedProduct}
            bomRows={bomRows}
            suppliers={suppliers}
            createProduct={createProduct}
            updateProductTargets={updateProductTargets}
            addComponent={addComponent}
            createSupplier={createSupplier}
            createOffer={createOffer}
          />
        )}
        {productId && activeSection === 'bom' && <BomView results={recommendation?.component_results || []} bomRows={bomRows} deleteComponent={deleteComponent} goToEntry={() => setActiveSection('data')} />}
        {productId && activeSection === 'recommendations' && <RecommendationsView rows={allocationRows} expanded={expandedAllocation} setExpanded={setExpandedAllocation} />}
        {productId && activeSection === 'copilot' && <CopilotView productId={productId} product={selectedProduct} strategy={strategy} />}
        {productId && activeSection === 'scenarios' && <ScenarioView result={scenarioResult} runScenario={runScenario} suppliers={suppliers} settings={settings} setError={setError} />}
        {productId && activeSection === 'settings' && settings && <SettingsView settings={settings} setSettings={setSettings} saveSettings={saveSettings} />}
      </main>
    </div>
  )
}

function sectionTitle(section) {
  return {
    overview: 'Executive overview',
    data: 'Manual data entry',
    bom: 'Bill of Materials',
    recommendations: 'Supplier recommendations',
    copilot: 'AI procurement copilot',
    scenarios: 'Scenario simulation',
    settings: 'Supplier scoring and filters',
  }[section]
}

function ManualDataView({ selectedProduct, bomRows, suppliers, createProduct, updateProductTargets, addComponent, createSupplier, createOffer }) {
  return (
    <div className="entry-stack">
      <section className="entry-intro">
        <div><p className="eyebrow">MANUAL WORKSPACE</p><h2>Enter procurement data without CSV files</h2></div>
        <p>Create a product, define its business targets, add BOM components, register suppliers, and enter supplier quotations. Recommendations update after every saved entry.</p>
      </section>
      <div className="entry-grid">
        <NewProductForm onSubmit={createProduct} />
        <TargetForm product={selectedProduct} onSubmit={updateProductTargets} />
        <ComponentForm product={selectedProduct} onSubmit={addComponent} />
        <OfferForm product={selectedProduct} bomRows={bomRows} suppliers={suppliers} onSubmit={createOffer} />
      </div>
      <SupplierForm onSubmit={createSupplier} />
    </div>
  )
}

function NewProductForm({ onSubmit }) {
  const [form, setForm] = useState(blankProduct)
  async function submit(event) {
    event.preventDefault()
    if (await onSubmit(form)) setForm(blankProduct)
  }
  return (
    <form className="panel data-form" onSubmit={submit}>
      <FormHeading eyebrow="STEP 1" title="Create a product" helper="Create a separate product record for each finished product or SKU." />
      <div className="form-grid">
        <Input label="Product name" required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <Input label="SKU" required value={form.sku} onChange={(value) => setForm({ ...form, sku: value })} />
        <Input label="Production duration (days)" type="number" min="0" value={form.production_days} onChange={(value) => setForm({ ...form, production_days: value })} />
      </div>
      <button className="primary-button" type="submit">Create product</button>
    </form>
  )
}

function TargetForm({ product, onSubmit }) {
  const [form, setForm] = useState(blankProduct)
  useEffect(() => {
    if (!product) return setForm(blankProduct)
    setForm({
      name: product.name,
      sku: product.sku,
      target_manufacturing_cost: nullableInput(product.target_manufacturing_cost),
      expected_selling_price: nullableInput(product.expected_selling_price),
      minimum_profit_margin: nullableInput(product.minimum_profit_margin),
      maximum_procurement_budget: nullableInput(product.maximum_procurement_budget),
      production_days: product.production_days,
    })
  }, [product])
  async function submit(event) {
    event.preventDefault()
    await onSubmit(form)
  }
  return (
    <form className="panel data-form" onSubmit={submit}>
      <FormHeading eyebrow="STEP 2" title="Set product targets" helper={product ? `Editing ${product.name}` : 'Create or select a product first.'} />
      <div className="form-grid">
        <Input label="Target manufacturing cost (₹)" type="number" min="0" step="0.01" value={form.target_manufacturing_cost} onChange={(value) => setForm({ ...form, target_manufacturing_cost: value })} disabled={!product} />
        <Input label="Expected selling price (₹)" type="number" min="0" step="0.01" value={form.expected_selling_price} onChange={(value) => setForm({ ...form, expected_selling_price: value })} disabled={!product} />
        <Input label="Minimum profit margin (%)" type="number" min="0" max="100" step="0.1" value={form.minimum_profit_margin} onChange={(value) => setForm({ ...form, minimum_profit_margin: value })} disabled={!product} />
        <Input label="Maximum procurement budget (₹)" type="number" min="0" step="0.01" value={form.maximum_procurement_budget} onChange={(value) => setForm({ ...form, maximum_procurement_budget: value })} disabled={!product} />
        <Input label="Production duration (days)" type="number" min="0" value={form.production_days} onChange={(value) => setForm({ ...form, production_days: value })} disabled={!product} />
      </div>
      <button className="primary-button" type="submit" disabled={!product}>Save targets</button>
    </form>
  )
}

function ComponentForm({ product, onSubmit }) {
  const [form, setForm] = useState(blankComponent())
  async function submit(event) {
    event.preventDefault()
    if (await onSubmit(form)) setForm(blankComponent())
  }
  return (
    <form className="panel data-form" onSubmit={submit}>
      <FormHeading eyebrow="STEP 3" title="Add BOM component" helper={product ? `Adding to ${product.name}` : 'Create or select a product first.'} />
      <div className="form-grid">
        <Input label="Part name" required value={form.part_name} onChange={(value) => setForm({ ...form, part_name: value })} disabled={!product} />
        <Input label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} disabled={!product} placeholder="Electronics, Mechanical..." />
        <Input label="Required quantity" required type="number" min="0.01" step="0.01" value={form.required_quantity} onChange={(value) => setForm({ ...form, required_quantity: value })} disabled={!product} />
        <Input label="Current inventory" type="number" min="0" step="0.01" value={form.current_inventory} onChange={(value) => setForm({ ...form, current_inventory: value })} disabled={!product} />
        <Input label="Reserved inventory" type="number" min="0" step="0.01" value={form.reserved_inventory} onChange={(value) => setForm({ ...form, reserved_inventory: value })} disabled={!product} />
        <Input label="Safety stock" type="number" min="0" step="0.01" value={form.safety_stock} onChange={(value) => setForm({ ...form, safety_stock: value })} disabled={!product} />
        <Input label="Default minimum order quantity" type="number" min="0.01" step="0.01" value={form.default_minimum_order_quantity} onChange={(value) => setForm({ ...form, default_minimum_order_quantity: value })} disabled={!product} />
        <Input label="Required delivery date" required type="date" value={form.required_delivery_date} onChange={(value) => setForm({ ...form, required_delivery_date: value })} disabled={!product} />
      </div>
      <Check label="Critical component" checked={form.is_critical} onChange={(checked) => setForm({ ...form, is_critical: checked })} disabled={!product} />
      <button className="primary-button" type="submit" disabled={!product}>Add component</button>
    </form>
  )
}

function SupplierForm({ onSubmit }) {
  const [form, setForm] = useState(blankSupplier)
  async function submit(event) {
    event.preventDefault()
    if (await onSubmit(form)) setForm(blankSupplier)
  }
  const update = (key, value) => setForm({ ...form, [key]: value })
  return (
    <form className="panel data-form wide-form" onSubmit={submit}>
      <FormHeading eyebrow="SUPPLIER MASTER" title="Add a supplier and capacity profile" helper="Supplier quality, risk, fulfilment, and capacity values directly influence recommendations." />
      <div className="form-grid three-columns">
        <Input label="Supplier name" required value={form.name} onChange={(value) => update('name', value)} />
        <Input label="Country" required value={form.country} onChange={(value) => update('country', value)} />
        <Input label="Quality rating (0–100)" type="number" min="0" max="100" value={form.quality_rating} onChange={(value) => update('quality_rating', value)} />
        <Input label="Risk score (0–100)" type="number" min="0" max="100" value={form.risk_score} onChange={(value) => update('risk_score', value)} />
        <Input label="Average lead time (days)" type="number" min="0" value={form.average_lead_time_days} onChange={(value) => update('average_lead_time_days', value)} />
        <Input label="Monthly production capacity" required type="number" min="0.01" step="0.01" value={form.monthly_production_capacity} onChange={(value) => update('monthly_production_capacity', value)} />
        <Input label="Current committed capacity" type="number" min="0" step="0.01" value={form.current_committed_capacity} onChange={(value) => update('current_committed_capacity', value)} />
        <Input label="Maximum order size" type="number" min="0" step="0.01" value={form.maximum_order_size} onChange={(value) => update('maximum_order_size', value)} />
      </div>
      <div className="checkbox-row">
        <Check label="Domestic supplier" checked={form.is_domestic} onChange={(checked) => update('is_domestic', checked)} />
        <Check label="Approved supplier" checked={form.is_approved} onChange={(checked) => update('is_approved', checked)} />
        <Check label="ISO certified" checked={form.iso_certified} onChange={(checked) => update('iso_certified', checked)} />
      </div>
      <details className="advanced-fields">
        <summary>Additional historical performance fields</summary>
        <div className="form-grid three-columns">
          <Input label="On-time delivery (%)" type="number" min="0" max="100" value={form.on_time_delivery_percentage} onChange={(value) => update('on_time_delivery_percentage', value)} />
          <Input label="Defect percentage" type="number" min="0" max="100" step="0.01" value={form.defect_percentage} onChange={(value) => update('defect_percentage', value)} />
          <Input label="Fulfilment percentage" type="number" min="0" max="100" value={form.fulfilment_percentage} onChange={(value) => update('fulfilment_percentage', value)} />
          <Input label="Contract compliance (%)" type="number" min="0" max="100" value={form.contract_compliance_percentage} onChange={(value) => update('contract_compliance_percentage', value)} />
          <Input label="Historical spending (₹)" type="number" min="0" step="0.01" value={form.historical_spending} onChange={(value) => update('historical_spending', value)} />
        </div>
      </details>
      <button className="primary-button" type="submit">Add supplier</button>
    </form>
  )
}

function OfferForm({ product, bomRows, suppliers, onSubmit }) {
  const [form, setForm] = useState(blankOffer)
  useEffect(() => {
    setForm((current) => ({
      ...current,
      component_id: bomRows.some((row) => row.id === Number(current.component_id)) ? current.component_id : (bomRows[0]?.id || ''),
      supplier_id: suppliers.some((row) => row.id === Number(current.supplier_id)) ? current.supplier_id : (suppliers[0]?.id || ''),
    }))
  }, [bomRows, suppliers])
  async function submit(event) {
    event.preventDefault()
    if (await onSubmit(form)) {
      setForm({ ...blankOffer, component_id: bomRows[0]?.id || '', supplier_id: suppliers[0]?.id || '' })
    }
  }
  const disabled = !product || !bomRows.length || !suppliers.length
  return (
    <form className="panel data-form" onSubmit={submit}>
      <FormHeading eyebrow="STEP 4" title="Add supplier quotation" helper="Enter every landed-cost input for one supplier and one component." />
      {disabled && <p className="inline-warning">You need a selected product, at least one BOM component, and at least one supplier.</p>}
      <div className="form-grid">
        <Select label="Component" value={form.component_id} onChange={(value) => setForm({ ...form, component_id: value })} disabled={disabled} options={bomRows.map((row) => [row.id, row.part_name])} />
        <Select label="Supplier" value={form.supplier_id} onChange={(value) => setForm({ ...form, supplier_id: value })} disabled={disabled} options={suppliers.map((row) => [row.id, row.name])} />
        <Input label="Unit price (₹)" required type="number" min="0.01" step="0.01" value={form.unit_price} onChange={(value) => setForm({ ...form, unit_price: value })} disabled={disabled} />
        <Input label="Transportation per unit (₹)" type="number" min="0" step="0.01" value={form.transportation_cost_per_unit} onChange={(value) => setForm({ ...form, transportation_cost_per_unit: value })} disabled={disabled} />
        <Input label="Customs/import duty (%)" type="number" min="0" step="0.01" value={form.customs_import_duty_percentage} onChange={(value) => setForm({ ...form, customs_import_duty_percentage: value })} disabled={disabled} />
        <Input label="Packaging per unit (₹)" type="number" min="0" step="0.01" value={form.packaging_cost_per_unit} onChange={(value) => setForm({ ...form, packaging_cost_per_unit: value })} disabled={disabled} />
        <Input label="Warehousing per unit (₹)" type="number" min="0" step="0.01" value={form.warehousing_cost_per_unit} onChange={(value) => setForm({ ...form, warehousing_cost_per_unit: value })} disabled={disabled} />
        <Input label="Taxes (%)" type="number" min="0" step="0.01" value={form.tax_percentage} onChange={(value) => setForm({ ...form, tax_percentage: value })} disabled={disabled} />
        <Input label="Delay-related cost per unit (₹)" type="number" min="0" step="0.01" value={form.delay_related_cost_per_unit} onChange={(value) => setForm({ ...form, delay_related_cost_per_unit: value })} disabled={disabled} />
        <Input label="Lead time (days)" type="number" min="0" value={form.lead_time_days} onChange={(value) => setForm({ ...form, lead_time_days: value })} disabled={disabled} />
        <Input label="Minimum order quantity" type="number" min="0.01" step="0.01" value={form.minimum_order_quantity} onChange={(value) => setForm({ ...form, minimum_order_quantity: value })} disabled={disabled} />
      </div>
      <button className="primary-button" type="submit" disabled={disabled}>Save quotation</button>
    </form>
  )
}

function FormHeading({ eyebrow, title, helper }) {
  return <div className="form-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="helper">{helper}</p></div>
}

function Input({ label, onChange, ...props }) {
  return <label className="field"><span>{label}</span><input {...props} onChange={(event) => onChange(event.target.value)} /></label>
}

function Select({ label, options, onChange, ...props }) {
  return <label className="field"><span>{label}</span><select {...props} onChange={(event) => onChange(event.target.value)}>{options.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label>
}

function Check({ label, checked, onChange, disabled = false }) {
  return <label className="check-field"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} /><span>{label}</span></label>
}

function StrategySelector({ strategy, setStrategy }) {
  return <div className="segmented">{strategies.map(([value, label]) => <button type="button" key={value} className={strategy === value ? 'active' : ''} onClick={() => setStrategy(value)}>{label}</button>)}</div>
}

function ComponentTable({ results }) {
  if (!results.length) return <div className="empty-state small"><strong>No BOM components yet</strong><span>Add components and supplier quotations from Manual data entry.</span></div>
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Component</th><th>Net requirement</th><th>Recommended suppliers</th><th>Latest arrival</th><th>Status</th><th>Cost</th></tr></thead>
        <tbody>
          {results.map((item) => {
            const latest = item.allocations.map((a) => a.expected_arrival_date).sort().at(-1)
            const cost = item.allocations.reduce((sum, a) => sum + a.cost_breakdown.total_landed_cost, 0)
            return <tr key={item.component_id}>
              <td><strong>{item.part_name}</strong><span className="cell-subtext">{item.category}</span></td>
              <td>{formatNumber(item.net_purchase_requirement)}</td>
              <td>{item.allocations.length ? item.allocations.map((a) => `${a.supplier_name} (${formatNumber(a.allocated_quantity)})`).join(', ') : 'No eligible allocation'}</td>
              <td>{latest || '—'}</td>
              <td><Badge type={item.status === 'fully_allocated' || item.status === 'inventory_sufficient' ? 'success' : 'danger'}>{item.status.replaceAll('_', ' ')}</Badge></td>
              <td><strong>{formatMoney(cost)}</strong></td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  )
}

function BomView({ results, bomRows, deleteComponent, goToEntry }) {
  const resultMap = new Map(results.map((item) => [item.component_id, item]))
  return (
    <section className="panel">
      <div className="panel-header">
        <div><p className="eyebrow">INVENTORY-AWARE DEMAND</p><h2>Complete product BOM</h2></div>
        <div className="header-buttons"><button className="text-button" onClick={goToEntry}>Add component manually</button><a className="text-link" href="/bom-template.csv" download>Download CSV template</a></div>
      </div>
      {!bomRows.length ? <div className="empty-state"><strong>No BOM components</strong><span>Add components manually or upload a CSV/XLSX file.</span></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Part</th><th>Required</th><th>Inventory</th><th>Reserved</th><th>Safety stock</th><th>Net purchase</th><th>Required date</th><th>Critical</th><th>Actions</th></tr></thead>
            <tbody>{bomRows.map((row) => {
              const result = resultMap.get(row.id)
              return <tr key={row.id}>
                <td><strong>{row.part_name}</strong><span className="cell-subtext">{row.category}</span></td>
                <td>{formatNumber(row.required_quantity)}</td>
                <td>{formatNumber(row.current_inventory)}</td>
                <td>{formatNumber(row.reserved_inventory)}</td>
                <td>{formatNumber(row.safety_stock)}</td>
                <td><strong>{formatNumber(result?.net_purchase_requirement)}</strong></td>
                <td>{row.required_delivery_date}</td>
                <td>{row.is_critical ? 'Yes' : 'No'}</td>
                <td><button className="danger-button" onClick={() => deleteComponent(row)}>Delete</button></td>
              </tr>
            })}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function RecommendationsView({ rows, expanded, setExpanded }) {
  if (!rows.length) return <div className="empty-state panel"><strong>No supplier allocations yet</strong><span>Add eligible supplier quotations for the selected BOM components.</span></div>
  return (
    <div className="recommendation-grid">
      {rows.map((row) => {
        const key = `${row.component.component_id}-${row.supplier_id}`
        return <article className="supplier-card" key={key}>
          <div className="supplier-card-head"><div><p className="eyebrow">{row.component.part_name}</p><h2>{row.supplier_name}</h2><span>{row.country} · {row.is_domestic ? 'Domestic' : 'International'}</span></div><div className="score"><strong>{row.overall_score}</strong><span>Overall score</span></div></div>
          <p className="reason">{row.selection_reason}</p>
          <div className="score-grid">
            {Object.entries(row.score_breakdown).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><div className="mini-bar"><i style={{ width: `${value}%` }} /></div></div>)}
          </div>
          <div className="supplier-facts"><span>Allocation <strong>{formatNumber(row.allocated_quantity)}</strong></span><span>Lead time <strong>{row.lead_time_days} days</strong></span><span>Arrival <strong>{row.expected_arrival_date}</strong></span><span>Risk <strong>{row.risk_exposure}/100</strong></span></div>
          <button className="details-button" onClick={() => setExpanded(expanded === key ? null : key)}>{expanded === key ? 'Hide cost details' : 'Show landed-cost details'}</button>
          {expanded === key && <CostBreakdown breakdown={row.cost_breakdown} />}
        </article>
      })}
    </div>
  )
}

function ScenarioView({ result, runScenario, suppliers, settings, setError }) {
  const [form, setForm] = useState(() => initialScenario(settings))
  useEffect(() => {
    setForm((current) => ({
      ...current,
      cost_weight: Math.round((settings?.cost_weight ?? 0.3) * 100),
      quality_weight: Math.round((settings?.quality_weight ?? 0.3) * 100),
      lead_time_weight: Math.round((settings?.lead_time_weight ?? 0.2) * 100),
      risk_weight: Math.round((settings?.risk_weight ?? 0.2) * 100),
    }))
  }, [settings])

  function toggleUnavailable(supplierId, checked) {
    setForm((current) => ({
      ...current,
      unavailable_supplier_ids: checked
        ? [...current.unavailable_supplier_ids, supplierId]
        : current.unavailable_supplier_ids.filter((id) => id !== supplierId),
    }))
  }

  function submit(event) {
    event.preventDefault()
    const weights = ['cost_weight', 'quality_weight', 'lead_time_weight', 'risk_weight']
      .reduce((sum, key) => sum + Number(form[key] || 0), 0)
    if (form.use_custom_weights && Math.abs(weights - 100) > 0.001) {
      setError('Custom scenario weights must total 100%.')
      return
    }
    const payload = {
      strategy: form.strategy,
      supplier_price_change_percentage: Number(form.supplier_price_change_percentage || 0),
      demand_change_percentage: Number(form.demand_change_percentage || 0),
      lead_time_delay_days: Number(form.lead_time_delay_days || 0),
      transportation_cost_change_percentage: Number(form.transportation_cost_change_percentage || 0),
      domestic_suppliers_only: form.domestic_suppliers_only,
      unavailable_supplier_ids: form.unavailable_supplier_ids,
    }
    if (form.use_custom_weights) {
      payload.cost_weight = Number(form.cost_weight) / 100
      payload.quality_weight = Number(form.quality_weight) / 100
      payload.lead_time_weight = Number(form.lead_time_weight) / 100
      payload.risk_weight = Number(form.risk_weight) / 100
    }
    runScenario({ label: form.label || 'Custom scenario', payload })
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header"><div><p className="eyebrow">SIMULATION PRESETS</p><h2>Quick scenario tests</h2></div></div>
        <div className="scenario-buttons">{scenarioPresets.map((preset) => <button key={preset.label} onClick={() => runScenario(preset)}>{preset.label}<span>Run →</span></button>)}</div>
      </section>

      <form className="panel scenario-builder" onSubmit={submit}>
        <div className="panel-header"><div><p className="eyebrow">CUSTOM WHAT-IF</p><h2>Build a manual scenario</h2></div><Badge type="neutral">Does not change saved data</Badge></div>
        <div className="form-grid three-columns">
          <Input label="Scenario name" value={form.label} onChange={(value) => setForm({ ...form, label: value })} />
          <Select label="Allocation strategy" value={form.strategy} onChange={(value) => setForm({ ...form, strategy: value })} options={strategies} />
          <Input label="Supplier price change (%)" type="number" step="0.1" value={form.supplier_price_change_percentage} onChange={(value) => setForm({ ...form, supplier_price_change_percentage: value })} />
          <Input label="Demand change (%)" type="number" step="0.1" value={form.demand_change_percentage} onChange={(value) => setForm({ ...form, demand_change_percentage: value })} />
          <Input label="Transportation cost change (%)" type="number" step="0.1" value={form.transportation_cost_change_percentage} onChange={(value) => setForm({ ...form, transportation_cost_change_percentage: value })} />
          <Input label="Delivery delay (days)" type="number" min="0" value={form.lead_time_delay_days} onChange={(value) => setForm({ ...form, lead_time_delay_days: value })} />
        </div>
        <div className="checkbox-row"><Check label="Use domestic suppliers only" checked={form.domestic_suppliers_only} onChange={(checked) => setForm({ ...form, domestic_suppliers_only: checked })} /><Check label="Override score weights for this scenario" checked={form.use_custom_weights} onChange={(checked) => setForm({ ...form, use_custom_weights: checked })} /></div>

        <div className="scenario-section">
          <strong>Unavailable suppliers</strong>
          <p className="helper">Select any suppliers that should be removed from this simulation.</p>
          <div className="supplier-checks">{suppliers.map((supplier) => <Check key={supplier.id} label={supplier.name} checked={form.unavailable_supplier_ids.includes(supplier.id)} onChange={(checked) => toggleUnavailable(supplier.id, checked)} />)}</div>
        </div>

        {form.use_custom_weights && <div className="scenario-section weight-box"><strong>Scenario score weights</strong><div className="form-grid four-columns">
          {['cost_weight', 'quality_weight', 'lead_time_weight', 'risk_weight'].map((key) => <Input key={key} label={`${key.replaceAll('_', ' ')} (%)`} type="number" min="0" max="100" step="1" value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} />)}
        </div><p className="helper">Total: {['cost_weight', 'quality_weight', 'lead_time_weight', 'risk_weight'].reduce((sum, key) => sum + Number(form[key] || 0), 0)}%</p></div>}

        <button className="primary-button" type="submit">Run custom scenario</button>
      </form>

      {!result ? <div className="empty-state panel"><strong>No scenario run yet</strong><span>Use a preset or enter your own assumptions above.</span></div> : (
        <section className="panel scenario-result">
          <div className="panel-header"><div><p className="eyebrow">SCENARIO RESULT</p><h2>{result.label}</h2></div><Badge type={result.scenario.summary.all_components_fully_allocated ? 'success' : 'danger'}>{result.scenario.summary.all_components_fully_allocated ? 'Feasible' : 'Capacity or constraint failure'}</Badge></div>
          <div className="comparison-grid">
            <Comparison label="Final product cost" before={formatMoney(result.baseline.summary.final_product_procurement_cost)} after={formatMoney(result.scenario.summary.final_product_procurement_cost)} delta={signedMoney(result.difference.final_product_procurement_cost)} />
            <Comparison label="Quality score" before={result.baseline.summary.average_quality_score} after={result.scenario.summary.average_quality_score} delta={signedNumber(result.difference.average_quality_score)} />
            <Comparison label="Risk exposure" before={result.baseline.summary.average_risk_exposure} after={result.scenario.summary.average_risk_exposure} delta={signedNumber(result.difference.average_risk_exposure)} />
            <Comparison label="Supplier dependency" before={`${result.baseline.summary.supplier_dependency_percentage}%`} after={`${result.scenario.summary.supplier_dependency_percentage}%`} delta={`${signedNumber(result.difference.supplier_dependency_percentage)}%`} />
            <Comparison label="Profit margin" before={optionalPercent(result.baseline.summary.expected_profit_margin)} after={optionalPercent(result.scenario.summary.expected_profit_margin)} delta={result.difference.expected_profit_margin === null ? '—' : `${signedNumber(result.difference.expected_profit_margin)}%`} />
            <Comparison label="Production start" before={result.baseline.summary.expected_production_start_date || '—'} after={result.scenario.summary.expected_production_start_date || '—'} delta="Schedule impact" />
          </div>
        </section>
      )}
    </>
  )
}

function CopilotView({ productId, product, strategy }) {
  const [status, setStatus] = useState(null)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Ask me about supplier selection, landed cost, inventory, capacity, risk, delivery dates, target cost, or profit margin.' },
  ])
  const [sources, setSources] = useState([])
  const [busy, setBusy] = useState(false)
  const [copilotError, setCopilotError] = useState('')
  const [indexMessage, setIndexMessage] = useState('')

  const quickQuestions = [
    'Why is the current supplier allocation recommended?',
    'Which component is delaying production and why?',
    'Where can we reduce the final landed cost?',
    'Does this sourcing plan meet the target margin?',
  ]

  useEffect(() => {
    api.aiStatus().then(setStatus).catch((err) => setCopilotError(err.message))
  }, [])

  useEffect(() => {
    setMessages([{ role: 'assistant', text: `I am ready to analyse ${product?.name || 'this product'} using the live procurement data.` }])
    setSources([])
    setQuestion('')
  }, [productId])

  async function refreshKnowledge() {
    try {
      setBusy(true)
      setCopilotError('')
      const result = await api.indexKnowledge(productId, strategy)
      setIndexMessage(`${result.indexed_chunks} live procurement records indexed in Chroma DB.`)
    } catch (err) {
      setCopilotError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function ask(event, presetQuestion = null) {
    event?.preventDefault()
    const prompt = (presetQuestion ?? question).trim()
    if (!prompt || busy) return
    setMessages((current) => [...current, { role: 'user', text: prompt }])
    setQuestion('')
    setBusy(true)
    setCopilotError('')
    try {
      const result = await api.askCopilot(productId, { question: prompt, strategy, top_k: 5 })
      setMessages((current) => [...current, {
        role: 'assistant',
        text: result.answer,
        meta: `${result.provider}${result.model ? ` · ${result.model}` : ''} · ${result.retrieved_chunks} sources`,
      }])
      setSources(result.sources || [])
      setIndexMessage(`${result.indexed_chunks} live records indexed before answering.`)
    } catch (err) {
      setCopilotError(err.message)
      setMessages((current) => [...current, { role: 'assistant', text: `I could not complete that analysis: ${err.message}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="copilot-layout">
      <section className="panel copilot-main">
        <div className="panel-header copilot-header">
          <div>
            <p className="eyebrow">RAG PROCUREMENT ASSISTANT</p>
            <h2>Ask questions about {product?.name}</h2>
            <p className="helper">SourceWise searches live product, BOM, supplier, allocation, cost, risk, and schedule records before generating an answer.</p>
          </div>
          <div className="ai-status-stack">
            <Badge type={status?.chroma_ready ? 'success' : 'danger'}>{status?.chroma_ready ? 'Chroma ready' : 'Chroma unavailable'}</Badge>
            <Badge type={status?.llm_configured ? 'success' : 'neutral'}>{status?.llm_configured ? `${status.provider} connected` : 'Gemini key required'}</Badge>
          </div>
        </div>

        {!status?.llm_configured && status && (
          <div className="copilot-setup-note">
            Retrieval works now. To generate full AI explanations, add <code>GEMINI_API_KEY</code> to <code>backend/.env</code>, then restart the backend.
          </div>
        )}
        {copilotError && <div className="alert error"><strong>Copilot error:</strong> {copilotError}<button onClick={() => setCopilotError('')}>×</button></div>}

        <div className="quick-question-grid">
          {quickQuestions.map((item) => <button key={item} onClick={(event) => ask(event, item)} disabled={busy}>{item}<span>→</span></button>)}
        </div>

        <div className="chat-window">
          {messages.map((message, index) => (
            <article className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
              <div className="chat-avatar">{message.role === 'assistant' ? 'AI' : 'U'}</div>
              <div><strong>{message.role === 'assistant' ? 'SourceWise Copilot' : 'You'}</strong><p>{message.text}</p>{message.meta && <small>{message.meta}</small>}</div>
            </article>
          ))}
          {busy && <article className="chat-message assistant"><div className="chat-avatar">AI</div><div><strong>SourceWise Copilot</strong><p className="typing">Searching procurement records and preparing an answer…</p></div></article>}
        </div>

        <form className="copilot-composer" onSubmit={ask}>
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Example: Why was Apex Components selected instead of CoreFab?" rows="3" disabled={busy} />
          <button className="primary-button" type="submit" disabled={busy || question.trim().length < 3}>{busy ? 'Analysing…' : 'Ask Copilot'}</button>
        </form>
      </section>

      <aside className="copilot-side">
        <section className="panel knowledge-panel">
          <div className="panel-header"><div><p className="eyebrow">KNOWLEDGE INDEX</p><h2>Live RAG context</h2></div></div>
          <div className="knowledge-facts">
            <div><span>Product</span><strong>{product?.name || '—'}</strong></div>
            <div><span>Strategy</span><strong>{strategies.find(([key]) => key === strategy)?.[1] || strategy}</strong></div>
            <div><span>Vector database</span><strong>Chroma DB</strong></div>
            <div><span>Embeddings</span><strong>{status?.embedding_mode || 'Loading…'}</strong></div>
          </div>
          <button className="secondary-button" onClick={refreshKnowledge} disabled={busy}>Refresh procurement knowledge</button>
          {indexMessage && <p className="index-message">✓ {indexMessage}</p>}
        </section>

        <section className="panel source-panel">
          <div className="panel-header"><div><p className="eyebrow">RETRIEVED EVIDENCE</p><h2>Sources used</h2></div></div>
          {!sources.length ? <div className="empty-sources">Sources will appear here after you ask a question.</div> : (
            <div className="source-list">
              {sources.map((source) => (
                <details key={source.source_id} className="source-card">
                  <summary><span>{source.source_id}</span><strong>{source.title}</strong><em>{Math.round(source.relevance_score * 100)}%</em></summary>
                  <p>{source.text}</p>
                </details>
              ))}
            </div>
          )}
        </section>
      </aside>
    </div>
  )
}

function Comparison({ label, before, after, delta }) {
  return <div className="comparison-card"><span>{label}</span><div><small>Baseline</small><strong>{before ?? '—'}</strong></div><div><small>Scenario</small><strong>{after ?? '—'}</strong></div><em>{delta ?? '—'}</em></div>
}

function SettingsView({ settings, setSettings, saveSettings }) {
  const weightTotal = Number(settings.cost_weight) + Number(settings.quality_weight) + Number(settings.lead_time_weight) + Number(settings.risk_weight)
  const update = (key, value) => setSettings({ ...settings, [key]: value })
  return (
    <form onSubmit={saveSettings} className="settings-layout">
      <section className="panel">
        <div className="panel-header"><div><p className="eyebrow">WEIGHTED RANKING</p><h2>Supplier score configuration</h2></div><Badge type={Math.abs(weightTotal - 1) < 0.001 ? 'success' : 'danger'}>{Math.round(weightTotal * 100)}% total</Badge></div>
        <p className="helper">Weights use decimal values. For example, 0.30 means 30%.</p>
        <div className="form-grid">
          {['cost_weight', 'quality_weight', 'lead_time_weight', 'risk_weight'].map((key) => <Input key={key} label={key.replaceAll('_', ' ')} type="number" step="0.05" min="0" max="1" value={settings[key]} onChange={(value) => update(key, value)} />)}
        </div>
      </section>
      <section className="panel">
        <div className="panel-header"><div><p className="eyebrow">MANDATORY CONDITIONS</p><h2>Enterprise procurement filters</h2></div></div>
        <div className="form-grid">
          <Input label="Maximum lead time (days)" type="number" value={settings.maximum_lead_time_days ?? ''} onChange={(value) => update('maximum_lead_time_days', value ? Number(value) : null)} />
          <Input label="Minimum quality rating" type="number" min="0" max="100" value={settings.minimum_quality_rating ?? ''} onChange={(value) => update('minimum_quality_rating', value ? Number(value) : null)} />
          <Input label="Maximum risk score" type="number" min="0" max="100" value={settings.maximum_risk_score ?? ''} onChange={(value) => update('maximum_risk_score', value ? Number(value) : null)} />
          <Input label="Maximum supplier share (%)" type="number" min="1" max="100" value={settings.maximum_supplier_share_percentage} onChange={(value) => update('maximum_supplier_share_percentage', Number(value))} />
        </div>
        <div className="toggle-list">
          {[['approved_suppliers_only', 'Only approved suppliers'], ['require_iso_certification', 'ISO certification required'], ['require_domestic_supplier', 'At least one domestic supplier'], ['enforce_minimum_order_quantity', 'Enforce minimum order quantity']].map(([key, label]) => <label className="toggle" key={key}><input type="checkbox" checked={settings[key]} onChange={(event) => update(key, event.target.checked)} /><span /><strong>{label}</strong></label>)}
        </div>
      </section>
      <button className="primary-button" type="submit">Save settings and recalculate</button>
    </form>
  )
}

function productPayload(form) {
  return {
    name: form.name.trim(),
    sku: form.sku.trim(),
    target_manufacturing_cost: optionalNumber(form.target_manufacturing_cost),
    expected_selling_price: optionalNumber(form.expected_selling_price),
    minimum_profit_margin: optionalNumber(form.minimum_profit_margin),
    maximum_procurement_budget: optionalNumber(form.maximum_procurement_budget),
    production_days: Number(form.production_days || 0),
  }
}

function numericPayload(payload, keys) {
  const copy = { ...payload }
  keys.forEach((key) => { copy[key] = Number(copy[key]) })
  return copy
}

function optionalNumber(value) {
  return value === '' || value === null || value === undefined ? null : Number(value)
}

function nullableInput(value) {
  return value === null || value === undefined ? '' : value
}

function futureDate(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function initialScenario(settings) {
  return {
    label: 'Custom scenario',
    strategy: 'balanced',
    supplier_price_change_percentage: 0,
    demand_change_percentage: 0,
    lead_time_delay_days: 0,
    transportation_cost_change_percentage: 0,
    domestic_suppliers_only: false,
    unavailable_supplier_ids: [],
    use_custom_weights: false,
    cost_weight: Math.round((settings?.cost_weight ?? 0.3) * 100),
    quality_weight: Math.round((settings?.quality_weight ?? 0.3) * 100),
    lead_time_weight: Math.round((settings?.lead_time_weight ?? 0.2) * 100),
    risk_weight: Math.round((settings?.risk_weight ?? 0.2) * 100),
  }
}

function signedNumber(value) {
  if (value === null || value === undefined) return '—'
  const number = Number(value)
  return `${number > 0 ? '+' : ''}${formatNumber(number)}`
}

function signedMoney(value) {
  if (value === null || value === undefined) return '—'
  const number = Number(value)
  return `${number > 0 ? '+' : ''}${formatMoney(number)}`
}

function optionalPercent(value) {
  return value === null || value === undefined ? '—' : `${formatNumber(value)}%`
}
