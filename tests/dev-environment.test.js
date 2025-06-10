/**
 * Dev Environment Diagnostic Tests
 * Tests for checking the development environment health and configuration
 */

import { DevEnvironmentDiagnostic } from '../src/lib/dev-diagnostic'

describe('DevEnvironmentDiagnostic', () => {
  let diagnostic

  beforeEach(() => {
    diagnostic = new DevEnvironmentDiagnostic()
  })

  describe('Environment Configuration', () => {
    test('should detect Node.js version', async () => {
      const result = await diagnostic.checkNodeVersion()
      expect(result).toHaveProperty('version')
      expect(result).toHaveProperty('isSupported')
      expect(typeof result.version).toBe('string')
      expect(typeof result.isSupported).toBe('boolean')
    })

    test('should detect Next.js version', async () => {
      const result = await diagnostic.checkNextVersion()
      expect(result).toHaveProperty('version')
      expect(result).toHaveProperty('isSupported')
      expect(result.version).toMatch(/^\d+\.\d+\.\d+/)
    })

    test('should check environment variables', async () => {
      const result = await diagnostic.checkEnvironmentVariables()
      expect(result).toHaveProperty('required')
      expect(result).toHaveProperty('optional')
      expect(result).toHaveProperty('missing')
      expect(Array.isArray(result.missing)).toBe(true)
    })
  })

  describe('Dependencies Check', () => {
    test('should verify all dependencies are installed', async () => {
      const result = await diagnostic.checkDependencies()
      expect(result).toHaveProperty('installed')
      expect(result).toHaveProperty('missing')
      expect(result).toHaveProperty('outdated')
      expect(Array.isArray(result.missing)).toBe(true)
    })

    test('should check for security vulnerabilities', async () => {
      const result = await diagnostic.checkSecurityVulnerabilities()
      expect(result).toHaveProperty('vulnerabilities')
      expect(result).toHaveProperty('severity')
      expect(Array.isArray(result.vulnerabilities)).toBe(true)
    })
  })

  describe('Configuration Validation', () => {
    test('should validate Next.js configuration', async () => {
      const result = await diagnostic.validateNextConfig()
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(typeof result.isValid).toBe('boolean')
    })

    test('should validate TypeScript configuration', async () => {
      const result = await diagnostic.validateTypeScriptConfig()
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('strictModeEnabled')
    })

    test('should validate ESLint configuration', async () => {
      const result = await diagnostic.validateESLintConfig()
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('rulesCount')
      expect(result).toHaveProperty('errors')
    })

    test('should validate Tailwind CSS configuration', async () => {
      const result = await diagnostic.validateTailwindConfig()
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('purgeEnabled')
      expect(result).toHaveProperty('customTheme')
    })
  })

  describe('Database Connectivity', () => {
    test('should check Supabase connection', async () => {
      const result = await diagnostic.checkSupabaseConnection()
      expect(result).toHaveProperty('connected')
      expect(result).toHaveProperty('latency')
      expect(result).toHaveProperty('projectId')
      expect(typeof result.connected).toBe('boolean')
    })

    test('should validate database schema', async () => {
      const result = await diagnostic.validateDatabaseSchema()
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('tables')
      expect(result).toHaveProperty('missingTables')
      expect(Array.isArray(result.tables)).toBe(true)
    })
  })

  describe('Performance Metrics', () => {
    test('should measure build performance', async () => {
      const result = await diagnostic.measureBuildPerformance()
      expect(result).toHaveProperty('buildTime')
      expect(result).toHaveProperty('bundleSize')
      expect(result).toHaveProperty('optimizations')
      expect(typeof result.buildTime).toBe('number')
    })

    test('should check memory usage', async () => {
      const result = await diagnostic.checkMemoryUsage()
      expect(result).toHaveProperty('used')
      expect(result).toHaveProperty('available')
      expect(result).toHaveProperty('percentage')
      expect(typeof result.percentage).toBe('number')
    })
  })

  describe('Testing Environment', () => {
    test('should validate Jest configuration', async () => {
      const result = await diagnostic.validateJestConfig()
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('setupFiles')
      expect(result).toHaveProperty('testEnvironment')
      expect(result.testEnvironment).toBe('jest-environment-jsdom')
    })

    test('should check test coverage', async () => {
      const result = await diagnostic.checkTestCoverage()
      expect(result).toHaveProperty('percentage')
      expect(result).toHaveProperty('lines')
      expect(result).toHaveProperty('branches')
      expect(result).toHaveProperty('functions')
    })
  })

  describe('Development Server', () => {
    test('should check development server configuration', async () => {
      const result = await diagnostic.checkDevServer()
      expect(result).toHaveProperty('port')
      expect(result).toHaveProperty('host')
      expect(result).toHaveProperty('https')
      expect(result.port).toBe(3001)
    })

    test('should validate hot module replacement', async () => {
      const result = await diagnostic.validateHMR()
      expect(result).toHaveProperty('enabled')
      expect(result).toHaveProperty('working')
      expect(typeof result.enabled).toBe('boolean')
    })
  })

  describe('Comprehensive Report', () => {
    test('should generate comprehensive diagnostic report', async () => {
      const result = await diagnostic.generateReport()
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('details')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('score')
      expect(typeof result.score).toBe('number')
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    test('should provide actionable recommendations', async () => {
      const result = await diagnostic.getRecommendations()
      expect(result).toHaveProperty('critical')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('suggestions')
      expect(Array.isArray(result.critical)).toBe(true)
    })
  })

  describe('Debugging Tools', () => {
    test('should provide debugging information', async () => {
      const result = await diagnostic.getDebuggingInfo()
      expect(result).toHaveProperty('vsCodeConfig')
      expect(result).toHaveProperty('chromeDebugPort')
      expect(result).toHaveProperty('inspectCommand')
      expect(typeof result.inspectCommand).toBe('string')
    })

    test('should check source maps generation', async () => {
      const result = await diagnostic.checkSourceMaps()
      expect(result).toHaveProperty('enabled')
      expect(result).toHaveProperty('clientSide')
      expect(result).toHaveProperty('serverSide')
      expect(typeof result.enabled).toBe('boolean')
    })
  })
}) 