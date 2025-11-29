'use server'

import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Helper to sign data
function signData(data: string) {
  if (!supabaseServiceKey) return null
  const hmac = createHmac('sha256', supabaseServiceKey)
  hmac.update(data)
  return hmac.digest('hex')
}

export async function startGameSession() {
  const startTime = Date.now()
  const signature = signData(startTime.toString())
  
  if (!signature) return null
  
  // Return a token combining time and signature
  // Format: timestamp:signature
  return `${startTime}:${signature}`
}

export async function submitScore(pseudo: string, score: number, sessionToken?: string) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase Service Role Key")
    return { success: false, error: "Configuration serveur manquante" }
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Basic Validation
  if (!pseudo || pseudo.length > 15) {
    return { success: false, error: "Pseudo invalide (max 15 chars)" }
  }
  
  if (score < 0 || score > 999999) { 
     return { success: false, error: "Score invalide" }
  }

  // 2. Anti-Cheat Check (Only for high scores > 9999)
  if (score > 9999) {
    if (!sessionToken) {
      return { success: false, error: "Session invalide (anti-cheat)" }
    }

    const [timestampStr, signature] = sessionToken.split(':')
    const startTime = parseInt(timestampStr)
    
    // Verify signature
    const expectedSignature = signData(timestampStr)
    if (signature !== expectedSignature) {
      console.warn(`CHEAT ATTEMPT: Invalid signature for user ${pseudo}`)
      return { success: false, error: "Session corrompue" }
    }

    // Verify duration
    const durationSeconds = (Date.now() - startTime) / 1000
    if (durationSeconds < 5) {
       // Impossible to get >9999 in 5 seconds
       console.warn(`CHEAT ATTEMPT: Impossible speed for user ${pseudo} (Score: ${score}, Time: ${durationSeconds}s)`)
       return { success: false, error: "Anomalie temporelle détectée" }
    }

    // Max theoretical points per second (generous estimate)
    // Let's say max speed multiplier gives ~100 pts/sec
    const pointsPerSecond = score / durationSeconds
    if (pointsPerSecond > 300) { // Very generous limit (300 pts/s)
       console.warn(`CHEAT ATTEMPT: Speedhack for user ${pseudo} (${pointsPerSecond.toFixed(0)} pts/s)`)
       return { success: false, error: "Score impossible (vitesse anormale)" }
    }
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
