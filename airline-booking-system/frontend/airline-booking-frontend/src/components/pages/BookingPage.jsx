import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const BookingPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Booking Process</CardTitle>
          <CardDescription>
            Complete your flight booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Booking flow page - to be implemented
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default BookingPage

