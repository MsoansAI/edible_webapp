import { NextResponse } from 'next/server'
import { DevEnvironmentDiagnostic } from '@/lib/dev-diagnostic'

export async function GET() {
  try {
    const diagnostic = new DevEnvironmentDiagnostic()
    const report = await diagnostic.generateReport()
    
    return NextResponse.json(report)
  } catch (error) {
    console.error('Diagnostic API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to run diagnostic',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 