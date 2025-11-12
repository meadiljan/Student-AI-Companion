# 🎓 Student AI Companion

A comprehensive AI-powered academic management system designed to help students organize their coursework, manage tasks, track progress, and enhance their learning experience through intelligent features.

## 🌟 Overview

The Student AI Companion is a full-stack application that combines modern web technologies with AI capabilities to create an intelligent academic assistant. It provides students with a centralized platform to manage their courses, assignments, notes, calendar events, and academic progress while offering AI-powered assistance for task creation, course detection, and productivity optimization.

## ✨ Key Features

### 📊 Dashboard & Analytics
- **Interactive Dashboard**: Real-time overview of academic progress, active hours, CGPA tracking
- **Performance Metrics**: Visual cards showing active study hours, user engagement, and academic performance
- **Progress Tracking**: Semester-over-semester comparisons with percentage improvements
- **Active Hours Histogram**: Visual representation of study patterns and productivity hours

### 🤖 AI-Powered Assistant
- **Intelligent Task Management**: Natural language processing for task creation and management
- **Smart Course Detection**: Automatic course assignment based on task content and keywords
- **Conversational Interface**: Chat-based interaction for managing academic workflow
- **Multi-Action Processing**: Execute multiple tasks simultaneously through AI commands
- **Context-Aware Responses**: Memory-based conversations that understand user history
- **Bulk Operations**: Manage multiple tasks, completions, and deletions through AI commands

### ✅ Advanced Task Management
- **Smart Task Creation**: AI-enhanced task creation with automatic descriptions and course assignment
- **Priority System**: High, medium, and low priority classifications with visual indicators
- **Status Tracking**: Pending, in-progress, and completed task states
- **Due Date Management**: Calendar integration with overdue task detection
- **Task Filtering**: Filter by status (all, upcoming, completed, overdue, starred)
- **Search Functionality**: Real-time task search with fuzzy matching
- **Bulk Actions**: Complete, delete, or modify multiple tasks at once

### 📚 Course Management System
- **Course Portfolio**: Comprehensive course catalog with instructor information
- **Progress Tracking**: Visual progress bars for each course with completion percentages
- **Lecture Management**: Individual lecture tracking with status indicators (completed, current, upcoming)
- **Course Materials**: PDF upload and management for course documents
- **Lecture Notes**: Integrated note-taking system with rich text editing
- **Course-Task Integration**: Automatic task assignment to relevant courses

### 📝 Advanced Note-Taking
- **Rich Text Editor**: Full-featured editor with formatting options (bold, italic, lists, highlights)
- **Note Categories**: Multiple note types (text, highlights, important notes)
- **Course Integration**: Link notes to specific courses and lectures
- **Tag System**: Organize notes with custom tags for easy retrieval
- **Search & Filter**: Advanced search functionality across all notes
- **Note Management**: Pin, archive, edit, and delete notes with full CRUD operations

### 📅 Calendar & Scheduling
- **Multi-View Calendar**: Month, week, and daily calendar views
- **Event Management**: Create, edit, and delete calendar events
- **Task Integration**: Tasks automatically appear on calendar based on due dates
- **Time Slot Management**: Create recurring class schedules and study blocks
- **Course Schedule**: Automatic timetable generation from course information

### 📱 Modern UI/UX Features
- **Responsive Design**: Fully responsive across desktop, tablet, and mobile devices
- **Dark/Light Theme**: Automatic theme switching with system preference detection
- **Glass Morphism UI**: Modern frosted glass design elements with backdrop blur effects
- **Smooth Animations**: Framer Motion powered animations and transitions
- **Loading States**: Skeleton loading and progress indicators for better UX
- **Toast Notifications**: Real-time feedback for all user actions

## 🏗️ Technology Stack

