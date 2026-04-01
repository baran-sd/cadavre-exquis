import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Download, Info, Layers, Wind, Ghost, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { generateFullCharacter, editCharacterPart, Zone } from "./lib/gemini";

interface PartState {
  prompt: string;
}

const ATMOSPHERES = [
  { id: "dreamy", label: "Dreamy", icon: Wind, color: "from-blue-900/40 to-purple-900/40" },
  { id: "nightmarish", label: "Nightmarish", icon: Ghost, color: "from-red-900/40 to-black/40" },
  { id: "mechanical", label: "Mechanical", icon: Zap, color: "from-amber-900/40 to-zinc-900/40" },
  { id: "ethereal", label: "Ethereal", icon: Sparkles, color: "from-teal-900/40 to-indigo-900/40" },
];

export default function App() {
  const [parts, setParts] = useState<Record<Zone, PartState>>({
    head: { prompt: "" },
    torso: { prompt: "" },
    legs: { prompt: "" },
  });
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingZone, setLoadingZone] = useState<Zone | null>(null);
  const [atmosphere, setAtmosphere] = useState(ATMOSPHERES[0]);
  const [showInfo, setShowInfo] = useState(false);
  const [activeZone, setActiveZone] = useState<Zone>("head");

  const generateAll = async () => {
    setLoading(true);
    try {
      const image = await generateFullCharacter({
        headPrompt: parts.head.prompt,
        torsoPrompt: parts.torso.prompt,
        legsPrompt: parts.legs.prompt,
        atmosphere: atmosphere.label,
      });
      setFullImage(image);
    } catch (error) {
      console.error("Failed to generate full character:", error);
    } finally {
      setLoading(false);
    }
  };

  const editPart = async (zone: Zone) => {
    if (!fullImage) {
      generateAll();
      return;
    }
    setLoadingZone(zone);
    try {
      const image = await editCharacterPart({
        headPrompt: parts.head.prompt,
        torsoPrompt: parts.torso.prompt,
        legsPrompt: parts.legs.prompt,
        atmosphere: atmosphere.label,
        baseImage: fullImage,
        zoneToEdit: zone,
      });
      if (image) setFullImage(image);
    } catch (error) {
      console.error(`Failed to edit ${zone}:`, error);
    } finally {
      setLoadingZone(null);
    }
  };

  const clearAll = () => {
    setParts({
      head: { prompt: "" },
      torso: { prompt: "" },
      legs: { prompt: "" },
    });
    setFullImage(null);
  };

  const setRandomPrompts = () => {
    const headPrompts = ["A mechanical owl with clockwork eyes", "A nebula-filled glass head", "A crown of floating obsidian shards", "A porcelain mask with ivy growing through it"];
    const torsoPrompts = ["A suit made of living butterflies", "A ribcage containing a miniature galaxy", "A torso of carved driftwood and emeralds", "A clockwork heart visible through a glass chest"];
    const legsPrompts = ["Legs made of swirling smoke and light", "Tentacles of deep-sea bioluminescence", "Stilts made of ancient ivory and gold", "Roots that merge into the earth"];
    
    setParts({
      head: { prompt: headPrompts[Math.floor(Math.random() * headPrompts.length)] },
      torso: { prompt: torsoPrompts[Math.floor(Math.random() * torsoPrompts.length)] },
      legs: { prompt: legsPrompts[Math.floor(Math.random() * legsPrompts.length)] },
    });
  };

  const downloadComposition = () => {
    if (!fullImage) return;
    const link = document.createElement('a');
    link.href = fullImage;
    link.download = 'cadavre-exquis.png';
    link.click();
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-start p-4 md:p-8">
      <div className="atmosphere" />
      <div className="grain" />

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-8 z-10">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter text-mystic-gold">
            Cadavre Exquis
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] opacity-50 font-sans">
            Consistent AI Surrealism
          </p>
        </div>
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="p-3 glass rounded-full hover:bg-white/10 transition-colors"
        >
          <Info className="w-5 h-5" />
        </button>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">
        
        {/* Left Panel: Controls */}
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          <section className="glass p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-mystic-gold" />
              <h2 className="text-sm uppercase tracking-widest font-semibold opacity-70">Atmosphere</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ATMOSPHERES.map((atmo) => (
                <button
                  key={atmo.id}
                  onClick={() => setAtmosphere(atmo)}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all border ${
                    atmosphere.id === atmo.id 
                      ? "bg-white/10 border-mystic-gold text-mystic-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]" 
                      : "bg-white/5 border-transparent hover:bg-white/10"
                  }`}
                >
                  <atmo.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{atmo.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="glass p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-mystic-gold" />
              <h2 className="text-sm uppercase tracking-widest font-semibold opacity-70">Segments</h2>
            </div>
            
            <div className="space-y-4">
              {(["head", "torso", "legs"] as Zone[]).map((zone) => (
                <div key={zone} className={`p-4 rounded-2xl border transition-all ${activeZone === zone ? "bg-white/10 border-white/20" : "bg-transparent border-transparent"}`}>
                  <div className="flex justify-between items-center mb-3">
                    <button 
                      onClick={() => setActiveZone(zone)}
                      className="text-lg font-serif capitalize italic hover:text-mystic-gold transition-colors"
                    >
                      {zone}
                    </button>
                    <button
                      onClick={() => editPart(zone)}
                      disabled={loading || !!loadingZone}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all ${
                        fullImage 
                          ? "bg-mystic-gold/20 text-mystic-gold hover:bg-mystic-gold/30" 
                          : "bg-white/5 text-white/40 hover:bg-white/10"
                      } disabled:opacity-30`}
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingZone === zone ? "animate-spin" : ""}`} />
                      {fullImage ? "Refine" : "Start Here"}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder={`Describe the ${zone}...`}
                    value={parts[zone].prompt}
                    onChange={(e) => setParts(prev => ({ ...prev, [zone]: { ...prev[zone], prompt: e.target.value } }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-mystic-gold transition-colors"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={setRandomPrompts}
                className="flex-1 py-3 glass rounded-2xl hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
              >
                Randomize
              </button>
              <button
                onClick={clearAll}
                className="flex-1 py-3 glass rounded-2xl hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
              >
                Clear
              </button>
            </div>

            <button
              onClick={generateAll}
              disabled={loading}
              className="w-full py-4 bg-mystic-gold text-black font-bold rounded-2xl hover:bg-yellow-500 transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {fullImage ? "REGENERATE ALL" : "CONJURE CHARACTER"}
            </button>
          </section>

          <button
            onClick={downloadComposition}
            disabled={!fullImage}
            className="w-full py-4 glass rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <Download className="w-5 h-5" />
            PRESERVE MASTERPIECE
          </button>
        </div>

        {/* Center: Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center order-1 lg:order-2">
          <div className="relative w-full max-w-[450px] aspect-[9/16] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[40px] overflow-hidden border border-white/10 group bg-zinc-900/20">
            
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-20"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-mystic-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-lg font-serif italic tracking-widest animate-pulse text-mystic-gold">Manifesting Character...</p>
                  </div>
                </motion.div>
              ) : loadingZone ? (
                <motion.div 
                  key="loading-zone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-mystic-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-serif italic tracking-widest animate-pulse">Refining {loadingZone}...</p>
                  </div>
                </motion.div>
              ) : fullImage ? (
                <motion.img
                  key="image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={fullImage}
                  alt="Surrealist Character"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <motion.div 
                  key="placeholder"
                  className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="opacity-20">
                    <Ghost className="w-24 h-24 mx-auto mb-6" />
                    <h3 className="text-2xl font-serif italic mb-2">The Void Awaits</h3>
                    <p className="text-xs uppercase tracking-[0.3em] max-w-xs mx-auto">
                      Define the head, torso, and legs to summon a consistent surrealist entity.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive Zones Overlay with Navigation Buttons */}
            {fullImage && !loading && (
              <div className="absolute inset-0 flex flex-col z-10">
                {(["head", "torso", "legs"] as Zone[]).map((zone) => (
                  <div 
                    key={zone}
                    className={`flex-1 relative group/zone transition-colors ${activeZone === zone ? "bg-white/5" : "hover:bg-white/5"}`}
                    onClick={() => setActiveZone(zone)}
                  >
                    {/* Left Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        editPart(zone);
                      }}
                      disabled={!!loadingZone}
                      className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full opacity-0 group-hover/zone:opacity-100 transition-all hover:text-mystic-gold disabled:opacity-30 ${loadingZone === zone ? "animate-pulse" : ""}`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Right Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        editPart(zone);
                      }}
                      disabled={!!loadingZone}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full opacity-0 group-hover/zone:opacity-100 transition-all hover:text-mystic-gold disabled:opacity-30 ${loadingZone === zone ? "animate-pulse" : ""}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Zone Label Indicator */}
                    <div className={`absolute left-1/2 -translate-x-1/2 top-2 px-3 py-1 rounded-full text-[8px] uppercase tracking-[0.3em] glass opacity-0 group-hover/zone:opacity-100 transition-opacity pointer-events-none ${activeZone === zone ? "text-mystic-gold border-mystic-gold/30" : "text-white/40"}`}>
                      {zone}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Decorative Frame */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-black/20 rounded-[40px]" />
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]" />
          </div>
        </div>
      </main>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass max-w-2xl p-8 md:p-12 rounded-[40px] relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-mystic-gold/10 blur-3xl rounded-full -mr-16 -mt-16" />
              <h2 className="text-4xl font-serif italic mb-6 text-mystic-gold">Consistent Exquisite Corpse</h2>
              <div className="space-y-4 text-sm md:text-base leading-relaxed opacity-80 font-light">
                <p>
                  Traditional <span className="italic font-serif text-lg">Cadavre Exquis</span> often results in disjointed figures. 
                  This version uses AI to maintain <span className="text-mystic-gold font-medium">anatomical and stylistic consistency</span>.
                </p>
                <p>
                  1. **Conjure**: Enter prompts for all zones and generate a full, unified character.<br/>
                  2. **Refine**: Use the refresh icon on a specific zone to modify only that part of the existing image.<br/>
                  3. **Atmosphere**: Change the mood to shift the entire character's stylistic direction.
                </p>
                <p>
                  The AI uses the current image as context when you refine a zone, ensuring the new part fits perfectly with the rest of the body.
                </p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-all"
              >
                Return to the Dream
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-auto py-8 text-[10px] uppercase tracking-[0.4em] opacity-30 font-sans z-10">
        Manifested with Gemini AI &bull; 1925 - 2026
      </footer>
    </div>
  );
}
