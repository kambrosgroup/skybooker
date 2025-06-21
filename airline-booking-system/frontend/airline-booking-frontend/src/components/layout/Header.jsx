import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { 
  Plane, 
  Menu, 
  User, 
  LogOut, 
  Settings, 
  BookOpen, 
  Search,
  Shield,
  Home
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navigationItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search Flights', href: '/search', icon: Search },
    { name: 'PNR Lookup', href: '/pnr-lookup', icon: BookOpen },
  ]

  const authenticatedItems = [
    { name: 'My Bookings', href: '/my-bookings', icon: BookOpen },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const adminItems = [
    { name: 'Admin Dashboard', href: '/admin', icon: Shield },
  ]

  const isActivePath = (path) => {
    return location.pathname === path
  }

  const getUserInitials = (user) => {
    if (!user) return 'U'
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">SkyBooker</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                  isActivePath(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            {isAuthenticated && authenticatedItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                  isActivePath(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            {isAuthenticated && user?.role === 'admin' && adminItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname.startsWith(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.firstName} />
                      <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-bookings')}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>My Bookings</span>
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Log in
                </Button>
                <Button onClick={() => navigate('/register')}>
                  Sign up
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="md:hidden"
                  size="icon"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary">
                      <Plane className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span>SkyBooker</span>
                  </SheetTitle>
                  <SheetDescription>
                    Navigate through the airline booking system
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  {/* Navigation Items */}
                  <div className="space-y-2">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                          isActivePath(item.href)
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Authenticated Items */}
                  {isAuthenticated && (
                    <>
                      <div className="border-t pt-4">
                        <div className="space-y-2">
                          {authenticatedItems.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                                isActivePath(item.href)
                                  ? 'bg-accent text-accent-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Admin Items */}
                      {user?.role === 'admin' && (
                        <div className="border-t pt-4">
                          <div className="space-y-2">
                            {adminItems.map((item) => (
                              <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                                  location.pathname.startsWith(item.href)
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* User Info and Logout */}
                      <div className="border-t pt-4">
                        <div className="flex items-center space-x-3 px-3 py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.avatar} alt={user?.firstName} />
                            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start mt-2"
                          onClick={() => {
                            handleLogout()
                            setMobileMenuOpen(false)
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Auth Buttons for Non-authenticated Users */}
                  {!isAuthenticated && (
                    <div className="border-t pt-4 space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          navigate('/login')
                          setMobileMenuOpen(false)
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Log in
                      </Button>
                      <Button
                        className="w-full justify-start"
                        onClick={() => {
                          navigate('/register')
                          setMobileMenuOpen(false)
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Sign up
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

