import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const ProfilePage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Profile page - to be implemented
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage

