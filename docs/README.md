# PM Application Documentation

Welcome to the PM Application documentation! This guide will help you understand and work with the codebase.

## 📚 Documentation Sections

### 🚀 [Real-Time Collaboration](./realtime/README.md)

Complete guide to real-time features including:

- How WebSockets and Pusher work
- System architecture and data flow
- Step-by-step setup instructions
- Presence system (see who's viewing)
- Live cursors (Figma-style)
- Real-time data updates
- Code examples
- Troubleshooting guide

**Perfect for:** Developers new to real-time features or Pusher

## 🎯 Quick Links

- [Real-Time Overview](./realtime/01-overview.md) - Start here if you're new to real-time features
- [Setup Guide](./realtime/03-setup.md) - Getting Pusher up and running
- [Code Examples](./realtime/07-examples.md) - Copy-paste ready implementations
- [Troubleshooting](./realtime/08-troubleshooting.md) - Fix common issues

## 🤝 Contributing

When adding new features or making changes:

1. **Update Documentation** - Keep these docs in sync with code changes
2. **Add Examples** - Include practical code examples
3. **Write for Beginners** - Explain concepts clearly
4. **Include Diagrams** - Visual aids help understanding

## 📝 Documentation Standards

- **Use clear headings** - H2 for main sections, H3 for subsections
- **Include code examples** - Show, don't just tell
- **Explain the "why"** - Don't just show the "how"
- **Add troubleshooting** - Document common issues and solutions
- **Keep it updated** - Documentation should match the current codebase

## 🛠️ Tech Stack Reference

- **Framework:** Next.js 14 (App Router)
- **UI:** React, Tailwind CSS, shadcn/ui
- **Database:** PostgreSQL with Prisma ORM
- **Real-Time:** Pusher (WebSockets)
- **State Management:** React Query (TanStack Query), Zustand
- **Authentication:** Custom session-based auth
- **Animations:** Framer Motion

## 📂 Project Structure

```
pm-usufdev/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages (signin, signup)
│   ├── (main)/            # Main app pages (dashboard, projects)
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── features/         # Feature-specific components
│   └── widgets/          # Reusable widgets
├── lib/                   # Shared libraries and utilities
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand stores
│   └── generated/        # Generated code (Prisma client)
├── prisma/                # Database schema and migrations
├── docs/                  # Documentation (you are here!)
└── public/                # Static assets
```

## 🔗 External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Pusher Documentation](https://pusher.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Query Documentation](https://tanstack.com/query)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## ❓ Need Help?

1. Check the relevant documentation section
2. Look at code examples
3. Review troubleshooting guides
4. Check external resources
5. Ask the team

---

**Happy coding!** 🎉
