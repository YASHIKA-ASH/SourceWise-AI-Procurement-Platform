const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://sourcewise-35-175-11-218.nip.io";

const ACCESS_KEY = 'sourcewise_access_token'
const REFRESH_KEY = 'sourcewise_refresh_token'
const USER_KEY = 'sourcewise_user'

export const authStorage = {
  accessToken: () => localStorage.getItem(ACCESS_KEY),
  refreshToken: () => localStorage.getItem(REFRESH_KEY),
  user: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    } catch {
      return null
    }
  },
  save: (session) => {
    localStorage.setItem(ACCESS_KEY, session.access_token)
    localStorage.setItem(REFRESH_KEY, session.refresh_token)
    localStorage.setItem(USER_KEY, JSON.stringify(session.user))
    window.dispatchEvent(new Event('sourcewise-auth-changed'))
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    window.dispatchEvent(new Event('sourcewise-auth-changed'))
  },
}

let refreshPromise = null

async function parseError(response) {
  try {
    const payload = await response.json()
    return typeof payload.detail === 'string' ? payload.detail : JSON.stringify(payload.detail)
  } catch {
    return `${response.status} ${response.statusText}`
  }
}

async function refreshSession() {
  const refreshToken = authStorage.refreshToken()
  if (!refreshToken) throw new Error('Your session has expired. Please sign in again.')
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await parseError(response))
        const session = await response.json()
        authStorage.save(session)
        return session
      })
      .catch((error) => {
        authStorage.clear()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function request(path, options = {}, retryAuth = true) {
  const headers = new Headers(options.headers || {})
  const accessToken = authStorage.accessToken()
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (response.status === 401 && retryAuth && !path.startsWith('/auth/')) {
    await refreshSession()
    return request(path, options, false)
  }
  if (!response.ok) throw new Error(await parseError(response))
  if (response.status === 204) return null
  return response.json()
}

const jsonOptions = (method, payload) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})

export const api = {
  authStatus: () => request('/auth/status', {}, false),
  login: (payload) => request('/auth/login', jsonOptions('POST', payload), false),
  me: () => request('/auth/me'),
  logout: async () => {
    const refreshToken = authStorage.refreshToken()
    try {
      await request('/auth/logout', jsonOptions('POST', { refresh_token: refreshToken }))
    } finally {
      authStorage.clear()
    }
  },

  users: () => request('/users'),
  createUser: (payload) => request('/users', jsonOptions('POST', payload)),
  updateUser: (userId, payload) => request(`/users/${userId}`, jsonOptions('PATCH', payload)),
  auditEvents: (limit = 100) => request(`/admin/audit-events?limit=${limit}`),
  infrastructure: () => request('/admin/infrastructure'),

  products: () => request('/products'),
  createProduct: (payload) => request('/products', jsonOptions('POST', payload)),
  updateProduct: (productId, payload) => request(`/products/${productId}`, jsonOptions('PATCH', payload)),
  deleteProduct: (productId) => request(`/products/${productId}`, { method: 'DELETE' }),

  bom: (productId) => request(`/products/${productId}/bom`),
  addComponent: (productId, payload) => request(`/products/${productId}/components`, jsonOptions('POST', payload)),
  updateComponent: (productId, componentId, payload) =>
    request(`/products/${productId}/components/${componentId}`, jsonOptions('PATCH', payload)),
  deleteComponent: (productId, componentId) =>
    request(`/products/${productId}/components/${componentId}`, { method: 'DELETE' }),
  uploadBom: (productId, file) => {
    const form = new FormData()
    form.append('file', file)
    return request(`/products/${productId}/bom/upload`, { method: 'POST', body: form })
  },

  suppliers: () => request('/suppliers'),
  createSupplier: (payload) => request('/suppliers', jsonOptions('POST', payload)),
  updateSupplier: (supplierId, payload) => request(`/suppliers/${supplierId}`, jsonOptions('PATCH', payload)),
  offers: (componentId) => request(`/components/${componentId}/offers`),
  createOffer: (componentId, payload) => request(`/components/${componentId}/offers`, jsonOptions('POST', payload)),
  updateOffer: (offerId, payload) => request(`/offers/${offerId}`, jsonOptions('PATCH', payload)),
  deleteOffer: (offerId) => request(`/offers/${offerId}`, { method: 'DELETE' }),

  dashboard: () => request('/dashboard/summary'),
  settings: () => request('/settings'),
  saveSettings: (payload) => request('/settings', jsonOptions('PUT', payload)),
  recommendation: (productId, strategy) =>
    request(`/analysis/products/${productId}/recommendation?strategy=${strategy}`),
  scenario: (productId, payload) =>
    request(`/analysis/products/${productId}/scenario`, jsonOptions('POST', payload)),

  aiStatus: () => request('/ai/status'),
  indexKnowledge: (productId, strategy = 'balanced') =>
    request(`/ai/products/${productId}/index?strategy=${strategy}`, { method: 'POST' }),
  askCopilot: (productId, payload) =>
    request(`/ai/products/${productId}/ask`, jsonOptions('POST', payload)),

  presignFileUpload: (payload) => request('/files/presign-upload', jsonOptions('POST', payload)),
  completeFileUpload: (payload) => request('/files/complete', jsonOptions('POST', payload)),
  documents: (productId = null) => request(`/files${productId ? `?product_id=${productId}` : ''}`),
  documentDownload: (documentId) => request(`/files/${documentId}/download`),
  deleteDocument: (documentId) => request(`/files/${documentId}`, { method: 'DELETE' }),
}