### Frontend Technologies
```javascript
{
  "framework": "React 18.3.1",
  "language": "TypeScript 5.9.2",
  "bundler": "Vite 7.1.7",
  "routing": "React Router DOM 6.30.1",
  "styling": "Tailwind CSS 3.4.17",
  "stateManagement": "React Context API",
  "dataFetching": "TanStack Query 5.90.2",
  "animations": "Framer Motion 12.23.22"
}
```

### UI Component Libraries
```javascript
{
  "uiLibrary": "Radix UI Primitives",
  "componentSystem": "shadcn/ui",
  "icons": "Lucide React 0.544.0",
  "forms": "React Hook Form 7.63.0",
  "validation": "Zod 3.25.76",
  "dateHandling": "date-fns 4.1.0",
  "charts": "Recharts 2.15.4"
}
```

### Backend Technologies
```javascript
{
  "runtime": "Node.js 18+",
  "framework": "Express.js 5.1.0",
  "language": "TypeScript 5.9.2",
  "storage": "File-based JSON",
  "validation": "Zod 4.1.11",
  "cors": "CORS 2.8.5",
  "logging": "Morgan 1.10.1"
}
```

### Development & Build Tools
```javascript
{
  "packageManager": "pnpm 8.0.0+",
  "buildTool": "TypeScript Compiler",
  "linting": "ESLint 9.36.0",
  "postCSS": "PostCSS 8.5.6",
  "concurrency": "Concurrently 8.2.2"
}
```

### Additional Libraries & Features
```javascript
{
  "pdfProcessing": "PDF.js 5.4.149",
  "markdown": "React Markdown 10.1.0",
  "textProcessing": "Remark GFM 4.0.1",
  "notifications": "Sonner 2.0.7",
  "accessibility": "Radix UI Accessibility Features"
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- pnpm 8.0.0 or higher
- Modern web browser with ES6+ support

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/meadiljan/Student-AI-Companion.git
cd Student-AI-Companion
```

2. **Install dependencies for all packages**
```bash
pnpm run install:all
```

3. **Start the development servers**
```bash
pnpm run dev
```

