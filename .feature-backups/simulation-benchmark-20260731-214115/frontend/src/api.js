const DEFAULT_PRODUCTION_API_URL = 'https://sourcewise-35-175-11-218.nip.io'
const DEFAULT_DEVELOPMENT_API_URL = 'http://localhost:8000'
const REQUEST_TIMEOUT_MS = 15_000

const BLOCKED_API_HOSTS = new Set([
  'source-wise-ai-procurement-platform-fawn.vercel.app',
])

function normalizeUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function isLocalOrPrivateHostname(hostname) {
  const value = hostname.toLowerCase()

  if (value === 'localhost' || value === '127.0.0.1' || value === '::1') {
    return true
  }

  return (
    /^10\./.test(value) ||
    /^192\.168\./.test(value) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(value)
  )
}

function isUsableConfiguredApiUrl(value) {
  if (!value) return false

  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()

    if (!['http:', 'https:'].includes(url.protocol)) return false
    if (BLOCKED_API_HOSTS.has(hostname)) return false
    if (hostname.endsWith('.onrender.com')) return false

    // A production browser cannot reach localhost/private addresses and an
    // HTTPS Vercel page must not call an HTTP API.
    if (import.meta.env.PROD) {
      if (url.protocol !== 'https:') return false
      if (isLocalOrPrivateHostname(hostname)) return false
    }

    return true
  } catch {
    return false
  }
}

function resolveApiUrl() {
  const configured = normalizeUrl(import.meta.env.VITE_API_URL)

  // Ignore stale Vercel values that point to the retired Render service,
  // the frontend itself, localhost, or another invalid production address.
  if (isUsableConfiguredApiUrl(configured)) return configured

  return import.meta.env.PROD
    ? DEFAULT_PRODUCTION_API_URL
    : DEFAULT_DEVELOPMENT_API_URL
}

export const API_URL = resolveApiUrl()

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

function formatPayloadError(payload, fallback) {
  if (typeof payload?.detail === 'string') return payload.detail
  if (payload?.detail) return JSON.stringify(payload.detail)
  if (typeof payload?.message === 'string') return payload.message
  return fallback
}

async function readResponse(response) {
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()

  if (!text) return null

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`The API returned invalid JSON from ${response.url}.`)
    }
  }

  const preview = text.slice(0, 100).replace(/\s+/g, ' ')
  throw new Error(
    `The API returned ${contentType || 'an unknown content type'} instead of JSON. ` +
      `Requested: ${response.url}. Response started with: ${preview}`,
  )
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`The SourceWise API did not respond within 15 seconds: ${API_URL}`)
    }

    if (error instanceof TypeError) {
      throw new Error(
        `Could not connect to the SourceWise API at ${API_URL}. ` +
          'Check that the EC2 backend is running, HTTPS is valid, and CORS allows the Vercel site.',
      )
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function refreshSession() {
  const refreshToken = authStorage.refreshToken()
  if (!refreshToken) throw new Error('Your session has expired. Please sign in again.')

  if (!refreshPromise) {
    refreshPromise = fetchWithTimeout(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (response) => {
        const payload = await readResponse(response)
        if (!response.ok) {
          throw new Error(formatPayloadError(payload, `${response.status} ${response.statusText}`))
        }
        authStorage.save(payload)
        return payload
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

  const response = await fetchWithTimeout(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && retryAuth && !path.startsWith('/auth/')) {
    await refreshSession()
    return request(path, options, false)
  }

  const payload = await readResponse(response)

  if (!response.ok) {
    throw new Error(formatPayloadError(payload, `${response.status} ${response.statusText}`))
  }

  return payload
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
  addComponent: (productId, payload) =>
    request(`/products/${productId}/components`, jsonOptions('POST', payload)),
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
  updateSupplier: (supplierId, payload) =>
    request(`/suppliers/${supplierId}`, jsonOptions('PATCH', payload)),
  offers: (componentId) => request(`/components/${componentId}/offers`),
  createOffer: (componentId, payload) =>
    request(`/components/${componentId}/offers`, jsonOptions('POST', payload)),
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
  documents: (productId = null) =>
    request(`/files${productId ? `?product_id=${productId}` : ''}`),
  documentDownload: (documentId) => request(`/files/${documentId}/download`),
  deleteDocument: (documentId) => request(`/files/${documentId}`, { method: 'DELETE' }),
}
