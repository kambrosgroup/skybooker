import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const MyBookingsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>
            View and manage your flight bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            User bookings page - to be implemented
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default MyBookingsPage

