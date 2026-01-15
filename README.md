# Dental Customer Management System (CMS)

A comprehensive full-stack application for managing dental practice operations, including patient records, appointments, treatments, and user management.

## Features

- **Patient Management**: Complete patient records with medical history, allergies, and contact information
- **Appointment Scheduling**: Manage appointments with different types (checkup, cleaning, treatment, etc.)
- **Treatment Records**: Track treatments, procedures, costs, and payment status
- **User Management**: Role-based access control (Admin, Dentist, Assistant, Receptionist)
- **Dashboard**: Overview of daily appointments, patient statistics, and pending treatments
- **Authentication**: Secure JWT-based authentication system

## Tech Stack

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **Express Validator** for input validation

### Frontend
- **React** with **TypeScript**
- **Vite** for fast development and building
- **React Router** for navigation
- **React Query** for data fetching
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Axios** for API requests

## Project Structure

```
dental-cms/
├── src/
│   └── server/              # Backend code
│       ├── config/          # Configuration files
│       ├── controllers/     # Route controllers
│       ├── middleware/      # Custom middleware
│       ├── models/          # Mongoose models
│       ├── routes/          # API routes
│       └── utils/           # Utility functions
├── client/                  # Frontend code
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand stores
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
└── package.json             # Root package.json
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher) - local or cloud instance
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dental-cms
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Set up environment variables:

Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/dental-cms
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### Running the Application

1. Start MongoDB (if running locally):
```bash
mongod
```

2. Run the development server:
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 3000).

Alternatively, you can run them separately:

**Backend only:**
```bash
npm run dev:server
```

**Frontend only:**
```bash
npm run dev:client
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

### Building for Production

1. Build both backend and frontend:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user (Admin only)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Deactivate patient

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Treatments
- `GET /api/treatments` - Get all treatments
- `GET /api/treatments/:id` - Get treatment by ID
- `POST /api/treatments` - Create new treatment
- `PUT /api/treatments/:id` - Update treatment
- `DELETE /api/treatments/:id` - Delete treatment

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Deactivate user (Admin only)

## User Roles

- **Admin**: Full access to all features including user management
- **Dentist**: Access to patients, appointments, and treatments
- **Assistant**: Access to patients, appointments, and treatments
- **Receptionist**: Access to patients and appointments

## Database Schema

The application uses MongoDB with the following main collections:

- **Users**: Staff members with authentication and role information
- **Patients**: Patient records with personal, medical, and insurance information
- **Appointments**: Scheduled appointments with status tracking
- **Treatments**: Treatment records with procedure details and billing

## Development

### Code Style

The project uses ESLint for code linting. Run the linter with:
```bash
npm run lint
```

### TypeScript

Both backend and frontend use TypeScript. Type checking is performed during build.

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Input validation using express-validator
- Role-based access control
- CORS configuration

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
