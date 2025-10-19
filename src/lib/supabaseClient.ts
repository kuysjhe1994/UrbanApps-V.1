import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ktzlpcrepjgdzqvxzbmz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0emxwY3JlcGpnZHpxdnh6Ym16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTUyMjcsImV4cCI6MjA3MjA5MTIyN30.GNrh6CxJnX08Sq4tbjy6W1IKn6DwFvo3hTBeZQv5wRA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
