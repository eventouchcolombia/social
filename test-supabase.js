// Test script to debug Supabase query
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test function
async function testAdminsQuery() {
  console.log("🔍 Testing Supabase connection...");
  
  try {
    // Test 1: Simple count
    const { count: totalCount, error: countError } = await supabase
      .from("admins")
      .select("*", { count: 'exact', head: true });
      
    console.log("📊 Total records in admins table:", totalCount, countError);
    
    // Test 2: Get all records
    const { data: allData, error: allError } = await supabase
      .from("admins")
      .select("*");
      
    console.log("📋 All records:", allData, allError);
    
    // Test 3: Original query from component
    const { data, error, count } = await supabase
      .from("admins")
      .select("id, email, event_slug", { count: 'exact' })
      .order("event_slug", { ascending: true });
      
    console.log("🎯 Component query result:", { data, error, count });
    
  } catch (err) {
    console.error("❌ Test error:", err);
  }
}

// Run test
testAdminsQuery();