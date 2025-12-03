# Contributing to Secure Billing System

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a positive community

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has been requested
2. Open an issue describing:
   - The problem it solves
   - Proposed solution
   - Alternative solutions considered
   - Additional context

### Pull Requests

1. **Fork the repository**
2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   pnpm lint
   pnpm build
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   
   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Formatting
   - `refactor:` - Code restructuring
   - `test:` - Tests
   - `chore:` - Maintenance

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Describe your changes
   - Link related issues
   - Add screenshots if UI changes

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-fork-url>
   cd secure-billing-system
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Update with your configuration
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

## Code Style

- Use TypeScript for type safety
- Follow existing patterns and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Testing

- Test your changes locally
- Ensure existing functionality works
- Add tests for new features

## Security

- Never commit secrets or sensitive data
- Follow security best practices
- Report security issues privately (see SECURITY.md)

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for functions
- Update API documentation if endpoints change

## Questions?

Feel free to open an issue for:
- Clarification on guidelines
- Help with setup
- Discussion of ideas

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing! 🎉
