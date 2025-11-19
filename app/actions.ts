'use server'

import { createClient } from '@supabase/supabase-js'

// Initialize server-side client (can use Service Role key if needed for admin tasks, but Anon is fine for this)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function submitScore(pseudo: string, score: number) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: "Base de données non configurée" }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Basic validation
  if (!pseudo || pseudo.length > 15) {
    return { success: false, error: "Pseudo invalide (max 15 chars)" }
  }

  try {
    const { error } = await supabase
      .from('scores')
      .insert([
        { username: pseudo, score: Math.floor(score) } // Ensure integer
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

