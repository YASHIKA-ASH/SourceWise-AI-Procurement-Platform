import { useState } from 'react'
import { Play } from 'lucide-react'

function SimulationForm({ suppliers, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    material: '',
    quantity_required: '',
    current_inventory: '',
    daily_usage: '',
    selected_suppliers: [],
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        selected_suppliers: checked
          ? [...prev.selected_suppliers, value]
          : prev.selected_suppliers.filter((s) => s !== value),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!formData.material.trim()) {
      alert('Please enter material name')
      return
    }
    if (!formData.quantity_required || formData.quantity_required <= 0) {
      alert('Please enter valid required quantity')
      return
    }
    if (formData.current_inventory === '' || formData.current_inventory < 0) {
      alert('Please enter valid current inventory')
      return
    }
    if (!formData.daily_usage || formData.daily_usage <= 0) {
      alert('Please enter valid daily usage')
      return
    }
    if (formData.selected_suppliers.length === 0) {
      alert('Please select at least one supplier')
      return
    }

    // Convert to numbers
    const payload = {
      ...formData,
      quantity_required: parseFloat(formData.quantity_required),
      current_inventory: parseFloat(formData.current_inventory),
      daily_usage: parseFloat(formData.daily_usage),
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Material Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Material Name *</label>
        <input
          type="text"
          name="material"
          value={formData.material}
          onChange={handleInputChange}
          placeholder="e.g., Aluminum Sheet 6061-T6"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Grid for quantity inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quantity Required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity Required (units) *
          </label>
          <input
            type="number"
            name="quantity_required"
            value={formData.quantity_required}
            onChange={handleInputChange}
            placeholder="e.g., 1000"
            min="1"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Current Inventory */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Inventory (units) *
          </label>
          <input
            type="number"
            name="current_inventory"
            value={formData.current_inventory}
            onChange={handleInputChange}
            placeholder="e.g., 500"
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Daily Usage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Usage (units) *
          </label>
          <input
            type="number"
            name="daily_usage"
            value={formData.daily_usage}
            onChange={handleInputChange}
            placeholder="e.g., 50"
            min="0.01"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Supplier Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Suppliers to Compare *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="flex items-center">
              <input
                type="checkbox"
                id={`supplier-${supplier.id}`}
                value={supplier.name}
                checked={formData.selected_suppliers.includes(supplier.name)}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label
                htmlFor={`supplier-${supplier.id}`}
                className="ml-2 text-sm text-gray-700 cursor-pointer"
              >
                {supplier.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running Simulation...
            </>
          ) : (
            <>
              <Play size={18} />
              Run Simulation
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default SimulationForm
