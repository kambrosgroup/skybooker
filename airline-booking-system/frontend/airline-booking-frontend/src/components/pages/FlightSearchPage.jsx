import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const FlightSearchPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Flight Search Results</CardTitle>
          <CardDescription>
            Search results and flight selection interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Flight search results page - to be implemented
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default FlightSearchPage

