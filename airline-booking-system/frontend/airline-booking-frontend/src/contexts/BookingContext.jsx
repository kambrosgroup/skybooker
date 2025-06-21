import { createContext, useContext, useState, useEffect } from 'react'
import { bookingService } from '../services/bookingService'
import { flightService } from '../services/flightService'
import { useToast } from '@/hooks/use-toast'

const BookingContext = createContext({})

export const useBooking = () => {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
}

export const BookingProvider = ({ children }) => {
  // Flight Search State
  const [searchCriteria, setSearchCriteria] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: {
      adults: 1,
      children: 0,
      infants: 0
    },
    cabin: 'ECONOMY',
    currency: 'USD',
    directFlightsOnly: false
  })
  
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState(null)
  
  // Booking State
  const [currentBooking, setCurrentBooking] = useState(null)
  const [bookingStep, setBookingStep] = useState(1) // 1: Flight Selection, 2: Passenger Details, 3: Payment, 4: Confirmation
  const [passengerDetails, setPassengerDetails] = useState([])
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  })
  
  // User Bookings State
  const [userBookings, setUserBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  
  const { toast } = useToast()

  // Search flights
  const searchFlights = async (criteria) => {
    try {
      setSearchLoading(true)
      setSearchCriteria(criteria)
      
      const response = await flightService.searchFlights(criteria)
      
      if (response.success) {
        setSearchResults(response.data.flightOffers || [])
        toast({
          title: "Search Complete",
          description: `Found ${response.data.flightOffers?.length || 0} flights`,
        })
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message || 'Flight search failed')
      }
    } catch (error) {
      console.error('Flight search error:', error)
      toast({
        title: "Search Failed",
        description: error.message || 'Failed to search flights',
        variant: "destructive",
      })
      setSearchResults([])
      return { success: false, error: error.message }
    } finally {
      setSearchLoading(false)
    }
  }

  // Select flight for booking
  const selectFlight = (flight) => {
    setSelectedFlight(flight)
    setBookingStep(2)
    
    // Initialize passenger details based on search criteria
    const totalPassengers = searchCriteria.passengers.adults + 
                           searchCriteria.passengers.children + 
                           searchCriteria.passengers.infants
    
    const passengers = []
    
    // Add adults
    for (let i = 0; i < searchCriteria.passengers.adults; i++) {
      passengers.push({
        type: 'adult',
        title: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        nationality: '',
        passportNumber: '',
        passportExpiry: '',
        passportCountry: '',
        email: '',
        phone: '',
        specialRequests: [],
        seatPreference: 'any',
        mealPreference: 'regular'
      })
    }
    
    // Add children
    for (let i = 0; i < searchCriteria.passengers.children; i++) {
      passengers.push({
        type: 'child',
        title: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        nationality: '',
        passportNumber: '',
        passportExpiry: '',
        passportCountry: '',
        email: '',
        phone: '',
        specialRequests: [],
        seatPreference: 'any',
        mealPreference: 'regular'
      })
    }
    
    // Add infants
    for (let i = 0; i < searchCriteria.passengers.infants; i++) {
      passengers.push({
        type: 'infant',
        title: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        nationality: '',
        passportNumber: '',
        passportExpiry: '',
        passportCountry: '',
        email: '',
        phone: '',
        specialRequests: [],
        seatPreference: 'any',
        mealPreference: 'regular'
      })
    }
    
    setPassengerDetails(passengers)
  }

  // Update passenger details
  const updatePassengerDetails = (index, details) => {
    const updatedPassengers = [...passengerDetails]
    updatedPassengers[index] = { ...updatedPassengers[index], ...details }
    setPassengerDetails(updatedPassengers)
  }

  // Update contact information
  const updateContactInfo = (info) => {
    setContactInfo({ ...contactInfo, ...info })
  }

  // Create booking
  const createBooking = async (paymentInfo) => {
    try {
      if (!selectedFlight) {
        throw new Error('No flight selected')
      }

      const bookingData = {
        flightOffers: [selectedFlight],
        passengers: passengerDetails,
        contactInfo,
        paymentInfo,
        specialRequests: [],
        remarks: '',
        travelInsurance: false,
        marketingConsent: false
      }

      const response = await bookingService.createBooking(bookingData)
      
      if (response.success) {
        setCurrentBooking(response.data.booking)
        setBookingStep(4)
        
        toast({
          title: "Booking Confirmed",
          description: `Your booking ${response.data.booking.pnr} has been confirmed!`,
        })
        
        // Refresh user bookings
        await fetchUserBookings()
        
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message || 'Booking creation failed')
      }
    } catch (error) {
      console.error('Booking creation error:', error)
      toast({
        title: "Booking Failed",
        description: error.message || 'Failed to create booking',
        variant: "destructive",
      })
      return { success: false, error: error.message }
    }
  }

  // Fetch user bookings
  const fetchUserBookings = async (options = {}) => {
    try {
      setBookingsLoading(true)
      const response = await bookingService.getUserBookings(options)
      
      if (response.success) {
        setUserBookings(response.data.bookings || [])
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message || 'Failed to fetch bookings')
      }
    } catch (error) {
      console.error('Fetch bookings error:', error)
      toast({
        title: "Load Failed",
        description: error.message || 'Failed to load bookings',
        variant: "destructive",
      })
      return { success: false, error: error.message }
    } finally {
      setBookingsLoading(false)
    }
  }

  // Cancel booking
  const cancelBooking = async (bookingId, reason) => {
    try {
      const response = await bookingService.cancelBooking(bookingId, reason)
      
      if (response.success) {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been successfully cancelled.",
        })
        
        // Refresh user bookings
        await fetchUserBookings()
        
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message || 'Booking cancellation failed')
      }
    } catch (error) {
      console.error('Booking cancellation error:', error)
      toast({
        title: "Cancellation Failed",
        description: error.message || 'Failed to cancel booking',
        variant: "destructive",
      })
      return { success: false, error: error.message }
    }
  }

  // Get booking by PNR
  const getBookingByPNR = async (pnr, lastName, email) => {
    try {
      const response = await bookingService.getBookingByPNR(pnr, lastName, email)
      
      if (response.success) {
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message || 'Booking not found')
      }
    } catch (error) {
      console.error('PNR lookup error:', error)
      toast({
        title: "Lookup Failed",
        description: error.message || 'Booking not found',
        variant: "destructive",
      })
      return { success: false, error: error.message }
    }
  }

  // Reset booking flow
  const resetBookingFlow = () => {
    setSelectedFlight(null)
    setCurrentBooking(null)
    setBookingStep(1)
    setPassengerDetails([])
    setContactInfo({
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }
    })
  }

  // Navigate booking steps
  const goToStep = (step) => {
    setBookingStep(step)
  }

  const nextStep = () => {
    setBookingStep(prev => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setBookingStep(prev => Math.max(prev - 1, 1))
  }

  const value = {
    // Search State
    searchCriteria,
    searchResults,
    searchLoading,
    selectedFlight,
    
    // Booking State
    currentBooking,
    bookingStep,
    passengerDetails,
    contactInfo,
    
    // User Bookings
    userBookings,
    bookingsLoading,
    
    // Actions
    searchFlights,
    selectFlight,
    updatePassengerDetails,
    updateContactInfo,
    createBooking,
    fetchUserBookings,
    cancelBooking,
    getBookingByPNR,
    resetBookingFlow,
    goToStep,
    nextStep,
    prevStep
  }

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  )
}

