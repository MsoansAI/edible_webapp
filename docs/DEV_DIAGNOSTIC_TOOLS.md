# Development Environment Diagnostic Tools

## Overview

This project includes comprehensive development environment diagnostic tools to ensure optimal setup, debugging capabilities, and developer experience. The tools help identify configuration issues, performance bottlenecks, and provide actionable recommendations.

## 🚀 Quick Start

### Setup Development Environment
```bash
npm run setup-dev
```

### Run Diagnostic
```bash
# Full diagnostic report
npm run diagnose

# Quick diagnostic check
npm run diagnose:quick
```

### Start Development with Debugging
```bash
# Regular development server
npm run dev

# Development server with Node.js inspector
npm run dev:debug
```

## 🔧 Tools Overview

### 1. DevEnvironmentDiagnostic Class (`src/lib/dev-diagnostic.js`)

Core diagnostic engine that performs comprehensive environment checks:

**Environment Configuration**
- Node.js version compatibility
- Next.js version validation  
- Environment variables verification

**Dependencies Analysis**
- Installed packages verification
- Missing dependencies detection
- Security vulnerability scanning

**Configuration Validation**
- Next.js configuration check
- TypeScript configuration validation
- ESLint and Tailwind CSS setup verification

**Database Connectivity**
- Supabase connection testing
- Database schema validation
- Connection latency monitoring

**Performance Metrics**
- Build performance measurement
- Memory usage monitoring
- Bundle size analysis

**Testing Environment**
- Jest configuration validation
- Test coverage analysis
- Setup files verification

### 2. Diagnostic CLI Tool (`scripts/diagnose.js`)

Command-line interface for running diagnostics with colored output and comprehensive reporting.

**Commands:**
```bash
npm run diagnose         # Full diagnostic
npm run diagnose quick   # Quick check
npm run diagnose help    # Show help
```

**Features:**
- 📊 Comprehensive scoring system (A-F grades)
- 🎨 Color-coded output for easy reading
- ⚡ Performance timing
- 📋 Actionable recommendations
- 🚨 Critical issue highlighting

### 3. Setup Tool (`scripts/setup-dev.js`)

Automated development environment setup and configuration.

**Features:**
- Node.js version verification
- Dependency installation
- Environment variable template creation
- VS Code configuration setup
- Initial build validation
- Comprehensive environment report

### 4. VS Code Integration (`.vscode/`)

Professional debugging and development configurations.

**Launch Configurations:**
- **Next.js: debug server-side** - Debug server components
- **Next.js: debug client-side** - Debug in Chrome
- **Next.js: debug client-side (Firefox)** - Debug in Firefox  
- **Next.js: debug full stack** - Debug both client and server
- **Jest: debug tests** - Debug test files
- **Jest: debug current test file** - Debug active test
- **Dev Diagnostic: debug tool** - Debug diagnostic tool itself

**Extension Recommendations:**
- Tailwind CSS IntelliSense
- Prettier formatter
- TypeScript support
- Jest testing
- ESLint integration
- Path IntelliSense
- Auto rename tags
- TODO Tree
- Code spell checker

## 🐛 Debugging Guide

### Browser DevTools Debugging

#### Client-Side Debugging
1. Start development server: `npm run dev`
2. Open `http://localhost:3001` in browser
3. Open Chrome DevTools (`Ctrl+Shift+J` / `⌥+⌘+I`)
4. Go to **Sources** tab
5. Search files with `Ctrl+P` / `⌘+P`
6. Files appear as `webpack://_N_E/./src/...`

#### Server-Side Debugging  
1. Start with inspector: `npm run dev:debug`
2. Chrome: Visit `chrome://inspect`
3. Click **Configure...** and add `localhost:9229` and `localhost:9230`
4. Find your Next.js application in **Remote Target**
5. Click **inspect** to open DevTools
6. Use **Sources** tab for debugging

### VS Code Debugging

1. Open VS Code in project root
2. Press `Ctrl+Shift+D` / `⇧+⌘+D` to open Debug panel
3. Select debugging configuration from dropdown:
   - **Next.js: debug server-side** - For server components
   - **Next.js: debug client-side** - For browser debugging
   - **Next.js: debug full stack** - For complete debugging
