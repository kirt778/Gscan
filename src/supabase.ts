import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// You will find these two keys in your Supabase Dashboard under Settings > API
const supabaseUrl = 'https://ijmpsykjnkmrrovgqqea.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbXBzeWtqbmttcnJvdmdxcWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1OTQyMTEsImV4cCI6MjEwNDE3MDIxMX0.pr6LvUow5a-wHRVzXX7jdNvtAliN9Uca_CI1m93tT-Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false,
  },
});