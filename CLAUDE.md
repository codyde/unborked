# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint checks
- `npm run preview` - Preview production build

## Code Style Guidelines
- **TypeScript**: Use strict mode with proper type annotations
- **Imports**: React imports first, then libraries, then local imports
- **Components**: Use functional components with React.FC type annotation
- **Naming**: PascalCase for components/interfaces, camelCase for variables/functions
- **State**: Prefer hooks and Context API for state management
- **Styling**: Use Tailwind CSS classes
- **Error Handling**: Use custom error messages in hooks and catch errors in async operations
- **Organization**: Keep components, pages, and context in their respective directories
- **Types**: Define interfaces in src/types with descriptive names

## Architecture
- React 18 with TypeScript and Vite
- React Router for navigation
- Sentry for error tracking