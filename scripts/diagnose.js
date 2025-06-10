#!/usr/bin/env node

/**
 * Dev Environment Diagnostic CLI Tool
 * Run comprehensive diagnostics on the development environment
 */

import { DevEnvironmentDiagnostic } from '../src/lib/dev-diagnostic.js'
import chalk from 'chalk'

const COLORS = {
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  header: chalk.bold.cyan,
  subheader: chalk.bold.white
}

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function printSection(title, status = null) {
  console.log('\n' + COLORS.header('═'.repeat(60)))
  console.log(COLORS.header(`📋 ${title}`))
  if (status) {
    console.log(COLORS.subheader(`Status: ${status}`))
  }
  console.log(COLORS.header('═'.repeat(60)))
}

function printCheck(name, result, showDetails = false) {
  const icon = result.isValid || result.isSupported || result.connected 
    ? COLORS.success('✅') 
    : COLORS.error('❌')
  
  console.log(`${icon} ${name}`)
  
  if (showDetails) {
    if (result.version) {
      console.log(`   Version: ${COLORS.info(result.version)}`)
    }
    if (result.error) {
      console.log(`   ${COLORS.error('Error:')} ${result.error}`)
    }
    if (result.recommendation) {
      console.log(`   ${COLORS.warning('Recommendation:')} ${result.recommendation}`)
    }
  }
}

function printRecommendations(recommendations) {
  if (recommendations.critical.length > 0) {
    console.log('\n' + COLORS.error('🚨 CRITICAL ISSUES:'))
    recommendations.critical.forEach(item => {
      console.log(`   ${COLORS.error('●')} ${item}`)
    })
  }

  if (recommendations.warnings.length > 0) {
    console.log('\n' + COLORS.warning('⚠️  WARNINGS:'))
    recommendations.warnings.forEach(item => {
      console.log(`   ${COLORS.warning('●')} ${item}`)
    })
  }

  if (recommendations.suggestions.length > 0) {
    console.log('\n' + COLORS.info('💡 SUGGESTIONS:'))
    recommendations.suggestions.forEach(item => {
      console.log(`   ${COLORS.info('●')} ${item}`)
    })
  }
}

function printScore(summary) {
  const gradeColors = {
    'A': COLORS.success,
    'B': COLORS.success,
    'C': COLORS.warning,
    'D': COLORS.warning,
    'F': COLORS.error
  }

  const gradeColor = gradeColors[summary.grade] || COLORS.info
  
  console.log(`\n${COLORS.header('📊 OVERALL SCORE')}`)
  console.log(`${gradeColor('Grade:')} ${gradeColor.bold(summary.grade)} (${summary.score}/100)`)
  console.log(`${COLORS.subheader('Status:')} ${summary.status}`)
}

async function runQuickDiagnostic() {
  console.log(COLORS.header('\n🔍 Quick Development Environment Diagnostic\n'))
  
  const diagnostic = new DevEnvironmentDiagnostic()
  const startTime = Date.now()

  try {
    // Quick checks
    const nodeVersion = await diagnostic.checkNodeVersion()
    const nextVersion = await diagnostic.checkNextVersion()
    const envVars = await diagnostic.checkEnvironmentVariables()
    const supabase = await diagnostic.checkSupabaseConnection()

    printCheck('Node.js Version', nodeVersion, true)
    printCheck('Next.js Version', nextVersion, true)
    printCheck('Environment Variables', envVars)
    printCheck('Supabase Connection', supabase)

    const elapsedTime = Date.now() - startTime
    console.log(`\n${COLORS.info('⏱️  Completed in')} ${formatTime(elapsedTime)}`)
    
    // Show quick recommendations
    const recs = await diagnostic.getRecommendations()
    if (recs.critical.length > 0) {
      console.log(`\n${COLORS.error('⚠️  Found')} ${recs.critical.length} ${COLORS.error('critical issues')}`)
      recs.critical.forEach(item => console.log(`   ${COLORS.error('●')} ${item}`))
    }

  } catch (error) {
    console.error(COLORS.error('❌ Error running diagnostic:'), error.message)
    process.exit(1)
  }
}

