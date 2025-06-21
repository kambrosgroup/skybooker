# Enterprise Airline Booking System

A comprehensive, production-ready airline booking platform with real-time flight search, booking management, and administrative capabilities powered by Amadeus APIs.

## 🚀 Features

### Customer Features
- **Flight Search**: Real-time flight search with advanced filtering options
- **Booking Management**: Complete booking lifecycle from search to confirmation
- **User Authentication**: Secure registration and login system
- **Payment Processing**: Integrated Stripe payment gateway
- **Email Notifications**: Automated booking confirmations and updates
- **Mobile Responsive**: Optimized for all device types

### Administrative Features
- **Admin Dashboard**: Comprehensive booking and user management
- **PNR Management**: Full booking lifecycle control
- **Analytics & Reporting**: Business intelligence and performance metrics
- **User Management**: Customer support and account management tools

### Technical Features
- **Real-time Updates**: WebSocket integration for live flight status
- **API Integration**: Amadeus Flight Offers Search and Booking APIs
- **Security**: JWT authentication, rate limiting, and data encryption
- **Scalability**: Microservices architecture with horizontal scaling support
- **Performance**: Optimized caching and database indexing

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   External APIs │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│   (Amadeus)     │
│   Port: 3000    │    │   Port: 5000    │    │   (Stripe)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (MongoDB)     │
                       │   Port: 27017   │
                       └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with SSR/SSG capabilities
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: Modern component library
- **React Query**: Server state management
- **React Hook Form**: Form handling and validation

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **TypeScript**: Type-safe server development
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication and authorization
- **Stripe**: Payment processing
- **Nodemailer**: Email service integration

### External APIs
- **Amadeus**: Flight search and booking APIs
- **Stripe**: Payment processing
- **SendGrid**: Email delivery service

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (v5.0 or higher)
- **Git** for version control

### API Keys Required

You'll need to obtain API keys from the following services:

1. **Amadeus for Developers**
   - Visit: https://developers.amadeus.com/
   - Create account and obtain API Key and Secret
   - Available in both sandbox and production environments

2. **Stripe**
   - Visit: https://stripe.com/
   - Create account and obtain Publishable and Secret keys
   - Test keys available for development

3. **SendGrid** (Optional for email)
   - Visit: https://sendgrid.com/
   - Create account and obtain API key

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd airline-booking-system
```

### 2. Environment Setup

Copy the environment template files and configure your API keys:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env.local
```

### 3. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend server will start on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend application will start on `http://localhost:3000`

### 5. Database Setup

Ensure MongoDB is running locally or configure your MongoDB Atlas connection string in the backend `.env` file.

## 📁 Project Structure

```
airline-booking-system/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Next.js pages and API routes
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   ├── tests/              # Test files
│   └── package.json
├── shared/                  # Shared types and utilities
├── docs/                   # Documentation
├── deployment/             # Deployment configurations
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/airline-booking

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Amadeus API
AMADEUS_API_KEY=your-amadeus-api-key
AMADEUS_API_SECRET=your-amadeus-api-secret
AMADEUS_ENVIRONMENT=test

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourairline.com
```

### Frontend Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Application
NEXT_PUBLIC_APP_NAME=Airline Booking System
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm run test          # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Frontend Tests

```bash
cd frontend
npm run test          # Run component tests
npm run test:e2e      # Run end-to-end tests
```

## 🚀 Deployment

### Docker Deployment

Build and run the application using Docker:

```bash
# Build images
docker-compose build

# Run application
docker-compose up -d
```

### Production Deployment

1. **Environment Setup**: Configure production environment variables
2. **Database**: Set up MongoDB Atlas or production MongoDB instance
3. **API Keys**: Configure production API keys for Amadeus and Stripe
4. **SSL**: Configure HTTPS certificates
5. **Monitoring**: Set up application monitoring and logging

Detailed deployment instructions are available in `/deployment/README.md`

## 📚 API Documentation

The API documentation is available at:
- Development: `http://localhost:5000/api/docs`
- Swagger/OpenAPI specification: `/docs/api-specification.yaml`

### Key API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/flights/search` - Flight search
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:pnr` - Get booking details
- `PUT /api/bookings/:pnr` - Update booking
- `GET /api/admin/bookings` - Admin booking management

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS**: Configured Cross-Origin Resource Sharing
- **Helmet**: Security headers for Express.js
- **bcrypt**: Password hashing and verification
- **HTTPS**: SSL/TLS encryption in production

## 📊 Performance Optimization

- **Caching**: Redis caching for frequently accessed data
- **Database Indexing**: Optimized database queries
- **Code Splitting**: Frontend code splitting for faster loading
- **Image Optimization**: Automatic image optimization
- **CDN**: Content Delivery Network for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation at `/api/docs`

## 🙏 Acknowledgments

- Amadeus for Developers for flight data APIs
- Stripe for payment processing
- The open-source community for the amazing tools and libraries

