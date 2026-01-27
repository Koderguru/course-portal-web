
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dlycdtzkyrxxyseaxxtx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRseWNkdHpreXJ4eXlzZWF4eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MTMwNzcsImV4cCI6MjA4NTA4OTA3N30.K3usA4MwUQZzP8j8pcnit4ayicdZGnDXLp6SWv0iVZw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
