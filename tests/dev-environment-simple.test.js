/**
 * Dev Environment Diagnostic Tests (Simplified)
 * Tests for checking the development environment health and configuration
 */

describe('DevEnvironmentDiagnostic (Core Tests)', () => {
  describe('Node.js Environment', () => {
    test('should detect Node.js version', () => {
      const version = process.version
      const majorVersion = parseInt(version.slice(1).split('.')[0])
      
      expect(version).toMatch(/^v\d+\.\d+\.\d+/)
      expect(majorVersion).toBeGreaterThanOrEqual(18)
    })

    test('should have access to environment variables', () => {
      expect(typeof process.env.NODE_ENV).toBe('string')
      expect(['development', 'test', 'production']).toContain(process.env.NODE_ENV || 'development')
    })

    test('should have proper memory access', () => {
      const memoryUsage = process.memoryUsage()
      expect(memoryUsage).toHaveProperty('heapUsed')
      expect(memoryUsage).toHaveProperty('heapTotal')
      expect(memoryUsage.heapUsed).toBeGreaterThan(0)
      expect(memoryUsage.heapTotal).toBeGreaterThan(0)
    })
  })

  describe('Package Configuration', () => {
    test('should have valid package.json', () => {
      const packageJson = require('../package.json')
      
      expect(packageJson).toHaveProperty('name')
      expect(packageJson).toHaveProperty('version')
      expect(packageJson).toHaveProperty('scripts')
      expect(packageJson.scripts).toHaveProperty('dev')
      expect(packageJson.scripts).toHaveProperty('build')
      expect(packageJson.scripts).toHaveProperty('test')
    })

    test('should have diagnostic scripts configured', () => {
      const packageJson = require('../package.json')
      
      expect(packageJson.scripts).toHaveProperty('diagnose')
      expect(packageJson.scripts).toHaveProperty('diagnose:quick')
      expect(packageJson.scripts).toHaveProperty('setup-dev')
      expect(packageJson.scripts).toHaveProperty('dev:debug')
    })

    test('should have required dependencies', () => {
      const packageJson = require('../package.json')
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }
      
      // Core Next.js dependencies
      expect(allDeps).toHaveProperty('next')
      expect(allDeps).toHaveProperty('react')
      expect(allDeps).toHaveProperty('react-dom')
      
      // Testing dependencies
      expect(allDeps).toHaveProperty('jest')
      expect(allDeps).toHaveProperty('@testing-library/react')
      expect(allDeps).toHaveProperty('@testing-library/jest-dom')
      
      // Dev tools
      expect(allDeps).toHaveProperty('chalk')
      expect(allDeps).toHaveProperty('typescript')
    })
  })

  describe('Project Structure', () => {
    const fs = require('fs')
    const path = require('path')

    test('should have proper project structure', () => {
      const projectRoot = process.cwd()
      
      // Check for essential directories
      expect(fs.existsSync(path.join(projectRoot, 'src'))).toBe(true)
      expect(fs.existsSync(path.join(projectRoot, 'src/app'))).toBe(true)
      expect(fs.existsSync(path.join(projectRoot, 'src/components'))).toBe(true)
      expect(fs.existsSync(path.join(projectRoot, 'src/lib'))).toBe(true)
      
      // Check for configuration files
      expect(fs.existsSync(path.join(projectRoot, 'package.json'))).toBe(true)
      expect(fs.existsSync(path.join(projectRoot, 'next.config.js'))).toBe(true)
      expect(fs.existsSync(path.join(projectRoot, 'tsconfig.json'))).toBe(true)
      expect(fs.existsSync(path.join(projectRoot, 'tailwind.config.js'))).toBe(true)
    })

    test('should have VS Code configuration', () => {
      const projectRoot = process.cwd()
      const vscodePath = path.join(projectRoot, '.vscode')
      
      expect(fs.existsSync(vscodePath)).toBe(true)
      expect(fs.existsSync(path.join(vscodePath, 'launch.json'))).toBe(true)
      expect(fs.existsSync(path.join(vscodePath, 'extensions.json'))).toBe(true)
    })

    test('should have test configuration', () => {
      const projectRoot = process.cwd()
      
      expect(fs.existsSync(path.join(projectRoot, 'jest.config.js'))).toBe(true)
      expect(fs.existsSync(path.join(projectRoot, 'jest.setup.js'))).toBe(true)
      expect(fs.existsSync(path.join(projectRoot, 'tests'))).toBe(true)
    })

    test('should have diagnostic tools', () => {
      const projectRoot = process.cwd()
      const scriptsPath = path.join(projectRoot, 'scripts')
      
      expect(fs.existsSync(scriptsPath)).toBe(true)
      expect(fs.existsSync(path.join(scriptsPath, 'diagnose.js'))).toBe(true)
      expect(fs.existsSync(path.join(scriptsPath, 'setup-dev.js'))).toBe(true)
    })
  })

  describe('Configuration Validation', () => {
    test('should have valid Next.js configuration', () => {
      const nextConfig = require('../next.config.js')
      
      expect(nextConfig).toBeInstanceOf(Object)
      expect(nextConfig).toHaveProperty('reactStrictMode')
      expect(nextConfig).toHaveProperty('productionBrowserSourceMaps')
      expect(nextConfig.reactStrictMode).toBe(true)
      expect(nextConfig.productionBrowserSourceMaps).toBe(true)
    })

    test('should have valid TypeScript configuration', () => {
      const fs = require('fs')
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'))
      
      expect(tsconfig).toHaveProperty('compilerOptions')
      expect(tsconfig).toHaveProperty('include')
      expect(tsconfig.compilerOptions).toHaveProperty('target')
      expect(tsconfig.compilerOptions).toHaveProperty('lib')
      expect(tsconfig.compilerOptions).toHaveProperty('allowJs')
    })

    test('should have valid Tailwind configuration', () => {
      const fs = require('fs')
      const tailwindConfig = fs.readFileSync('tailwind.config.js', 'utf8')
      
      expect(tailwindConfig).toContain('content:')
      expect(tailwindConfig).toContain('theme:')
      expect(tailwindConfig).toContain('plugins:')
    })
  })

  describe('Development Scripts', () => {
    test('should have development port configured', () => {
      const packageJson = require('../package.json')
      const devScript = packageJson.scripts.dev
      
      expect(devScript).toContain('-p 3001')
    })

    test('should have debug configuration', () => {
      const packageJson = require('../package.json')
      const debugScript = packageJson.scripts['dev:debug']
      
      expect(debugScript).toContain('--inspect')
      expect(debugScript).toContain('-p 3001')
    })

    test('should have test scripts configured', () => {
      const packageJson = require('../package.json')
      
      expect(packageJson.scripts.test).toContain('jest')
      expect(packageJson.scripts['test:watch']).toContain('jest --watch')
      expect(packageJson.scripts['test:coverage']).toContain('jest --coverage')
    })
  })

  describe('VS Code Integration', () => {
    test('should have proper launch configuration', () => {
      const fs = require('fs')
      const launchConfig = JSON.parse(fs.readFileSync('.vscode/launch.json', 'utf8'))
      
      expect(launchConfig).toHaveProperty('version')
      expect(launchConfig).toHaveProperty('configurations')
      expect(Array.isArray(launchConfig.configurations)).toBe(true)
      
      const configs = launchConfig.configurations
      const configNames = configs.map(c => c.name)
      
      expect(configNames).toContain('Next.js: debug server-side')
      expect(configNames).toContain('Next.js: debug client-side')
      expect(configNames).toContain('Jest: debug tests')
    })

    test('should have extension recommendations', () => {
      const fs = require('fs')
      const extensions = JSON.parse(fs.readFileSync('.vscode/extensions.json', 'utf8'))
      
      expect(extensions).toHaveProperty('recommendations')
      expect(Array.isArray(extensions.recommendations)).toBe(true)
      expect(extensions.recommendations.length).toBeGreaterThan(0)
      
      // Check for essential extensions
      expect(extensions.recommendations).toContain('bradlc.vscode-tailwindcss')
      expect(extensions.recommendations).toContain('ms-vscode.vscode-jest')
      expect(extensions.recommendations).toContain('ms-vscode.vscode-typescript-next')
    })
  })

  describe('Performance Characteristics', () => {
    test('should have reasonable memory usage', () => {
      const memoryUsage = process.memoryUsage()
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024
      
      // Test environment should use less than 200MB
      expect(heapUsedMB).toBeLessThan(200)
    })

    test('should have proper Node.js version for performance', () => {
      const version = process.version
      const majorVersion = parseInt(version.slice(1).split('.')[0])
      
      // Node.js 18+ for best performance with Next.js
      expect(majorVersion).toBeGreaterThanOrEqual(18)
    })
  })

  describe('Security Configuration', () => {
    test('should have security headers configured', () => {
      const nextConfig = require('../next.config.js')
      
      expect(typeof nextConfig.headers).toBe('function')
    })

    test('should have proper strict mode enabled', () => {
      const nextConfig = require('../next.config.js')
      
      expect(nextConfig.reactStrictMode).toBe(true)
    })
  })
}) 