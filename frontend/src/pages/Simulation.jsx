import { useState, useEffect } from 'react'
import { procurementAPI } from '../utils/api'
import SimulationForm from '../components/SimulationForm'
import SupplierComparison from '../components/SupplierComparison'
import DecisionSummary from '../components/DecisionSummary'
import ProcurementCharts from '../components/ProcurementCharts'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

function Simulation() {
  const [suppliers, setSuppliers] = useState([])
  const [simulationResult, setSimulationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(true)

  // Fetch suppliers on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setFormLoading(true)
        const response = await procurementAPI.getSuppliers()
        setSuppliers(response.data.suppliers || [])
      } catch (error) {
        console.error('Failed to fetch suppliers:', error)
        toast.error('Failed to load suppliers')
      } finally {
        setFormLoading(false)
      }
    }

    fetchSuppliers()
  }, [])

  const handleSimulation = async (formData) => {
    try {
      setLoading(true)
      const response = await procurementAPI.simulate(formData)
      setSimulationResult(response.data)
      toast.success('Simulation completed successfully!')
    } catch (error) {
      console.error('Simulation failed:', error)
      toast.error(error.response?.data?.message || 'Simulation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Procurement Simulation</h2>
        {formLoading ? (
          <LoadingSpinner />
        ) : (
          <SimulationForm suppliers={suppliers} onSubmit={handleSimulation} loading={loading} />
        )}
      </div>

      {/* Results Section */}
      {simulationResult && !loading && (
        <>
          {/* Decision Summary */}
          <DecisionSummary result={simulationResult} />

          {/* Supplier Comparison Table */}
          <SupplierComparison suppliers={simulationResult.supplier_scores} />

          {/* Charts */}
          <ProcurementCharts result={simulationResult} />
        </>
      )}

      {loading && (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Running procurement analysis...</p>
        </div>
      )}
    </div>
  )
}

export default Simulation
