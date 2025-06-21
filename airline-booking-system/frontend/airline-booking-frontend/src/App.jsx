import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import './App.css'

// Layout Components
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Page Components
import HomePage from './components/pages/HomePage'
import FlightSearchPage from './components/pages/FlightSearchPage'
import BookingPage from './components/pages/BookingPage'
import MyBookingsPage from './components/pages/MyBookingsPage'
import LoginPage from './components/pages/LoginPage'
import RegisterPage from './components/pages/RegisterPage'
import ProfilePage from './components/pages/ProfilePage'
import PNRLookupPage from './components/pages/PNRLookupPage'
import AdminDashboard from './components/pages/AdminDashboard'

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { BookingProvider } from './contexts/BookingContext'

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  
  return children
}

// Main App Layout
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <Router>
          <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<FlightSearchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/pnr-lookup" element={<PNRLookupPage />} />
              
              {/* Protected Routes */}
              <Route 
                path="/booking" 
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-bookings" 
                element={
                  <ProtectedRoute>
                    <MyBookingsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </BookingProvider>
    </AuthProvider>
  )
}

export default App

