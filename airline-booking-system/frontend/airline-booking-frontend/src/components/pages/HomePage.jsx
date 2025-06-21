import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { 
  Plane, 
  Search, 
  Calendar as CalendarIcon, 
  Users, 
  MapPin, 
  Star,
  Shield,
  Clock,
  Globe,
  ArrowRight,
  TrendingUp,
  Award,
  Heart
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useBooking } from '../../contexts/BookingContext'
import { flightService } from '../../services/flightService'

const HomePage = () => {
  const navigate = useNavigate()
  const { searchFlights } = useBooking()
  
  // Search form state
  const [searchForm, setSearchForm] = useState({
    origin: '',
    destination: '',
    departureDate: null,
    returnDate: null,
    passengers: {
      adults: 1,
      children: 0,
      infants: 0
    },
    cabin: 'ECONOMY',
    tripType: 'round-trip'
  })
  
  const [popularDestinations, setPopularDestinations] = useState([])
  const [loading, setLoading] = useState(false)

  // Load popular destinations on component mount
  useEffect(() => {
    loadPopularDestinations()
  }, [])

  const loadPopularDestinations = async () => {
    try {
      const response = await flightService.getPopularDestinations(null, 6)
      if (response.success) {
        setPopularDestinations(response.data.destinations || [])
      }
    } catch (error) {
      console.error('Failed to load popular destinations:', error)
    }
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    
    if (!searchForm.origin || !searchForm.destination || !searchForm.departureDate) {
      return
    }

    setLoading(true)
    
    const searchCriteria = {
      origin: searchForm.origin,
      destination: searchForm.destination,
      departureDate: format(searchForm.departureDate, 'yyyy-MM-dd'),
      returnDate: searchForm.tripType === 'round-trip' && searchForm.returnDate 
        ? format(searchForm.returnDate, 'yyyy-MM-dd') 
        : null,
      passengers: searchForm.passengers,
      cabin: searchForm.cabin,
      currency: 'USD'
    }

    const result = await searchFlights(searchCriteria)
    setLoading(false)
    
    if (result.success) {
      navigate('/search')
    }
  }

  const updatePassengerCount = (type, increment) => {
    setSearchForm(prev => ({
      ...prev,
      passengers: {
        ...prev.passengers,
        [type]: Math.max(0, prev.passengers[type] + increment)
      }
    }))
  }

  const getTotalPassengers = () => {
    return searchForm.passengers.adults + searchForm.passengers.children + searchForm.passengers.infants
  }

  const features = [
    {
      icon: Shield,
      title: 'Secure Booking',
      description: 'Your data is protected with enterprise-grade security and encryption.'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock customer support to assist you with any travel needs.'
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Access to 400+ airlines and thousands of destinations worldwide.'
    },
    {
      icon: Award,
      title: 'Best Prices',
      description: 'Competitive pricing with real-time fare comparison and deals.'
    }
  ]

  const stats = [
    { label: 'Happy Customers', value: '2M+', icon: Heart },
    { label: 'Destinations', value: '1000+', icon: MapPin },
    { label: 'Airlines', value: '400+', icon: Plane },
    { label: 'Bookings', value: '5M+', icon: TrendingUp }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your Journey Begins Here
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Discover the world with our comprehensive airline booking platform. 
              Find the best flights, compare prices, and book with confidence.
            </p>
            
            {/* Search Form */}
            <Card className="bg-white/95 backdrop-blur text-foreground">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Search Flights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearchSubmit} className="space-y-6">
                  {/* Trip Type */}
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="tripType"
                        value="round-trip"
                        checked={searchForm.tripType === 'round-trip'}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, tripType: e.target.value }))}
                        className="text-primary"
                      />
                      <span>Round Trip</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="tripType"
                        value="one-way"
                        checked={searchForm.tripType === 'one-way'}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, tripType: e.target.value }))}
                        className="text-primary"
                      />
                      <span>One Way</span>
                    </label>
                  </div>

                  {/* Origin and Destination */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="origin">From</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="origin"
                          placeholder="Origin city or airport"
                          value={searchForm.origin}
                          onChange={(e) => setSearchForm(prev => ({ ...prev, origin: e.target.value.toUpperCase() }))}
                          className="pl-10"
                          maxLength={3}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination">To</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="destination"
                          placeholder="Destination city or airport"
                          value={searchForm.destination}
                          onChange={(e) => setSearchForm(prev => ({ ...prev, destination: e.target.value.toUpperCase() }))}
                          className="pl-10"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Departure Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !searchForm.departureDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {searchForm.departureDate ? format(searchForm.departureDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={searchForm.departureDate}
                            onSelect={(date) => setSearchForm(prev => ({ ...prev, departureDate: date }))}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {searchForm.tripType === 'round-trip' && (
                      <div className="space-y-2">
                        <Label>Return Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !searchForm.returnDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {searchForm.returnDate ? format(searchForm.returnDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={searchForm.returnDate}
                              onSelect={(date) => setSearchForm(prev => ({ ...prev, returnDate: date }))}
                              disabled={(date) => date < searchForm.departureDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  {/* Passengers and Cabin */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Passengers</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Users className="mr-2 h-4 w-4" />
                            {getTotalPassengers()} Passenger{getTotalPassengers() !== 1 ? 's' : ''}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Adults</div>
                                <div className="text-sm text-muted-foreground">12+ years</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updatePassengerCount('adults', -1)}
                                  disabled={searchForm.passengers.adults <= 1}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">{searchForm.passengers.adults}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updatePassengerCount('adults', 1)}
                                  disabled={searchForm.passengers.adults >= 9}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Children</div>
                                <div className="text-sm text-muted-foreground">2-11 years</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updatePassengerCount('children', -1)}
                                  disabled={searchForm.passengers.children <= 0}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">{searchForm.passengers.children}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updatePassengerCount('children', 1)}
                                  disabled={searchForm.passengers.children >= 8}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Infants</div>
                                <div className="text-sm text-muted-foreground">Under 2 years</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updatePassengerCount('infants', -1)}
                                  disabled={searchForm.passengers.infants <= 0}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">{searchForm.passengers.infants}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updatePassengerCount('infants', 1)}
                                  disabled={searchForm.passengers.infants >= 8}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Cabin Class</Label>
                      <Select value={searchForm.cabin} onValueChange={(value) => setSearchForm(prev => ({ ...prev, cabin: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ECONOMY">Economy</SelectItem>
                          <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                          <SelectItem value="BUSINESS">Business</SelectItem>
                          <SelectItem value="FIRST">First Class</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Search Button */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={loading || !searchForm.origin || !searchForm.destination || !searchForm.departureDate}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search Flights
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose SkyBooker?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the difference with our premium airline booking platform designed for modern travelers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      {popularDestinations.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Destinations</h2>
              <p className="text-xl text-muted-foreground">
                Discover trending destinations and find your next adventure.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularDestinations.map((destination, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 relative">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold">{destination.city}</h3>
                      <p className="text-blue-100">{destination.country}</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Starting from</p>
                        <p className="text-2xl font-bold text-primary">${destination.price}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Join millions of travelers who trust SkyBooker for their flight booking needs. 
            Sign up today and get exclusive access to deals and offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/register')}
            >
              Sign Up Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              onClick={() => navigate('/search')}
            >
              Explore Flights
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage

