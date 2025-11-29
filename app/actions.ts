'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function submitScore(pseudo: string, score: number) {
  // We NEED the Service Role Key to bypass RLS for insertion from the server
  // If we used the Anon key here, we would be subject to the same restrictions as the public client
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase Service Role Key")
    return { success: false, error: "Configuration serveur manquante" }
  }

  // Create an ADMIN client with the Service Role Key
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Validation
  if (!pseudo || pseudo.length > 15) {
    return { success: false, error: "Pseudo invalide (max 15 chars)" }
  }
  
  // Cap max score reasonably to prevent billion-point hacks if someone calls the server action directly
  // Assuming logical max score ~100000 based on gameplay speed
  if (score < 0 || score > 999999) { 
     return { success: false, error: "Score invalide" }
  }

  try {
    const { error } = await supabaseAdmin
      .from('scores')
      .insert([
        { username: pseudo, score: Math.floor(score) }
      ])

    if (error) throw error
    return { success: true }
  } catch (e) {
    console.error("Error submitting score:", e)
    return { success: false, error: "Erreur lors de l'envoi du score" }
  }
}

export async function getLeaderboard() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return []
  }

  // For reading, the Anon key is fine (public read access)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const { data, error } = await supabase
      .from('scores')
      .select('username, score, created_at')
      .order('score', { ascending: false })
      .limit(10)

    if (error) throw error
    return data || []
  } catch (e) {
    console.error("Error fetching leaderboard:", e)
    return []
  }
}
