import apiClient from './authService'

// Flight Service
export const flightService = {
  // Search flights
  async searchFlights(searchCriteria) {
    try {
      const response = await apiClient.post('/flights/search', searchCriteria)
      return response
    } catch (error) {
      throw new Error(error.message || 'Flight search failed')
    }
  },

  // Get flight pricing
  async getFlightPricing(flightOffers) {
    try {
      const response = await apiClient.post('/flights/pricing', {
        flightOffers
      })
      return response
    } catch (error) {
      throw new Error(error.message || 'Flight pricing failed')
    }
  },

  // Get flight details
  async getFlightDetails(flightId) {
    try {
      const response = await apiClient.get(`/flights/${flightId}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to get flight details')
    }
  },

  // Search locations (airports/cities)
  async searchLocations(query, type = null) {
    try {
      const params = new URLSearchParams({ query })
      if (type) params.append('type', type)
      
      const response = await apiClient.get(`/flights/locations?${params}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Location search failed')
    }
  },

  // Get airline information
  async getAirlineInfo(airlineCodes) {
    try {
      const codes = Array.isArray(airlineCodes) ? airlineCodes.join(',') : airlineCodes
      const response = await apiClient.get(`/flights/airlines?airlineCodes=${codes}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to get airline info')
    }
  },

  // Get popular destinations
  async getPopularDestinations(origin = null, limit = 10) {
    try {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (origin) params.append('origin', origin)
      
      const response = await apiClient.get(`/flights/popular?${params}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to get popular destinations')
    }
  },

  // Get flight statistics
  async getFlightStats(origin = null, destination = null, period = '30d') {
    try {
      const params = new URLSearchParams({ period })
      if (origin) params.append('origin', origin)
      if (destination) params.append('destination', destination)
      
      const response = await apiClient.get(`/flights/stats?${params}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to get flight statistics')
    }
  },

  // Get flight inspiration (cheapest destinations)
  async getFlightInspiration(origin, maxPrice = null, departureDate = null, oneWay = true) {
    try {
      const params = new URLSearchParams({ 
        origin,
        oneWay: oneWay.toString()
      })
      if (maxPrice) params.append('maxPrice', maxPrice.toString())
      if (departureDate) params.append('departureDate', departureDate)
      
      const response = await apiClient.get(`/flights/inspiration?${params}`)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to get flight inspiration')
    }
  },

  // Health check for flight services
  async healthCheck() {
    try {
      const response = await apiClient.get('/flights/health')
      return response
    } catch (error) {
      throw new Error(error.message || 'Flight service health check failed')
    }
  }
}

export default flightService