This command starts both frontend (http://localhost:5173) and backend (http://localhost:3001) servers concurrently.

### Alternative Commands

```bash
# Start only frontend
pnpm run dev:frontend

# Start only backend  
pnpm run dev:backend

# Build for production
pnpm run build

# Start production servers
pnpm run start
```

## 📁 Project Structure

```
jade-bear-soar-copy/
├── 📁 frontend/                 # React TypeScript Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/       # Reusable UI Components
│   │   │   ├── 📁 ui/          # shadcn/ui Base Components
│   │   │   ├── AIAssistantSearchBar.tsx
│   │   │   ├── Dashboard*.tsx   # Dashboard Components
│   │   │   ├── Task*.tsx       # Task Management Components
│   │   │   ├── Note*.tsx       # Note Management Components
│   │   │   └── ...
│   │   ├── 📁 pages/           # Route Components
│   │   │   ├── Dashboard.tsx   # Main Dashboard
│   │   │   ├── Tasks.tsx       # Task Management
│   │   │   ├── Courses.tsx     # Course Management
│   │   │   ├── Calendar.tsx    # Calendar & Scheduling
│   │   │   ├── Notes.tsx       # Note-taking System
│   │   │   └── ...
│   │   ├── 📁 contexts/        # React Context Providers
│   │   │   ├── TasksContext.tsx
│   │   │   ├── CoursesContext.tsx
│   │   │   ├── CalendarEventsContext.tsx
│   │   │   └── UserContext.tsx
│   │   ├── 📁 services/        # Business Logic
│   │   │   ├── agentApi.ts     # Backend API Integration
│   │   │   ├── aiDescriptionService.ts
│   │   │   ├── courseDetectionService.ts
│   │   │   └── conversationMemory.ts
│   │   ├── 📁 hooks/           # Custom React Hooks
│   │   ├── 📁 lib/             # Utility Libraries
│   │   └── 📁 utils/           # Helper Functions
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── ...
├── 📁 backend/                  # Express TypeScript API
│   ├── 📁 src/
│   │   ├── index.ts            # Express Server Entry
│   │   ├── store.ts            # Data Storage Layer
│   │   └── types.ts            # TypeScript Definitions
│   ├── 📁 data/
│   │   └── tasks.json          # JSON Data Storage
│   └── package.json
├── package.json                 # Root Package Configuration
├── pnpm-lock.yaml
├── tsconfig.json
├── README.md
├── DEPLOYMENT_GUIDE.md         # DigitalOcean Deployment Instructions
└── AI_RULES.md                 # Development Guidelines
```

## 🎯 Core Features Deep Dive

### AI Assistant Capabilities
The AI Assistant is the heart of the application, providing:

- **Natural Language Processing**: Understands commands like "create task for math homework due tomorrow"
- **Smart Course Detection**: Automatically assigns tasks to appropriate courses based on content
- **Bulk Operations**: Handle multiple tasks with commands like "complete all pending tasks"
- **Context Awareness**: Remembers conversation history for personalized responses
- **Multi-Action Processing**: Execute complex workflows in single commands

### Task Management System
Comprehensive task management with:

- **Smart Creation**: AI-generated descriptions and automatic course assignment
- **Advanced Filtering**: Multiple filter options (status, priority, course, dates)
- **Real-time Updates**: Instant synchronization across all components
- **Overdue Detection**: Automatic identification and highlighting of overdue tasks
- **Progress Tracking**: Visual progress indicators and completion statistics

### Course & Learning Management
Full academic lifecycle support:

- **Course Portfolio**: Visual course cards with progress tracking
- **Lecture Management**: Individual lecture progress with materials
- **Note Integration**: Link notes directly to courses and lectures
- **Material Upload**: PDF upload and viewing capabilities
- **Progress Analytics**: Detailed progress tracking per course

## 🔧 Configuration & Customization

### Environment Variables
```bash
# Backend Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Frontend Configuration  
VITE_API_URL=http://localhost:3001
```

### Theming & Styling
The application uses Tailwind CSS with custom design tokens:

```css
/* Custom Colors & Themes */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--primary: 222.2 47.4% 11.2%;
--muted: 210 40% 96%;
/* ... additional color variables ... */
```

## 🚀 Deployment

### Production Build
```bash
# Build both frontend and backend
pnpm run build

# Start production servers
pnpm run start
```

### DigitalOcean App Platform
Complete deployment guide available in `DEPLOYMENT_GUIDE.md`:

1. **Automated Deployment**: GitHub integration with automatic deployments
2. **Environment Configuration**: Production environment variables setup
3. **Domain Management**: Custom domain configuration
4. **SSL Certificates**: Automatic HTTPS certificate provisioning
5. **Scaling Options**: Horizontal and vertical scaling capabilities

## 📈 Performance & Features

### Performance Optimizations
- **Code Splitting**: Lazy loading of route components
- **Bundle Optimization**: Vite-powered build optimization
- **Caching Strategy**: Efficient API response caching
- **Image Optimization**: Optimized asset loading
- **Tree Shaking**: Unused code elimination

### Accessibility Features
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Color Contrast**: WCAG compliant color schemes
- **Focus Management**: Proper focus handling
- **Responsive Design**: Mobile-first responsive design

## 🛠️ Development Guidelines

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured with React and accessibility rules
- **Component Architecture**: Atomic design principles
- **State Management**: Context API with optimized re-renders
- **Error Handling**: Comprehensive error boundaries and validation

### Contributing Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support & Documentation

### Additional Resources
- **API Documentation**: Backend API endpoints and schemas
- **Component Library**: Storybook documentation for UI components
- **Development Setup**: Complete development environment guide
- **Troubleshooting**: Common issues and solutions

### Contact & Support
- **Repository**: [GitHub - Student AI Companion](https://github.com/meadiljan/Student-AI-Companion)
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Community discussions and feature requests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for students, by developers who understand the academic journey.**
