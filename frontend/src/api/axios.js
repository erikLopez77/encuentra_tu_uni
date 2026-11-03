import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// Axios también se importa directamente en algunas pantallas: configura sus
// valores globales para que todas envíen cookies y el encabezado CSRF.
axios.defaults.withCredentials = true
axios.defaults.withXSRFToken = true
axios.defaults.xsrfCookieName = 'csrftoken_auth'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

const api = axios.create({
  baseURL: API.replace(/\/api\/v1\/?$/, ''),
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'csrftoken_auth',
  xsrfHeaderName: 'X-CSRFToken',
  headers: { 'Content-Type': 'application/json' },
})

// Migra una vez desde el estado anterior; usuarioId por sí solo no prueba
// que exista una sesión JWT válida.
const AUTH_STORAGE_VERSION = 'cookie-auth-v2'
if (localStorage.getItem('auth_storage_version') !== AUTH_STORAGE_VERSION) {
  localStorage.removeItem('usuarioId')
  localStorage.setItem('auth_storage_version', AUTH_STORAGE_VERSION)
}
localStorage.removeItem('access_token')
localStorage.removeItem('refresh_token')

let refreshPromise = null
let csrfToken = ''
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const ensureCsrfCookie = async () => {
  const response = await api.get('/api/v1/auth/csrf/')
  csrfToken = response.data?.csrfToken || csrfToken
  if (!csrfToken) throw new Error('El servidor no entregó el token CSRF.')
  return response
}
export const getCsrfToken = () => csrfToken

const isUnsafe = (method) => !['get', 'head', 'options'].includes((method || 'get').toLowerCase())
const isGatewayRequest = (config) => {
  try {
    return new URL(config.url || '', config.baseURL || API).origin === new URL(API).origin
  } catch {
    return false
  }
}
const prepareCsrf = async (config, getCookie) => {
  if (!isGatewayRequest(config)) return config
  if (isUnsafe(config.method) && !getCsrfToken() && !config.url?.includes('/auth/csrf/')) {
    await getCookie()
  }
  if (isUnsafe(config.method) && getCsrfToken()) {
    config.headers = config.headers || {}
    config.headers['X-CSRFToken'] = getCsrfToken()
  }
  return config
}

api.interceptors.request.use((config) => prepareCsrf(config, ensureCsrfCookie))
axios.interceptors.request.use((config) => prepareCsrf(config, ensureCsrfCookie))

export const clearSessionHint = () => {
  // JWT HttpOnly solo puede ser borrado por el servidor en /logout/.
  const hadSessionHint = Boolean(localStorage.getItem('usuarioId'))
  localStorage.removeItem('usuarioId')
  if (hadSessionHint) window.dispatchEvent(new Event('auth-change'))
}

const withCrossTabRefreshLock = async (renew) => {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('encuentra-tu-uni-jwt-refresh', renew)
  }

  // Alternativa para navegadores sin Web Locks. La renovación siempre lee las
  // cookies actuales después de obtener el lock, no guarda JWT en localStorage.
  const key = 'jwt_refresh_lock'
  const owner = `${Date.now()}-${Math.random()}`
  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    let current
    try { current = JSON.parse(localStorage.getItem(key) || 'null') } catch { current = null }
    if (!current || current.expiresAt < Date.now()) {
      localStorage.setItem(key, JSON.stringify({ owner, expiresAt: Date.now() + 45000 }))
      let claimed
      try { claimed = JSON.parse(localStorage.getItem(key) || 'null') } catch { claimed = null }
      if (claimed?.owner === owner) {
        try { return await renew() } finally {
          try {
            const lock = JSON.parse(localStorage.getItem(key) || 'null')
            if (lock?.owner === owner) localStorage.removeItem(key)
          } catch { /* No mantener un lock huérfano por un fallo local */ }
        }
      }
    }
    await sleep(80 + Math.floor(Math.random() * 80))
  }
  throw new Error('No fue posible coordinar la renovación de sesión entre pestañas.')
}

export const withSessionLock = (operation) => withCrossTabRefreshLock(operation)

const handleAuthError = async (error, client) => {
  const request = error.config
  const url = request?.url || ''
  const isAuthOperation = url.endsWith('/auth/token/') || url.includes('/auth/token/refresh/') || url.includes('/auth/logout/')
  if (error.response?.status !== 401 || !request || !isGatewayRequest(request) || request._retry || isAuthOperation || !localStorage.getItem('usuarioId')) {
    return Promise.reject(error)
  }

  request._retry = true
  if (!refreshPromise) {
    refreshPromise = withCrossTabRefreshLock(async () => {
      const { data } = await axios.post(`${API}/auth/token/refresh/`, {}, {
        withCredentials: true,
        withXSRFToken: true,
      })
      return data
    })
      .then(() => true)
      .catch((refreshError) => {
        // Un 503 o una caída de red es temporal: conservar cookies y dejar que
        // el usuario reintente. Un 401 significa refresh inválido/expirado.
        if (refreshError.response?.status === 401) {
          const hadSessionHint = Boolean(localStorage.getItem('usuarioId'))
          clearSessionHint()
          if (hadSessionHint && window.location.pathname !== '/login') window.location.assign('/login')
        }
        throw refreshError
      })
      .finally(() => { refreshPromise = null })
  }

  try {
    await refreshPromise
    return client(request) // El navegador agrega el nuevo access cookie automáticamente.
  } catch (refreshError) {
    return Promise.reject(refreshError)
  }
}

api.interceptors.response.use((response) => response, (error) => handleAuthError(error, api))
axios.interceptors.response.use((response) => response, (error) => handleAuthError(error, axios))

export { api }
export default api
