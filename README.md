# PM-USUFDEV - Project Management Tool

A modern, full-featured project management application built with Next.js, Prisma, and PostgreSQL.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 📚 Documentation

All project documentation is located in the [`/docs`](/docs) folder:

- **[Setup Guide](./docs/SETUP.md)** - Detailed installation and configuration
- **[Features Documentation](./docs/NEW_FEATURES_SUMMARY.md)** - Complete feature list
- **[Implementation Details](./docs/IMPLEMENTATION_SUMMARY.md)** - Technical implementation
- **[Full Documentation Index](./docs/INDEX.md)** - All documentation files

## ✨ Key Features

- 🔐 **Multi-tenant Architecture** - Secure user authentication and project isolation
- 📋 **Kanban Board** - Trello-style drag-and-drop task management
- ⚡ **Quick Edit** - Edit assignees and due dates directly from cards
- 🔍 **Advanced Filters** - Filter by assignee, due date, and search
- 💬 **Comments** - Full discussion threads on tasks
- 📝 **Markdown Support** - Rich text formatting for task descriptions
- 🎨 **Dark/Light Mode** - Beautiful UI with theme support
- 🚀 **Optimistic Updates** - Instant UI feedback with React Query
- 📱 **Responsive Design** - Works on all devices

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **UI Components:** shadcn/ui, Radix UI
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **State Management:** React Query (TanStack Query), Zustand
- **Authentication:** JWT with jose
- **Drag & Drop:** @dnd-kit

## 📖 Learn More

Visit the [documentation folder](./docs) for comprehensive guides on:
- Setup and deployment
- Feature documentation
- API reference
- Development guidelines
- Troubleshooting

## 🤝 Contributing

This is a personal project. For questions or suggestions, please refer to the documentation.

## 📝 License

Private project - All rights reserved.

---

**Documentation:** [/docs](/docs) | **Issues:** Check docs/FIXES_SUMMARY.md | **Features:** docs/NEW_FEATURES_SUMMARY.md

