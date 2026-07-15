/**
 * Supabase Configurator & Initialization Module
 * 
 * To activate the Supabase backend and Google Sign-in services:
 * 1. Create a Supabase project at supabase.com
 * 2. Run the PostgreSQL schema query (provided in implementation_plan.md) in the SQL Editor
 * 3. Replace the placeholder credentials below with your Supabase URL & Anon Key
 */

const supabaseUrl = "https://afbrznllcfgfcjuinnlf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0";

// Check if Supabase credentials are customized
const isSupabaseCustomized = 
  supabaseUrl && 
  !supabaseUrl.startsWith("YOUR_") && 
  supabaseAnonKey && 
  !supabaseAnonKey.startsWith("YOUR_");

if (isSupabaseCustomized) {
  try {
    // Create the global Supabase client instance
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
    window.supabaseActive = true;
    
    console.log("👑 Shree Rajput Sagai Sambandh: Supabase backend initialized successfully.");
  } catch (error) {
    console.error("Supabase initialization failed:", error);
    window.supabaseActive = false;
  }
} else {
  window.supabaseActive = false;
  console.warn(
    "⚠️ Shree Rajput Sagai Sambandh: Supabase is not configured. Running in LocalStorage Mock mode.\n" +
    "To enable Supabase, customize the credentials in 'js/supabase-config.js'."
  );
}
