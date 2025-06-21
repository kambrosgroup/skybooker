import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { useToast } from '@/hooks/use-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (token) {
        const userData = await authService.getProfile()
        setUser(userData)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('authToken')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      const response = await authService.login(email, password)
      
      if (response.success) {
        localStorage.setItem('authToken', response.data.accessToken)
        setUser(response.data.user)
        setIsAuthenticated(true)
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${response.data.user.firstName}!`,
        })
        
        return { success: true }
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "Login Failed",
        description: error.message || 'Invalid email or password',
        variant: "destructive",
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await authService.register(userData)
      
      if (response.success) {
        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account.",
        })
        return { success: true }
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "Registration Failed",
        description: error.message || 'Failed to create account',
        variant: "destructive",
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('authToken')
      setUser(null)
      setIsAuthenticated(false)
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      })
    }
  }

  const updateProfile = async (profileData) => {
    try {
      setLoading(true)
      const response = await authService.updateProfile(profileData)
      
      if (response.success) {
        setUser(response.data.user)
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        })
        return { success: true }
      } else {
        throw new Error(response.message || 'Profile update failed')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to update profile',
        variant: "destructive",
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true)
      const response = await authService.changePassword(currentPassword, newPassword)
      
      if (response.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been successfully changed.",
        })
        return { success: true }
      } else {
        throw new Error(response.message || 'Password change failed')
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast({
        title: "Password Change Failed",
        description: error.message || 'Failed to change password',
        variant: "destructive",
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async (email) => {
    try {
      setLoading(true)
      const response = await authService.forgotPassword(email)
      
      if (response.success) {
        toast({
          title: "Reset Email Sent",
          description: "Please check your email for password reset instructions.",
        })
        return { success: true }
      } else {
        throw new Error(response.message || 'Password reset failed')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast({
        title: "Reset Failed",
        description: error.message || 'Failed to send reset email',
        variant: "destructive",
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true)
      const response = await authService.resetPassword(token, newPassword)
      
      if (response.success) {
        toast({
          title: "Password Reset",
          description: "Your password has been successfully reset.",
        })
        return { success: true }
      } else {
        throw new Error(response.message || 'Password reset failed')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      toast({
        title: "Reset Failed",
        description: error.message || 'Failed to reset password',
        variant: "destructive",
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (token) => {
    try {
      setLoading(true)
      const response = await authService.verifyEmail(token)
      
      if (response.success) {
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified.",
        })
        return { success: true }
      } else {
        throw new Error(response.message || 'Email verification failed')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      toast({
        title: "Verification Failed",
        description: error.message || 'Failed to verify email',
        variant: "destructive",
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