4. Press `F5` or click the play button

### Test Debugging

```bash
# Debug all tests
npm run test:debug

# Debug specific test file  
npm test -- --runInBand tests/specific-test.js
```

In VS Code:
1. Open test file
2. Set breakpoints
3. Use **Jest: debug current test file** configuration
4. Press `F5`

## 📊 Diagnostic Scoring System

The diagnostic tool provides a comprehensive score (0-100) with letter grades:

- **A (90-100)**: Excellent - Production ready
- **B (80-89)**: Good - Minor optimizations needed  
- **C (70-79)**: Acceptable - Some improvements required
- **D (60-69)**: Needs Work - Multiple issues to address
- **F (0-59)**: Critical Issues - Immediate attention required

### Scoring Weights:
- Node.js version compatibility: 15 points
- Next.js version compatibility: 15 points  
- Environment variables: 20 points
- Dependencies: 15 points
- Next.js configuration: 10 points
- TypeScript configuration: 10 points
- Database connectivity: 10 points
- Testing setup: 5 points

## 🔍 Troubleshooting

### Common Issues

#### Missing Environment Variables
```bash
# Create .env.local with required variables
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

#### Node.js Version Issues
```bash
# Check current version
node --version

# Upgrade to Node.js 18+ for best compatibility
nvm install 18
nvm use 18
```

#### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Check types
npm run type-check

# Fix common issues by enabling strict mode in tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### Performance Issues

#### Slow Build Times
- Enable SWC minification (already configured)
- Check webpack configuration in `next.config.js`
- Monitor bundle size with diagnostic tool

#### Memory Issues
- Monitor with `npm run diagnose`
- Check for memory leaks in development
- Optimize component rendering

## 📚 Configuration Files

### Enhanced Next.js Configuration (`next.config.js`)
- **Source maps enabled** for better debugging
- **React Strict Mode** for development best practices
- **SWC minification** for faster builds
- **Security headers** for production safety
- **Optimized webpack** configuration for development

### Jest Configuration (`jest.config.js`)
- **jsdom environment** for React component testing
- **Module mapping** for absolute imports
- **Coverage collection** from `src/` directory
- **Setup files** for test environment

### TypeScript Configuration (`tsconfig.json`)
- **Strict mode recommended** (configure based on needs)
- **Path mapping** for clean imports
- **Next.js optimizations** included

## 🎯 Best Practices

### Development Workflow
1. Run `npm run setup-dev` for new environments
2. Use `npm run diagnose:quick` before starting work
3. Run full diagnostic weekly: `npm run diagnose`
4. Use appropriate debugging configurations in VS Code
5. Monitor performance metrics regularly

### Testing Strategy
1. Write tests first (as per project rules)
2. Use `npm run test:watch` during development
3. Check coverage with `npm run test:coverage`
4. Debug tests with VS Code configurations

### Performance Monitoring
1. Monitor memory usage during development
2. Check build performance regularly
3. Optimize based on diagnostic recommendations
4. Use browser DevTools for client-side profiling

## 🛠 Extending the Diagnostic Tools

### Adding New Checks

1. **Environment Check:**
```javascript
async checkCustomEnvironment() {
  // Your custom logic
  return {
    isValid: true,
    details: {},
    recommendations: []
  }
}
```

2. **Update Test Suite:**
```javascript
test('should pass custom environment check', async () => {
  const result = await diagnostic.checkCustomEnvironment()
  expect(result.isValid).toBe(true)
})
```

3. **Add to Report Generation:**
```javascript
const customCheck = await this.checkCustomEnvironment()
// Include in report details
```

### Custom Diagnostic Scripts

Create new scripts in `scripts/` directory following the pattern of existing tools:
- Use chalk for colored output
- Provide clear error messages
- Include timing information
- Exit with appropriate codes

## 📖 References

- [Next.js Debugging Guide](https://nextjs.org/docs/app/guides/debugging)
- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)

## 🤝 Contributing

When adding new diagnostic features:
1. Write tests first (follow project rules)
2. Update documentation
3. Ensure compatibility with existing tools
4. Test in multiple environments
5. Provide clear error messages and recommendations 