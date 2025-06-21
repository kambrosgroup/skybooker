// API base URL - should be configured via environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// API client with authentication
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, config)
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options })
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    })
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    })
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options })
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL)

// Authentication Service
export const authService = {
  // Login user
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Login failed')
    }
  },

  // Register new user
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData)
      return response
    } catch (error) {
      throw new Error(error.message || 'Registration failed')
    }
  },

  // Logout user
  async logout() {
    try {
      const response = await apiClient.post('/auth/logout')
      return response
    } catch (error) {
      // Don't throw error for logout - just log it
      console.error('Logout error:', error)
      return { success: true }
    }
  },

  // Get user profile
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile')
      return response.data.user
    } catch (error) {
      throw new Error(error.message || 'Failed to get profile')
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/auth/profile', profileData)
      return response
    } catch (error) {
      throw new Error(error.message || 'Profile update failed')
    }
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put('/auth/change-password', {
        currentPassword,
        newPassword
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Password change failed')
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email })
      return response
    } catch (error) {
      throw new Error(error.message || 'Password reset request failed')
    }
  },

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        newPassword
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Password reset failed')
    }
  },

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await apiClient.post('/auth/verify-email', { token })
      return response
    } catch (error) {
      throw new Error(error.message || 'Email verification failed')
    }
  },

  // Refresh token
  async refreshToken() {
    try {
      const response = await apiClient.post('/auth/refresh')
      return response
    } catch (error) {
      throw new Error(error.message || 'Token refresh failed')
    }
  }
}

export default apiClient

