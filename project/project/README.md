# Audit Training Management System (ATMS).

A comprehensive full-stack web application for managing audit training programs, built with React, TypeScript, Tailwind CSS, and Firebase.

## 🚀 Features

### Authentication & Authorization
- **Firebase Authentication** with email/password and Google sign-in
- **Role-based access control** (Admin, Trainer, Trainee, User)
- **Secure user management** with proper error handling

### Multi-Role Dashboards
- **Admin Dashboard**: User management, course oversight, analytics, activity logs
- **Trainer Dashboard**: Course creation, session management, student tracking
- **Trainee Dashboard**: Course enrollment, progress tracking, resource access
- **User Dashboard**: Course browsing, profile management

### Course Management
- **CRUD operations** for courses and training sessions
- **Real-time updates** with Firestore synchronization
- **File upload capabilities** with Firebase Storage
- **Progress tracking** and completion certificates

### Modern UI/UX
- **Responsive design** optimized for all devices
- **Dark/light mode** with system preference detection
- **Smooth animations** using Framer Motion
- **Professional design** with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend
- **Firebase Authentication** for user management
- **Firestore Database** for real-time data
- **Firebase Storage** for file uploads
- **Firebase Hosting** for deployment

### Development
- **TypeScript** for type safety
- **ESLint** for code quality
- **Modern React patterns** with hooks and context

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (Button, Input, Card)
│   ├── layout/          # Layout components (Navbar, Sidebar)
│   ├── courses/         # Course-related components
│   └── dashboard/       # Dashboard-specific components
├── pages/               # Page components
│   ├── dashboards/      # Role-specific dashboards
│   ├── WelcomePage.tsx  # Landing page
│   └── AuthPage.tsx     # Authentication page
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication state
│   └── ThemeContext.tsx # Theme management
├── services/            # Firebase service functions
│   ├── courseService.ts # Course CRUD operations
│   └── activityService.ts # Activity logging
├── hooks/               # Custom React hooks
│   └── useFirestoreQuery.ts # Firestore data fetching
├── types/               # TypeScript type definitions
├── lib/                 # Library configurations
│   └── firebase.ts      # Firebase configuration
└── utils/               # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Firebase project with Authentication, Firestore, and Storage enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd audit-training-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Enable Firebase Storage
   - Copy your Firebase configuration

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase configuration values in the `.env` file.

5. **Start development server**
   ```bash
   npm run dev
   ```

### Firebase Setup

1. **Authentication**
   - Enable Email/Password and Google providers
   - Configure authorized domains for production

2. **Firestore Database**
   - Create collections: `users`, `courses`, `activities`
   - Set up security rules for role-based access

3. **Storage**
   - Configure bucket for file uploads
   - Set up security rules for authenticated users

### Building for Production

```bash
npm run build
npm run preview
```

## 🔒 Security Features

- **Row-level security** with Firestore security rules
- **Role-based access control** throughout the application
- **Input validation** and error handling
- **Secure file uploads** with Firebase Storage rules

## 📱 Responsive Design

The application is fully responsive with breakpoints for:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## 🎨 Design System

- **Color Palette**: Professional blue and emerald gradients
- **Typography**: Consistent font sizes and weights
- **Spacing**: 8px grid system
- **Components**: Reusable with consistent styling

## 🔧 Development

### Code Quality
- TypeScript for type safety
- ESLint for code consistency
- Modular architecture for maintainability
- File size limits (< 300 lines per file)

### Performance
- **Code splitting** with React.lazy()
- **Optimized images** and assets
- **Efficient re-renders** with React.memo()
- **Real-time updates** without polling

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**Built with ❤️ using React, TypeScript, and Firebase**
