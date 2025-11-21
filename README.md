# Quantum Drift

Un jeu de course infini en 3D développé avec Next.js, React Three Fiber et WebGL. Pilotez à travers un tunnel néon généré de manière procédurale et évitez les obstacles pour obtenir le meilleur score.

![Quantum Drift Screenshot](/public/screenshot.png)

## 🎮 Fonctionnalités

- **Gameplay Infini** : Un tunnel généré procéduralement qui accélère avec le temps.
- **Graphismes WebGL** : Effets de post-traitement (Bloom, Aberration Chromatique) pour une esthétique Cyberpunk.
- **Classement Global** : Système de score en ligne via Supabase.
- **Mode Bot** : Une IA autonome capable de jouer à votre place.
- **Responsive** : Jouable sur Desktop et Mobile (contrôles tactiles).

## 🛠️ Stack Technique

- **Framework** : [Next.js 15](https://nextjs.org/) (App Router)
- **3D Engine** : [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) (Three.js)
- **Post-Processing** : `@react-three/postprocessing`
- **Styling** : Tailwind CSS
- **Database** : Supabase (pour le leaderboard)
- **Deployment** : Vercel

## 🚀 Installation

1. **Cloner le projet**

   ```bash
   git clone https://github.com/votre-pseudo/quantum-drift.git
   cd quantum-drift
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configuration**
   Créez un fichier `.env.local` à la racine avec vos clés Supabase (optionnel pour le leaderboard) :

   ```env
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
   Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🤝 Contribution

Ce projet est **Open Source** ! N'hésitez pas à proposer des Pull Requests pour améliorer le jeu, ajouter de nouveaux obstacles, ou optimiser les performances.

### Idées d'améliorations

- Nouveaux types d'obstacles
- Power-ups (bouclier, ralentissement)
- Musique et effets sonores
- Skins de vaisseaux

## 👤 Auteur

**Jean-Solopreneur**

- [YouTube](https://www.youtube.com/@Jean-Solopreneur)
- [ProblemSifter](https://www.problemsifter.com/)

---

_Fait avec ❤️ et beaucoup de café._
