import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const RegisterPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>
            Create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Registration page - to be implemented
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterPage

