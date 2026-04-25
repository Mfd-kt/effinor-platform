// @effinor/lib
// Utilitaires partagés Effinor

// ============================================
// Supabase
// ============================================
export { createSupabaseBrowserClient } from './supabase/browser-client'
export { supabaseConfigFromEnv } from './supabase/config'
export type { SupabaseBrowserConfig } from './supabase/types'

// ============================================
// Formatters
// ============================================
export { formatEuro } from './formatters/currency'
export { formatDate } from './formatters/date'
export { formatPhoneE164, formatPhoneDisplay } from './formatters/phone'

// ============================================
// Validators
// ============================================
export { isValidEmail } from './validators/email'

// ============================================
// Strings
// ============================================
export { slugify } from './strings/slugify'

// Note : cn() a été retiré de @effinor/lib.
// Il est maintenant dans @effinor/design-system (avec tailwind-merge en plus).
