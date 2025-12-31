import { supabase } from './supabase'

// Base URL for API - change this if server port changes
const BASE_URL = 'http://localhost:5000/api'

// Get auth token for API calls
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

// Inventory API
export const fetchInventory = async () => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/inventory`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export const lookupItem = async (query) => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/inventory/lookup?q=${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export const submitScan = async (scanData) => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/inventory/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(scanData)
  })
  return response.json()
}

export const updateThreshold = async (itemId, threshold) => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/inventory/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ threshold })
  })
  return response.json()
}

// Attendance API
export const fetchAttendance = async () => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/attendance`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export const createAttendanceRecord = async (record) => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(record)
  })
  return response.json()
}

// Purchase Requests API
export const fetchPurchaseRequests = async () => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/purchase-requests`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export const createPurchaseRequest = async (request) => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/purchase-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(request)
  })
  return response.json()
}

export const reviewPurchaseRequest = async (requestId, action, note) => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/purchase-requests/${requestId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ action, note })
  })
  return response.json()
}

// Notifications API
export const fetchNotifications = async () => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/notifications`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export const markNotificationRead = async (notificationId) => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export const markAllNotificationsRead = async () => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

// Dashboard API
export const getDashboardStats = async () => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/dashboard/summary`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

// Roles & Employees API
export const fetchRoles = async () => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/roles`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export const fetchEmployees = async () => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/employees`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export const addEmployee = async (employee) => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(employee)
  })
  return response.json()
}

export const updateRolePermissions = async (roleId, permissions) => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/roles/${roleId}/permissions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ permissions })
  })
  return response.json()
}

// Profile API
export const updatePassword = async ({ currentPassword, newPassword }) => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  })
  return response.json()
}

// Legacy exports (keep for backward compatibility)
export const getProducts = fetchInventory
export const getTransactions = async () => {
  const data = await fetchInventory()
  return data.transactions || []
}
export const addProduct = submitScan
export const updateProduct = updateThreshold
export const deleteProduct = async () => { throw new Error('Not implemented') }
export const addTransaction = submitScan
export const updateInventory = submitScan
