const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.status === 204) return null
  return res.json()
}

export const getSubscriptions   = ()         => request('/subscriptions')
export const addSubscription    = (data)     => request('/subscriptions',            { method: 'POST',   body: JSON.stringify(data) })
export const updateSubscription = (id, data) => request(`/subscriptions/${id}`,      { method: 'PUT',    body: JSON.stringify(data) })
export const deleteSubscription = (id)       => request(`/subscriptions/${id}`,      { method: 'DELETE' })
export const toggleMute         = (id)       => request(`/subscriptions/${id}/mute`, { method: 'PATCH'  })

export const getDashboard = ()     => request('/dashboard')
export const getConfig    = ()     => request('/config')
export const updateConfig = (data) => request('/config', { method: 'PUT', body: JSON.stringify(data) })
