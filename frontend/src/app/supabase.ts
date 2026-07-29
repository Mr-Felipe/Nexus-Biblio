import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ydhvtuaomppbhcmcpedr.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkaHZ0dWFvbXBwYmhjbWNwZWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTI5MDIsImV4cCI6MjEwMDg2ODkwMn0.L14HrToKrNkAnsyLw_QUKdNK4Qah5fkP0m_LTtZsVS8';

export const supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
