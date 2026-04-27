import { createClient } from '@supabase/supabase-js'

// Supabase anon key is safe to expose — access is controlled by RLS policies
const supabaseUrl = 'https://hqwkgztoclmmzsqkoknk.supabase.co'
const supabaseAnonKey = 'sb_publishable_cMESq7mkCn3k7CCyt56TFA_9lyVDOCs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
