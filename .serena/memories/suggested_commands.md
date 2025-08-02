# Suggested Commands

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Code Quality Commands

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format

# Check formatting without fixing
npm run format:check
```

## Common System Commands (macOS)

```bash
# File operations
ls -la          # List files with details
find . -name    # Find files by name
grep -r         # Search in files

# Git operations
git status      # Check repository status
git add .       # Stage all changes
git commit -m   # Commit with message
git push        # Push to remote

# Process management
ps aux          # List running processes
kill -9         # Force kill process
```

## Project-Specific Workflow

1. Make changes to code
2. Run `npm run format` to format code
3. Run `npm run lint` to check for issues
4. Run `npm run build` to verify build works
5. Test the build output if needed
