# 🦷 Dental Customer Management System (CMS)

![Dashboard Preview](docs/images/dashboard.png)

Full-stack app for dental practice operations: patients, appointments, treatments, users, and an interactive dental chart.

## 🚀 Quick Start

### Windows One-Click Launcher
1. Double-click `start.bat`
2. Wait for setup to finish and the app to start
3. Open `http://localhost:3000`

### Docker (All-in-One)
1. Install Docker Desktop
2. Run:
```bash
docker-compose up --build
```
3. Open `http://localhost:3000`

### Manual (Dev)
```bash
npm run install:all
npm run create:admin
npm run dev
```

## ✨ Features

- **🦷 Interactive SVG Dental Chart**: Track procedures per tooth (Quadrants 1–4, Positions 1–8).
- **📝 Clinical History**: Procedure logs with notes, dentist attribution, timestamps.
- **👥 Patient Management**: Records, medical history, allergies, and contact details.
- **📅 Appointment Scheduling**: Checkups, cleanings, treatments, consultations, and more.
- **👤 Staff Management**: Role-based access (Admin, Dentist, Assistant, Receptionist).
- **📉 Dashboard**: Daily overview, patient counts, pending treatments.
- **🔐 Authentication**: JWT-based auth.
- **📱 PWA Support**: Installable desktop/mobile experience.
- **✨ UX Optimizations**: Standard date formatting (MM/DD/YYYY).

## 📸 Screenshots

| Dashboard | Patients |
| :---: | :---: |
| ![Dashboard](docs/images/dashboard.png) | ![Patients](docs/images/patients.png) |

| Appointments | Treatments |
| :---: | :---: |
| ![Appointments](docs/images/appointments.png) | ![Treatments](docs/images/treatments.png) |

| Users |
| :---: |
| ![Users](docs/images/users.png) |

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **MongoDB** + **Mongoose**
- **JWT**
- **Express Validator**

### Frontend
- **React** + **TypeScript**
- **Vite**
- **React Router**
- **React Query**
- **Zustand**
- **Tailwind CSS**
- **Axios**

## 📋 Prerequisites

- **Node.js** (v18+): https://nodejs.org/
- **MongoDB** (v6+): https://www.mongodb.com/try/download/community (or Atlas)
- **npm** (comes with Node)

Quick check:
```bash
node --version
npm --version
mongod --version
```

## 📱 Desktop Installation (PWA)

1. Open the app in **Chrome** or **Edge**
2. Click **Install** in the address bar
3. Launch it from your desktop/taskbar

## 🚀 Full Setup Guide

### 1) Clone the repo
```bash
git clone <repository-url>
cd dental-cms
```

### 2) Install dependencies
```bash
npm run install:all
```

### 3) Configure environment

Create `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/dental-cms
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

> ⚠️ Change `JWT_SECRET` in production.

### 4) Start MongoDB

- Local: ensure MongoDB service is running
- Atlas: set `MONGODB_URI` to your cluster connection string

### 5) Create admin user
```bash
npm run create:admin
```

Default admin credentials:
- **Email**: `admin@dentalcms.com`
- **Password**: `admin123`

> ⚠️ Change this password after first login.

### 6) Run the app
```bash
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

## 📝 One-Step Setup

```bash
npm run setup
```

Then run `npm run dev`.

## 🎯 Running the Application

### Development
```bash
npm run dev
```

Or separately:
```bash
npm run dev:server
npm run dev:client
```

### Production
```bash
npm run build
npm start
```

## 📁 Project Structure

```
dental-cms/
├── src/
│   └── server/              # Backend code
│       ├── config/          # Configuration files
│       ├── controllers/     # Route controllers
│       ├── middleware/      # Custom middleware
│       ├── models/          # Mongoose models
│       ├── routes/          # API routes
│       ├── scripts/         # Utility scripts (admin creation)
│       └── utils/           # Utility functions
├── client/                  # Frontend code
│   ├── src/
│   │   ├── components/      # Shared React components
│   │   ├── features/        # Modular features (e.g., dental-chart)
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand stores
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── .env                     # Environment variables (create this)
└── package.json             # Root package.json
```

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install all dependencies (backend + frontend) |
| `npm run setup` | Install + create admin user |
| `npm run create:admin` | Create initial admin user |
| `npm run dev` | Start both servers (dev) |
| `npm run dev:server` | Start backend server |
| `npm run dev:client` | Start frontend server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## 🔌 API Endpoints

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

## 👥 User Roles

- **Admin**: Full access including user management
- **Dentist**: Patients, appointments, treatments
- **Assistant**: Patients, appointments, treatments
- **Receptionist**: Patients, appointments

## 🗄️ Database Schema

- **Users**: Staff members with auth/role data
- **Patients**: Patient records with medical info
- **Appointments**: Scheduled appointments
- **Treatments**: Procedures and billing

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or Windows Services
- Verify `MONGODB_URI` in `.env`
- For Atlas, verify connection string and IP whitelist

### Port Already in Use
- Change `PORT` in `.env`
- Kill the process on the port:
  - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`
  - Mac/Linux: `lsof -ti:5000 | xargs kill`

### Dependencies Installation Issues
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` + `package-lock.json`, then reinstall
- Ensure Node.js v18+

### Admin User Already Exists
- Use existing credentials, or
- Delete the user from MongoDB and rerun `create:admin`, or
- Create a new user via UI (Admin → Users → Add User)

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Input validation with express-validator
- Role-based access control
- CORS configuration

## 🧪 Development

ESLint:
```bash
npm run lint
```

TypeScript type checks run during build.

## 📦 Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Set a strong `JWT_SECRET`
3. Set production `MONGODB_URI`
4. Set `CORS_ORIGIN` to your frontend URL
5. Build: `npm run build`
6. Start: `npm start`

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit a PR

## 📄 License

MIT

## 💬 Support

Please open an issue for questions or bugs.

---

**Made with ❤️ for dental practices**
