"use client";

import dynamic from "next/dynamic";
import { useGameStore } from "./store/useGameStore";
import { useEffect, useState } from "react";
import { submitScore, getLeaderboard } from "./actions";

// Dynamic import to avoid SSR issues with WebGL
const GameScene = dynamic(() => import("./components/GameScene"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-cyan-500">
      INITIALISATION DU SYSTÈME...
    </div>
  ),
});

function UI() {
  const {
    score,
    isPlaying,
    isBotMode,
    isGameOver,
    highScore,
    startGame,
    startBotGame,
    reset,
  } = useGameStore();

  const [pseudo, setPseudo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<
    { username: string; score: number }[]
  >([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch leaderboard on game over
  useEffect(() => {
    if (isGameOver) {
      setHasSubmitted(false); // Reset submission state for new game
      getLeaderboard().then((data) => setLeaderboard(data as any));
    }
  }, [isGameOver]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim()) return;

    setIsSubmitting(true);
    setErrorMsg("");

    const result = await submitScore(pseudo, score);

    if (result.success) {
      setHasSubmitted(true);
      // Refresh leaderboard to show new score
      const newData = await getLeaderboard();
      setLeaderboard(newData as any);
    } else {
      setErrorMsg(result.error || "Erreur inconnue");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 font-mono select-none">
      {/* HUD */}
      {isPlaying && !isGameOver && (
        <div className="absolute top-8 left-8 right-8 flex justify-between text-neon-blue animate-pulse">
          <div className="text-2xl font-bold drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]">
            SCORE: {Math.floor(score).toString().padStart(6, "0")}
          </div>
          <div className="text-xl opacity-80">
            {isBotMode ? "PILOTE AUTOMATIQUE" : "SYSTÈME: ONLINE"}
          </div>
        </div>
      )}

      {/* START SCREEN */}
      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto transition-all duration-500">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-purple mb-4 drop-shadow-[0_0_20px_rgba(188,19,254,0.5)] tracking-tighter">
            QUANTUM DRIFT
          </h1>
          <p className="text-neon-blue mb-8 text-lg tracking-[0.5em] uppercase opacity-80">
            Pilotez le Noyau
          </p>
          <button
            onClick={startGame}
            className="group relative px-12 py-4 bg-transparent border border-neon-blue text-neon-blue text-xl font-bold uppercase tracking-wider hover:bg-neon-blue hover:text-black transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,243,255,0.6)] overflow-hidden"
          >
            <span className="relative z-10">Initialiser la Séquence</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
          <div className="mt-12 text-xs md:text-sm text-white/40 max-w-md text-center leading-relaxed px-4">
            INSTRUCTIONS: Glissez (Souris/Doigt) pour esquiver les anomalies.
            <br />
            Le système accélère indéfiniment. Survivez.
          </div>
        </div>
      )}

      {/* GAME OVER / LEADERBOARD */}
      {isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-md pointer-events-auto animate-in fade-in duration-300 overflow-y-auto py-10">
          <div className="relative bg-black/80 border border-white/10 px-12 py-6 rounded-xl min-w-[300px] text-center mb-8 backdrop-blur-md">
            <h2 className="text-5xl md:text-7xl font-black text-neon-pink drop-shadow-[0_0_10px_rgba(255,0,85,0.8)] glitch-text">
              ÉCHEC CRITIQUE
            </h2>
            <div className="absolute inset-0 bg-red-500/5 animate-pulse rounded-xl pointer-events-none"></div>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start mt-4">
            {/* Left Column: Score & Actions */}
            <div className="flex flex-col items-center bg-black/80 border border-white/10 p-8 rounded-xl min-w-[300px] backdrop-blur-md">
              <div className="text-2xl mb-6 text-white font-bold tracking-wider border-b border-white/10 pb-4 w-full text-center">
                SCORE FINAL <br />
                <span className="text-neon-blue text-4xl mt-2 block drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]">
                  {Math.floor(score)}
                </span>
              </div>

              {/* Submit Form */}
              {!hasSubmitted && !isBotMode && (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-2 mb-8 w-64"
                >
                  <input
                    type="text"
                    placeholder="ENTREZ VOTRE PSEUDO"
                    maxLength={15}
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value.toUpperCase())}
                    className="bg-black/50 border border-neon-blue text-white px-4 py-2 text-center focus:outline-none focus:bg-neon-blue/20 placeholder:text-white/30"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !pseudo}
                    className="bg-neon-blue text-black font-bold py-2 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "TRANSMISSION..." : "ENREGISTRER SCORE"}
                  </button>
                  {errorMsg && (
                    <span className="text-red-500 text-xs text-center">
                      {errorMsg}
                    </span>
                  )}
                </form>
              )}

              {hasSubmitted && (
                <div className="text-green-400 mb-8 font-bold tracking-widest">
                  SCORE ENREGISTRÉ
                </div>
              )}

              <div className="flex flex-col gap-4 items-center w-full">
                <button
                  onClick={reset}
                  className="w-full px-10 py-3 bg-neon-pink text-white font-bold uppercase tracking-widest hover:bg-white hover:text-neon-pink transition-colors duration-300 shadow-[0_0_20px_rgba(255,0,85,0.4)]"
                >
                  Redémarrer
                </button>

                <button
                  onClick={startBotGame}
                  className="text-sm text-neon-blue hover:text-white uppercase tracking-widest border-b border-transparent hover:border-white transition-all duration-300 opacity-70 hover:opacity-100"
                >
                  [ Mode Bot ]
                </button>
              </div>
            </div>

            {/* Right Column: Leaderboard */}
            <div className="bg-black/80 border border-white/10 p-6 rounded-xl min-w-[300px] max-w-[90vw] backdrop-blur-md">
              <h3 className="text-neon-purple text-xl font-bold mb-4 tracking-widest text-center border-b border-neon-purple/30 pb-2">
                CLASSEMENT GLOBAL
              </h3>
              {leaderboard.length === 0 ? (
                <div className="text-center text-white/40 py-4 italic">
                  Aucune donnée ou DB non connectée
                </div>
              ) : (
                <ul className="space-y-2">
                  {leaderboard.map((entry, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-white/60 w-6">{i + 1}.</span>
                      <span className="text-white font-bold truncate max-w-[120px]">
                        {entry.username}
                      </span>
                      <span className="text-neon-blue ml-auto">
                        {entry.score}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-6 p-6 z-50 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 max-w-lg w-full mx-4">
            <a
              href="https://www.youtube.com/@Jean-Solopreneur"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-4 px-5 py-3 bg-[#0f0f0f] hover:bg-[#1a1a1a] border border-white/10 hover:border-red-600/50 rounded-xl transition-all duration-300 w-full max-w-sm"
            >
              {/* Profile Picture */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 group-hover:border-red-600 transition-colors duration-300 shadow-xl">
                  <img
                    src="/pdp YT 6.png"
                    alt="Jean-Solopreneur"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-col items-start gap-1 w-full">
                {/* Header: YT Logo + Name */}
                <div className="flex items-center gap-2">
                  <div className="bg-white rounded-full p-1 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-3.5 h-3.5 fill-[#FF0000]"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                  <span className="font-black tracking-wider text-sm text-white group-hover:text-white transition-colors truncate">
                    JEAN-SOLOPRENEUR
                  </span>
                </div>
              </div>
            </a>

            <div className="w-full h-px bg-white/10"></div>

            <div className="flex flex-col items-center gap-4">
              <p className="text-white/70 text-xs uppercase tracking-widest text-center leading-relaxed">
                En recherche d'idées de projet à créer basés sur de vrais
                retours utilisateurs ?
              </p>
              <a
                href="https://www.problemsifter.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:brightness-125 transition-all duration-300 transform hover:scale-105"
              >
                <img
                  src="/logoAndNameProblemSifter.svg"
                  alt="ProblemSifter"
                  className="h-12 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 scanlines opacity-20 pointer-events-none mix-blend-overlay"></div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="w-full h-[100dvh] bg-black relative overflow-hidden">
      <GameScene />
      <UI />
    </main>
  );
}
