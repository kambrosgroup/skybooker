import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const AdminDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Administrative controls and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Admin dashboard - to be implemented
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard

