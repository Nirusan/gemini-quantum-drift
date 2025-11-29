import { create } from 'zustand'

interface GameState {
  isPlaying: boolean
  isBotMode: boolean
  isGameOver: boolean
  score: number
  speed: number
  highScore: number
  sessionToken: string | null // Anti-cheat token
  setSessionToken: (token: string) => void
  startGame: () => void
  startBotGame: () => void
  endGame: () => void
  increaseScore: (amount?: number) => void
  increaseSpeed: () => void
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  isPlaying: false,
  isBotMode: false,
  isGameOver: false,
  score: 0,
  speed: 0.8, // Base speed increased from 0.5
  highScore: 0,
  sessionToken: null,
  setSessionToken: (token) => set({ sessionToken: token }),
  startGame: () => set({ isPlaying: true, isGameOver: false, score: 0, speed: 0.8, isBotMode: false }),
  startBotGame: () => set({ isPlaying: true, isGameOver: false, score: 0, speed: 0.8, isBotMode: true }),
  endGame: () => set((state) => ({ 
    isPlaying: false, 
    isGameOver: true,
    highScore: Math.max(state.score, state.highScore) 
  })),
  increaseScore: (amount = 1) => set((state) => ({ score: state.score + amount })),
  increaseSpeed: () => set((state) => ({ speed: state.speed + 0.001 })), // Gradual acceleration
  reset: () => set({ isPlaying: false, isGameOver: false, score: 0, speed: 0.8, isBotMode: false, sessionToken: null }),
}))
