import { supabase } from "./supabaseClient";

export async function testSupabaseConnection() {
  const { data, error } = await supabase.from("projects").select("*").limit(5);

  if (error) {
    console.error("Supabase connection error:", error);
    return;
  }

  console.log("Supabase connected successfully:", data);
}
