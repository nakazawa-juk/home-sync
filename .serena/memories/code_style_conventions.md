# Code Style & Conventions

## Prettier Configuration

- **Print Width**: 80 characters
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for JS/TS, double quotes for JSX
- **Semicolons**: Required
- **Trailing Commas**: Always
- **Bracket Spacing**: Enabled
- **Arrow Parens**: Always

## ESLint Configuration

- Extends: ESLint recommended + TypeScript ESLint recommended
- Plugins: React Hooks, React Refresh
- Target: Browser environment
- ECMAScript Version: 2020

## TypeScript Settings

- **Strict Mode**: Disabled (`strict: false`)
- **Type Checking**: Basic (skipLibCheck enabled)
- **JSX**: Preserve mode (Next.js handles)

## File & Component Conventions

- **Components**: PascalCase (e.g., `Hero.tsx`, `Experience.tsx`)
- **Files**: kebab-case for config files, PascalCase for components
- **Exports**: Default exports for components
- **Structure**: Functional components with TypeScript

## Architecture

- **App Router**: Using Next.js 13+ app directory structure
- **Components**: Separated into dedicated `/components` directory
- **Styling**: Tailwind CSS classes, custom CSS in globals.css
