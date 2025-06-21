import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const PNRLookupPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>PNR Lookup</CardTitle>
          <CardDescription>
            Search for your booking using PNR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            PNR lookup page - to be implemented
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default PNRLookupPage