async function runFullDiagnostic() {
  console.log(COLORS.header('\n🔍 Full Development Environment Diagnostic\n'))
  
  const diagnostic = new DevEnvironmentDiagnostic()
  const startTime = Date.now()

  try {
    console.log(COLORS.info('🔄 Running comprehensive diagnostic...'))
    const report = await diagnostic.generateReport()
    
    const elapsedTime = Date.now() - startTime
    console.clear()

    // Header
    printSection('Development Environment Diagnostic Report')
    console.log(`${COLORS.info('📅 Generated:')} ${new Date().toLocaleString()}`)
    console.log(`${COLORS.info('⏱️  Duration:')} ${formatTime(elapsedTime)}`)

    // Overall Score
    printScore(report.summary)

    // Environment Configuration
    printSection('Environment Configuration')
    printCheck('Node.js Version', report.details.nodeVersion, true)
    printCheck('Next.js Version', report.details.nextVersion, true)
    printCheck('Environment Variables', report.details.environmentVariables)
    
    if (report.details.environmentVariables.missing.length > 0) {
      console.log(`   ${COLORS.warning('Missing:')} ${report.details.environmentVariables.missing.join(', ')}`)
    }

    // Dependencies
    printSection('Dependencies')
    printCheck('Dependencies Check', report.details.dependencies)
    if (report.details.dependencies.totalDependencies) {
      console.log(`   ${COLORS.info('Total Dependencies:')} ${report.details.dependencies.totalDependencies}`)
      console.log(`   ${COLORS.success('Installed:')} ${report.details.dependencies.installed.length}`)
      if (report.details.dependencies.missing.length > 0) {
        console.log(`   ${COLORS.error('Missing:')} ${report.details.dependencies.missing.length}`)
        
        // Show conditional dependencies separately
        const conditionalMissing = report.details.dependencies.missing.filter(d => d.type === 'conditional')
        const regularMissing = report.details.dependencies.missing.filter(d => d.type !== 'conditional')
        
        if (conditionalMissing.length > 0) {
          console.log(`   ${COLORS.warning('Conditional Dependencies Missing:')}`)
          conditionalMissing.forEach(dep => {
            console.log(`     ${COLORS.warning('●')} ${dep.name}: ${dep.reason}`)
          })
        }
        
        if (regularMissing.length > 0) {
          console.log(`   ${COLORS.error('Required Dependencies Missing:')}`)
          regularMissing.forEach(dep => {
            console.log(`     ${COLORS.error('●')} ${dep.name}`)
          })
        }
      }
    }

    // Configuration
    printSection('Configuration')
    printCheck('Next.js Config', report.details.nextConfig)
    printCheck('TypeScript Config', report.details.typescriptConfig)
    
    if (report.details.typescriptConfig.strictModeEnabled !== undefined) {
      const strictIcon = report.details.typescriptConfig.strictModeEnabled 
        ? COLORS.success('✅') 
        : COLORS.warning('⚠️ ')
      console.log(`   ${strictIcon} Strict Mode: ${report.details.typescriptConfig.strictModeEnabled ? 'Enabled' : 'Disabled'}`)
    }

    // Database
    printSection('Database')
    printCheck('Supabase Connection', report.details.supabaseConnection)
    if (report.details.supabaseConnection.projectId) {
      console.log(`   ${COLORS.info('Project ID:')} ${report.details.supabaseConnection.projectId}`)
    }
    if (report.details.supabaseConnection.latency) {
      console.log(`   ${COLORS.info('Latency:')} ${report.details.supabaseConnection.latency}ms`)
    }

    // Testing
    printSection('Testing Environment')
    printCheck('Jest Configuration', report.details.jestConfig)
    if (report.details.jestConfig.testEnvironment) {
      console.log(`   ${COLORS.info('Test Environment:')} ${report.details.jestConfig.testEnvironment}`)
    }

    // Performance (if available)
    const performance = await diagnostic.measureBuildPerformance()
    const memory = await diagnostic.checkMemoryUsage()
    
    printSection('Performance Metrics')
    if (performance.buildTime) {
      console.log(`${COLORS.info('🏗️  Build Time:')} ${formatTime(performance.buildTime)}`)
    }
    if (performance.bundleSize) {
      console.log(`${COLORS.info('📦 Bundle Size:')} ${formatBytes(performance.bundleSize)}`)
    }
    console.log(`${COLORS.info('💾 Memory Usage:')} ${formatBytes(memory.used)} (${memory.percentage}%)`)

    // Debugging Tools
    const debugging = await diagnostic.getDebuggingInfo()
    printSection('Debugging Configuration')
    console.log(`${COLORS.info('VS Code Config:')} ${debugging.vsCodeConfig}`)
    console.log(`${COLORS.info('Debug Command:')} ${debugging.inspectCommand}`)

    // Recommendations
    printSection('Recommendations')
    printRecommendations(report.recommendations)

    // Summary
    console.log('\n' + COLORS.header('═'.repeat(60)))
    console.log(COLORS.header('📋 SUMMARY'))
    console.log(COLORS.header('═'.repeat(60)))
    
    const statusColor = report.summary.score >= 80 
      ? COLORS.success 
      : report.summary.score >= 60 
        ? COLORS.warning 
        : COLORS.error

    console.log(`${statusColor('Overall Status:')} ${report.summary.status}`)
    console.log(`${COLORS.info('Total Issues:')} ${report.recommendations.critical.length + report.recommendations.warnings.length}`)
    console.log(`${COLORS.info('Suggestions:')} ${report.recommendations.suggestions.length}`)

    // Exit with appropriate code
    if (report.recommendations.critical.length > 0) {
      console.log(`\n${COLORS.error('❌ Critical issues found. Please address them before continuing.')}`)
      process.exit(1)
    } else {
      console.log(`\n${COLORS.success('✅ Development environment is ready!')}`)
      process.exit(0)
    }

  } catch (error) {
    console.error(COLORS.error('\n❌ Error running diagnostic:'), error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const command = args[0]

switch (command) {
  case 'quick':
  case 'q':
    runQuickDiagnostic()
    break
  case 'full':
  case 'f':
  case undefined:
    runFullDiagnostic()
    break
  case 'help':
  case 'h':
    console.log(`
${COLORS.header('🔍 Dev Environment Diagnostic Tool')}

${COLORS.subheader('Usage:')}
  node scripts/diagnose.js [command]

${COLORS.subheader('Commands:')}
  ${COLORS.info('full, f')}     Run full diagnostic (default)
  ${COLORS.info('quick, q')}    Run quick diagnostic
  ${COLORS.info('help, h')}     Show this help message

${COLORS.subheader('Examples:')}
  ${COLORS.info('npm run diagnose')}        # Run full diagnostic
  ${COLORS.info('npm run diagnose quick')}  # Run quick diagnostic
`)
    break
  default:
    console.error(COLORS.error(`Unknown command: ${command}`))
    console.log('Run with "help" to see available commands')
    process.exit(1)
} 