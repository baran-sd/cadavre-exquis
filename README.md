# Cadavre Exquis AI

Cadavre Exquis AI is a surrealist, AI-powered interactive web application inspired by the traditional "Exquisite Corpse" parlor game. It allows users to generate visually coherent, yet highly surreal characters by specifying prompts for different body zones.

🌐 **Live Demo:** [https://baran-sd.github.io/cadavre-exquis/](https://baran-sd.github.io/cadavre-exquis/)

## 🎨 Features
- **Zone-Based Generation**: Design a character by separately describing their head, torso, and legs.
- **Atmospheric Moods**: Apply global styles like Dreamy, Nightmarish, Mechanical, or Ethereal to unify the aesthetic of your character.
- **Iterative Refinement**: Easily refine specific zones using AI editing capabilities without losing the stylistic coherence of the rest of the image.
- **Surrealist Art Aesthetic**: Emulates 1920s surrealist oil paintings and charcoal sketches.
- **Downloadable Art**: Preserve and download your newly created masterpiece directly from the UI.

## 🛠 Tech Stack
- **Frontend**: React.js 19, Vite
- **Styling & Animation**: Tailwind CSS v4, Framer Motion, Lucide Icons
- **AI Generation API**: Pollinations AI (utilizing `flux` for rendering and `klein` for iterative editing)

## 🚀 Getting Started

### Prerequisites
- Node.js installed

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/baran-sd/cadavre-exquis.git
   cd cadavre-exquis
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   The project requires an API Key for Pollinations AI endpoints. The repository comes with a public key configured internally for GitHub Pages. For local usage, create a `.env` file:
   ```env
   VITE_POLLEN_API_KEY="your_api_key_here"
   ```

4. **Run the application:**
   ```bash
   npm run dev
   ```

## 🏗 Deployment (GitHub Pages)

The `vite.config.ts` is already configured with `base: '/cadavre-exquis/'`.

To manually deploy it, simply run:
```bash
npm run build
```
Then upload or push the configured `dist/` directory to the `gh-pages` branch depending on your preferred Git workflow, or set up a standard GitHub Actions workflow for Vite projects.

## 🖼 Background
Traditional *Cadavre Exquis* often results in totally disjointed figures due to artists not seeing what others drew. This modern AI version maintains anatomical and stylistic consistency while retaining strange, dream-like combinations, bridging classic surrealism with prompt-based generation.
