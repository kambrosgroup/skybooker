import apiClient from './authService'

// Booking Service
export const bookingService = {
  // Create new booking
  async createBooking(bookingData) {
    try {
      const response = await apiClient.post('/bookings', bookingData)
      return response
    } catch (error) {
      throw new Error(error.message || 'Booking creation failed')
    }
  },

  // Get booking by ID
  async getBookingById(bookingId) {
    try {
      const response = await apiClient.get(`/bookings/${bookingId}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to get booking')
    }
  },

  // Search bookings
  async searchBookings(criteria) {
    try {
      const params = new URLSearchParams()
      Object.keys(criteria).forEach(key => {
        if (criteria[key] !== null && criteria[key] !== undefined && criteria[key] !== '') {
          params.append(key, criteria[key])
        }
      })
      
      const response = await apiClient.get(`/bookings/search?${params}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Booking search failed')
    }
  },

  // Update booking
  async updateBooking(bookingId, updateData) {
    try {
      const response = await apiClient.put(`/bookings/${bookingId}`, updateData)
      return response
    } catch (error) {
      throw new Error(error.message || 'Booking update failed')
    }
  },

  // Cancel booking
  async cancelBooking(bookingId, reason) {
    try {
      const response = await apiClient.post(`/bookings/${bookingId}/cancel`, { reason })
      return response
    } catch (error) {
      throw new Error(error.message || 'Booking cancellation failed')
    }
  },

  // Get user bookings
  async getUserBookings(options = {}) {
    try {
      const params = new URLSearchParams()
      Object.keys(options).forEach(key => {
        if (options[key] !== null && options[key] !== undefined && options[key] !== '') {
          params.append(key, options[key])
        }
      })
      
      const response = await apiClient.get(`/bookings/user/me?${params}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to get user bookings')
    }
  },

  // Get booking statistics (admin only)
  async getBookingStats(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await apiClient.get(`/bookings/stats?${params}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to get booking statistics')
    }
  },

  // Get booking by PNR (public lookup)
  async getBookingByPNR(pnr, lastName = null, email = null) {
    try {
      const params = new URLSearchParams()
      if (lastName) params.append('lastName', lastName)
      if (email) params.append('email', email)
      
      const response = await apiClient.get(`/bookings/pnr/${pnr}?${params}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Booking not found')
    }
  },

  // Validate booking data
  async validateBookingData(bookingData) {
    try {
      const response = await apiClient.post('/bookings/validate', bookingData)
      return response
    } catch (error) {
      throw new Error(error.message || 'Booking validation failed')
    }
  },

  // Get booking timeline
  async getBookingTimeline(bookingId) {
    try {
      const response = await apiClient.get(`/bookings/${bookingId}/timeline`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to get booking timeline')
    }
  },

  // Sync booking with Amadeus (admin only)
  async syncBookingWithAmadeus(bookingId) {
    try {
      const response = await apiClient.post(`/bookings/${bookingId}/sync`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Booking sync failed')
    }
  }
}

export default bookingService

