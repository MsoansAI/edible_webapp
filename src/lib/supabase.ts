import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jfjvqylmjzprnztbfhpa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase 