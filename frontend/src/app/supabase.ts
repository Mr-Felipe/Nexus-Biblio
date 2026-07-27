import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://yedsibiotgjcwkhorifr.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHNpYmlvdGdqY3draG9yaWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MjM3NjIsImV4cCI6MjA5OTI5OTc2Mn0.G_vLOvom0TU0q82WKEfJRUk9xS_-wCFVfThzfJBN7bI';

export const supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
