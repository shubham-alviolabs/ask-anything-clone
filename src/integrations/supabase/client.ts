
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = "https://kjuziamuiiypucmwvrcd.supabase.co"
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdXppYW11aWl5cHVjbXd2cmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjMzMTEsImV4cCI6MjA2Mjg5OTMxMX0.wPjjGF0-dwzZUUa7boyzMZClFGw2fJ0Xw75YcSjJTZk"

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
