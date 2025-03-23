import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a single supabase client for interacting with the database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  global: {
    headers: {
      'x-application-name': 'question-bank',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Add error handling for failed requests
supabase.handleError = (error: any) => {
  console.error('Supabase error:', error);

  // Network errors
  if (error.message?.includes('Failed to fetch')) {
    toast.error('Connection error. Please check your internet connection.');
    return;
  }

  // Authentication errors
  if (error.status === 401) {
    toast.error('Authentication error. Please sign in again.');
    return;
  }

  // Rate limiting
  if (error.status === 429) {
    toast.error('Too many requests. Please try again later.');
    return;
  }

  // Database errors
  if (error.code?.startsWith('22')) {
    toast.error('Invalid data format. Please check your input.');
    return;
  }

  if (error.code?.startsWith('23')) {
    toast.error('Database constraint violation. Please check your data.');
    return;
  }

  // Generic error
  toast.error('An error occurred. Please try again.');
  throw error;
};

// Add connection health check
let isConnected = false;

const checkConnection = async () => {
  try {
    const { error } = await supabase.from('questions').select('id').limit(1);
    isConnected = !error;
    return isConnected;
  } catch (error) {
    isConnected = false;
    console.error('Supabase connection error:', error);
    return false;
  }
};

// Export connection status checker
export const getConnectionStatus = () => isConnected;

// Initial connection check
checkConnection();

// Periodic connection check (every 30 seconds)
setInterval(checkConnection, 30000);