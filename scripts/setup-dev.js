#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * Automated setup and verification of the development environment
 */

import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
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

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  const prefix = COLORS[type](`[${timestamp}]`)
  console.log(`${prefix} ${message}`)
}

function execCommand(command, options = {}) {
  try {
    log(`Running: ${command}`, 'info')
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      ...options 
    })
    return { success: true, result }
  } catch (error) {
    log(`Command failed: ${error.message}`, 'error')
    return { success: false, error }
  }
}

async function checkNodeVersion() {
  log('Checking Node.js version...', 'info')
  const diagnostic = new DevEnvironmentDiagnostic()
  const result = await diagnostic.checkNodeVersion()
  
  if (result.isSupported) {
    log(`✅ Node.js ${result.version} is supported`, 'success')
    return true
  } else {
    log(`❌ Node.js ${result.version} is not supported. Please upgrade to Node.js 18+`, 'error')
    return false
  }
}

async function installDependencies() {
  log('Installing dependencies...', 'info')
  
  // Check if node_modules exists
  try {
    await fs.access('node_modules')
    log('Dependencies already installed, checking for updates...', 'info')
  } catch {
    log('Installing dependencies for the first time...', 'info')
  }
  
  const npmInstall = execCommand('npm install')
  if (!npmInstall.success) {
    log('Failed to install dependencies', 'error')
    return false
  }
  
  log('✅ Dependencies installed successfully', 'success')
  return true
}

async function checkEnvironmentVariables() {
  log('Checking environment variables...', 'info')
  
  const envFile = '.env.local'
  const exampleEnvFile = '.env.example'
  
  try {
    await fs.access(envFile)
    log('✅ Environment file exists', 'success')
  } catch {
    log('❌ .env.local not found', 'warning')
    
    // Check if example exists
    try {
      await fs.access(exampleEnvFile)
      log('📋 Found .env.example, copying to .env.local...', 'info')
      const exampleContent = await fs.readFile(exampleEnvFile, 'utf8')
      await fs.writeFile(envFile, exampleContent)
      log('✅ Created .env.local from example', 'success')
      log('⚠️  Please update the environment variables with your actual values', 'warning')
    } catch {
      log('Creating basic .env.local template...', 'info')
      const template = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NODE_ENV=development
`
      await fs.writeFile(envFile, template)
      log('✅ Created .env.local template', 'success')
      log('⚠️  Please update the environment variables with your actual values', 'warning')
    }
  }
  
  return true
}

async function setupVSCodeConfig() {
  log('Setting up VS Code configuration...', 'info')
  
  try {
    await fs.access('.vscode')
    log('✅ VS Code configuration already exists', 'success')
  } catch {
    log('VS Code configuration already set up by previous steps', 'info')
  }
  
  // Check for extensions recommendations
  const extensionsFile = '.vscode/extensions.json'
  try {
    await fs.access(extensionsFile)
    log('✅ VS Code extensions recommendations exist', 'success')
  } catch {
    log('Creating VS Code extensions recommendations...', 'info')
    const extensions = {
      recommendations: [
        'bradlc.vscode-tailwindcss',
        'esbenp.prettier-vscode',
        'ms-vscode.vscode-typescript-next',
        'ms-vscode.vscode-json',
        'formulahendry.auto-rename-tag',
        'christian-kohler.path-intellisense',
        'ms-vscode.vscode-jest',
        'firefox-devtools.vscode-firefox-debug',
        'ms-vscode.js-debug'
      ]
    }
    
    await fs.writeFile(extensionsFile, JSON.stringify(extensions, null, 2))
    log('✅ Created VS Code extensions recommendations', 'success')
  }
  
  return true
}

async function runInitialBuild() {
  log('Running initial build check...', 'info')
  
  const typeCheck = execCommand('npm run type-check')
  if (!typeCheck.success) {
    log('⚠️  TypeScript type checking failed', 'warning')
    log('This is expected if environment variables are not set up yet', 'info')
  } else {
    log('✅ TypeScript type checking passed', 'success')
  }
  
  return true
}

async function runDiagnostic() {
  log('Running environment diagnostic...', 'info')
  
  const diagnostic = new DevEnvironmentDiagnostic()
  const report = await diagnostic.generateReport()
  
  console.log('\n' + COLORS.header('📊 SETUP SUMMARY'))
  console.log(COLORS.header('═'.repeat(50)))
  
  const gradeColors = {
    'A': COLORS.success,
    'B': COLORS.success,
    'C': COLORS.warning,
    'D': COLORS.warning,
    'F': COLORS.error
  }
  
  const gradeColor = gradeColors[report.summary.grade] || COLORS.info
  console.log(`Grade: ${gradeColor(report.summary.grade)} (${report.summary.score}/100)`)
  console.log(`Status: ${report.summary.status}`)
  
  if (report.recommendations.critical.length > 0) {
    console.log(`\n${COLORS.error('🚨 CRITICAL ISSUES:')}`)
    report.recommendations.critical.forEach(item => {
      console.log(`   ${COLORS.error('●')} ${item}`)
    })
  }
  
  if (report.recommendations.warnings.length > 0) {
    console.log(`\n${COLORS.warning('⚠️  WARNINGS:')}`)
    report.recommendations.warnings.forEach(item => {
      console.log(`   ${COLORS.warning('●')} ${item}`)
    })
  }
  
  return report.summary.score >= 60
}

async function printNextSteps() {
  console.log('\n' + COLORS.header('🚀 NEXT STEPS'))
  console.log(COLORS.header('═'.repeat(50)))
  
  console.log(`${COLORS.info('1.')} Update your .env.local file with actual Supabase credentials`)
  console.log(`${COLORS.info('2.')} Run ${COLORS.success('npm run dev')} to start the development server`)
  console.log(`${COLORS.info('3.')} Run ${COLORS.success('npm run diagnose')} to check your environment anytime`)
  console.log(`${COLORS.info('4.')} Use ${COLORS.success('npm run dev:debug')} for debugging with Chrome DevTools`)
  console.log(`${COLORS.info('5.')} Press ${COLORS.success('Ctrl+Shift+D')} in VS Code to access debugging configurations`)
  
  console.log(`\n${COLORS.header('📚 USEFUL COMMANDS:')}`)
  console.log(`${COLORS.success('npm run diagnose')}        - Run full environment diagnostic`)
  console.log(`${COLORS.success('npm run diagnose quick')}  - Run quick diagnostic`)
  console.log(`${COLORS.success('npm run test')}           - Run tests`)
  console.log(`${COLORS.success('npm run test:coverage')}  - Run tests with coverage`)
  console.log(`${COLORS.success('npm run lint')}           - Check code style`)
  console.log(`${COLORS.success('npm run type-check')}     - Check TypeScript types`)
}

async function main() {
  console.log(COLORS.header('\n🛠️  Setting up Development Environment\n'))
  
  try {
    // Step 1: Check Node.js version
    const nodeOk = await checkNodeVersion()
    if (!nodeOk) {
      process.exit(1)
    }
    
    // Step 2: Install dependencies
    const depsOk = await installDependencies()
    if (!depsOk) {
      process.exit(1)
    }
    
    // Step 3: Setup environment variables
    await checkEnvironmentVariables()
    
    // Step 4: Setup VS Code
    await setupVSCodeConfig()
    
    // Step 5: Run initial checks
    await runInitialBuild()
    
    // Step 6: Run diagnostic
    const diagnosticOk = await runDiagnostic()
    
    // Step 7: Show next steps
    await printNextSteps()
    
    if (diagnosticOk) {
      log('\n✅ Development environment setup completed successfully!', 'success')
      process.exit(0)
    } else {
      log('\n⚠️  Development environment setup completed with warnings', 'warning')
      log('Please address the issues above before continuing', 'warning')
      process.exit(0)
    }
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'error')
    console.error(error.stack)
    process.exit(1)
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n🛑 Setup interrupted by user', 'warning')
  process.exit(1)
})

// Run the setup
main() 