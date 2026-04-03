import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Download, Info, Layers, Wind, Ghost, Zap, ChevronLeft, ChevronRight, Clock, X, Key, Wifi, ExternalLink, Coins, CreditCard } from "lucide-react";
import { generateFullCharacter, editCharacterPart, Zone } from "./lib/gemini";

interface PartState {
  prompt: string;
}

interface HistoryItem {
  id: string;
  image: string;
  parts: Record<Zone, PartState>;
  atmosphere: typeof ATMOSPHERES[0];
  timestamp: number;
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
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeZone, setActiveZone] = useState<Zone>("head");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("pollinations_api_key") || "");
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem("pollinations_api_key"));
  const [welcomeApiKey, setWelcomeApiKey] = useState("");
  const [rememberKey, setRememberKey] = useState(true);
  const [canvasKey, setCanvasKey] = useState(0);
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);
  const [generationCount, setGenerationCount] = useState(() => {
    const saved = localStorage.getItem("generation_count");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Track generations
  useEffect(() => {
    if (loading && !loadingZone) {
      // Full generation starting
      setGenerationCount(prev => {
        const newCount = prev + 1;
        localStorage.setItem("generation_count", newCount.toString());
        return newCount;
      });
    }
  }, [loading]);

  // Fetch balance from Pollinations API
  const fetchBalance = useCallback(async () => {
    if (!apiKey) {
      setBalance(null);
      return;
    }
    
    setLoadingBalance(true);
    try {
      let balanceData = null;
      
      // Try enter.pollinations.ai account endpoint (official dashboard)
      try {
        const response = await fetch("https://enter.pollinations.ai/api/account", {
          headers: {
            "Authorization": `Bearer ${apiKey}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Common response fields: balance, credits, remaining_credits, usage
          balanceData = data.balance ?? data.credits ?? data.remaining_credits ?? data.usage?.remaining ?? null;
        }
      } catch (e) {
        console.log("Enter account endpoint failed, trying api.pollinations.ai...");
      }
      
      // If first attempt failed, try alternative endpoints
      if (balanceData === null) {
        try {
          const response = await fetch("https://api.pollinations.ai/account", {
            headers: {
              "Authorization": `Bearer ${apiKey}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            balanceData = data.balance ?? data.credits ?? data.remaining_credits ?? 0;
          }
        } catch (e) {
          console.log("API account endpoint also failed");
        }
      }
      
      // Last fallback - try balance endpoint
      if (balanceData === null) {
        try {
          const response = await fetch("https://gen.pollinations.ai/balance", {
            headers: {
              "Authorization": `Bearer ${apiKey}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            balanceData = data.balance ?? data.credits ?? 0;
          }
        } catch (e) {
          console.log("Balance endpoint failed");
        }
      }
      
      // Show balance only if it's a valid number
      if (balanceData !== null && balanceData !== undefined) {
        setBalance(balanceData);
      } else {
        setBalance(null); // Will show generation counter instead
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  }, [apiKey]);

  // Fetch balance when API key changes
  useEffect(() => {
    if (apiKey) {
      fetchBalance();
      // Refresh balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [apiKey, fetchBalance]);

  useEffect(() => {
    if (apiKey && rememberKey) {
      localStorage.setItem("pollinations_api_key", apiKey);
    } else if (!rememberKey) {
      localStorage.removeItem("pollinations_api_key");
    }
  }, [apiKey, rememberKey]);

  const addToHistory = (image: string, currentParts: Record<Zone, PartState>, currentAtmo: typeof ATMOSPHERES[0]) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      image,
      parts: JSON.parse(JSON.stringify(currentParts)),
      atmosphere: currentAtmo,
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev].slice(0, 10));
  };

  const restoreHistory = (item: HistoryItem) => {
    setFullImage(item.image);
    setParts(item.parts);
    setAtmosphere(item.atmosphere);
    setShowHistory(false);
  };

  const generateAll = async () => {
    setLoading(true);
    try {
      const image = await generateFullCharacter({
        headPrompt: parts.head.prompt,
        torsoPrompt: parts.torso.prompt,
        legsPrompt: parts.legs.prompt,
        atmosphere: atmosphere.label,
        customApiKey: apiKey,
      });
      if (image) {
        setFullImage(image);
        setCanvasKey(prev => prev + 1);
        addToHistory(image, parts, atmosphere);
      }
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
        customApiKey: apiKey,
        seed: Math.floor(Math.random() * 999999)
      });
      if (image) {
        setFullImage(image);
        addToHistory(image, parts, atmosphere);
      }
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

  const handleConnect = () => {
    const trimmedKey = welcomeApiKey.trim();
    if (trimmedKey) {
      setApiKey(trimmedKey);
      if (rememberKey) {
        localStorage.setItem("pollinations_api_key", trimmedKey);
      }
    }
    setShowWelcome(false);
    sessionStorage.setItem("welcome_dismissed", "true");
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-start p-4 md:p-8 bg-zinc-950 text-white selection:bg-mystic-gold/30">
      <div className="atmosphere pointer-events-none" />
      <div className="grain pointer-events-none" />

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
        <div className="flex items-center gap-3">
          {/* Balance Display */}
          {balance !== null ? (
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-full border border-white/10" title="Pollinations Balance">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">{balance}</span>
              <span className="text-[10px] opacity-40 uppercase tracking-wider">Credits</span>
              {loadingBalance && <RefreshCw className="w-3 h-3 animate-spin text-mystic-gold/50" />}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-full border border-white/10" title="Generations Count">
              <Coins className="w-4 h-4 text-mystic-gold" />
              <span className="text-sm font-medium text-mystic-gold">{generationCount}</span>
              <span className="text-[10px] opacity-40 uppercase tracking-wider">Generations</span>
            </div>
          )}
          
          <button 
            onClick={() => setShowWelcome(true)}
            className={`p-3 glass rounded-full hover:bg-white/10 transition-colors ${apiKey ? "text-emerald-400" : "text-mystic-gold hover:text-white"}`}
            title="Connection Settings"
          >
            <Wifi className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-3 glass rounded-full hover:bg-white/10 transition-colors ${showHistory ? "text-mystic-gold bg-white/10" : ""}`}
            title="History"
          >
            <Clock className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="p-3 glass rounded-full hover:bg-white/10 transition-colors"
            title="Information"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10 flex-1">
        
        {/* Left Panel: Controls */}
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          <section className="glass p-6 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-mystic-gold" />
              <h2 className="text-sm uppercase tracking-widest font-semibold opacity-70">Atmosphere</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ATMOSPHERES.map((atmo) => {
                const IconComp = atmo.icon;
                return (
                  <button
                    key={atmo.id}
                    onClick={() => setAtmosphere(atmo)}
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all border ${
                      atmosphere.id === atmo.id 
                        ? "bg-white/10 border-mystic-gold text-mystic-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]" 
                        : "bg-white/5 border-transparent hover:bg-white/10"
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span className="text-sm font-medium">{atmo.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="glass p-6 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-mystic-gold" />
              <h2 className="text-sm uppercase tracking-widest font-semibold opacity-70">Segments</h2>
            </div>
            
            <div className="space-y-3">
              {(["head", "torso", "legs"] as Zone[]).map((zone) => (
                <div 
                  key={zone} 
                  className={`p-3 rounded-2xl border transition-all ${activeZone === zone ? "bg-white/10 border-white/20 shadow-lg" : "bg-transparent border-transparent"}`}
                  onClick={() => setActiveZone(zone)}
                >
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-serif capitalize italic opacity-60 tracking-wider ">{zone}</span>
                        {loadingZone === zone && <RefreshCw className="w-3 h-3 animate-spin text-mystic-gold" />}
                      </div>
                      <div className="relative group">
                        <input
                          type="text"
                          placeholder={`Describe the ${zone}...`}
                          value={parts[zone].prompt}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setParts(prev => ({ ...prev, [zone]: { ...prev[zone], prompt: e.target.value } }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-3 pr-20 text-sm focus:outline-none focus:border-mystic-gold transition-colors text-white placeholder:opacity-20"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); editPart(zone); }}
                          disabled={loading || !!loadingZone}
                          className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all ${
                            fullImage 
                              ? "bg-mystic-gold text-black hover:bg-yellow-500 shadow-sm" 
                              : "bg-white/10 text-white/60 hover:bg-white/20"
                          } disabled:opacity-30`}
                        >
                          {fullImage ? "Refine" : "Start"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={setRandomPrompts}
                className="flex-1 py-3 glass rounded-2xl hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest font-medium opacity-60 hover:opacity-100"
              >
                Randomize
              </button>
              <button
                onClick={clearAll}
                className="flex-1 py-3 glass rounded-2xl hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest font-medium opacity-60 hover:opacity-100"
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

            {/* Secret Key Input */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-mystic-gold" />
                <h3 className="text-[10px] uppercase tracking-widest font-semibold opacity-50">Secret Alchemy</h3>
              </div>
              <input
                type="password"
                placeholder="Enter sk_ or pk_ key for Pro models..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] focus:outline-none focus:border-mystic-gold/50 transition-colors placeholder:opacity-30"
              />
            </div>
          </section>

          <button
            onClick={downloadComposition}
            disabled={!fullImage}
            className="w-full py-4 glass rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-30 border-white/5 opacity-80"
          >
            <Download className="w-5 h-5" />
            PRESERVE MASTERPIECE
          </button>
        </div>

        {/* Center: Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center order-1 lg:order-2">
          <AnimatePresence mode="wait">
            <motion.div 
              key={canvasKey}
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ 
                type: "spring", 
                damping: 20, 
                stiffness: 120, 
                bounce: 0.45 
              }}
              onMouseLeave={() => setHoveredZone(null)}
              className="relative w-full max-w-[450px] aspect-[9/16] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-[40px] overflow-hidden border border-white/10 group bg-zinc-900/40"
            >
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-30"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 border-4 border-mystic-gold border-t-transparent rounded-full animate-spin" />
                      <p className="text-lg font-serif italic tracking-widest animate-pulse text-mystic-gold">Manifesting Character...</p>
                    </div>
                  </motion.div>
                ) : fullImage ? (
                  /* Character Content */
                  <div className="relative w-full h-full flex flex-col">
                    {!loadingZone ? (
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={fullImage}
                        alt="Surrealist Character"
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col">
                        <div className="h-[30%] relative overflow-hidden">
                          {loadingZone !== "head" && (
                            <img src={fullImage} className="absolute top-0 left-0 w-full h-[333.33%] object-cover grayscale" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div className="h-[35%] relative overflow-hidden border-y border-white/5">
                          {loadingZone !== "torso" && (
                            <img src={fullImage} className="absolute top-[-85.714%] left-0 w-full h-[285.714%] object-cover grayscale" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div className="h-[35%] relative overflow-hidden">
                          {loadingZone !== "legs" && (
                            <img src={fullImage} className="absolute bottom-0 left-0 w-full h-[285.714%] object-cover grayscale" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Zone Refinement Indicators */}
                    {loadingZone && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center bg-black/10 backdrop-blur-[2px]"
                      >
                        <div className="px-4 py-2 glass rounded-full flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 animate-spin text-mystic-gold" />
                          <span className="text-[10px] uppercase tracking-widest font-bold">Refining {loadingZone}...</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-zinc-900/20"
                  >
                    <div className="opacity-20 flex flex-col items-center">
                      <Ghost className="w-24 h-24 mb-6" />
                      <h3 className="text-2xl font-serif italic mb-2">The Void Awaits</h3>
                      <p className="text-[10px] uppercase tracking-[0.3em] max-w-xs mx-auto leading-loose">
                        Define the head, torso, and legs to summon a consistent surrealist entity.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {fullImage && !loading && (
                <div className="absolute inset-0 flex flex-col z-10">
                  <div 
                    className="h-[30%] relative group/zone"
                    onMouseEnter={() => setHoveredZone("head")}
                    onClick={() => setActiveZone("head")}
                  >
                    <div className={`absolute inset-0 border-y border-mystic-gold/0 transition-all duration-500 ${hoveredZone === "head" ? "border-mystic-gold/20 bg-mystic-gold/5" : ""}`} />
                    <button onClick={(e) => { e.stopPropagation(); editPart("head"); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full opacity-0 group-hover/zone:opacity-100 transition-all hover:text-mystic-gold"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); editPart("head"); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full opacity-0 group-hover/zone:opacity-100 transition-all hover:text-mystic-gold"><ChevronRight className="w-5 h-5" /></button>
                    <div className={`absolute left-1/2 -translate-x-1/2 top-2 px-3 py-1 rounded-full text-[8px] uppercase tracking-[0.3em] glass opacity-0 group-hover/zone:opacity-100 transition-opacity pointer-events-none ${hoveredZone === "head" ? "text-mystic-gold border-mystic-gold/30" : "text-white/40"}`}>head</div>
                  </div>

                  <div 
                    className="h-[35%] relative group/zone border-y border-white/5"
                    onMouseEnter={() => setHoveredZone("torso")}
                    onClick={() => setActiveZone("torso")}
                  >
                    <div className={`absolute inset-0 border-y border-mystic-gold/0 transition-all duration-500 ${hoveredZone === "torso" ? "border-mystic-gold/20 bg-mystic-gold/5" : ""}`} />
                    <button onClick={(e) => { e.stopPropagation(); editPart("torso"); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full opacity-0 group-hover/zone:opacity-100 transition-all hover:text-mystic-gold"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); editPart("torso"); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full opacity-0 group-hover/zone:opacity-100 transition-all hover:text-mystic-gold"><ChevronRight className="w-5 h-5" /></button>
                    <div className={`absolute left-1/2 -translate-x-1/2 top-2 px-3 py-1 rounded-full text-[8px] uppercase tracking-[0.3em] glass opacity-0 group-hover/zone:opacity-100 transition-opacity pointer-events-none ${hoveredZone === "torso" ? "text-mystic-gold border-mystic-gold/30" : "text-white/40"}`}>torso</div>
                  </div>

                  <div 
                    className="h-[35%] relative group/zone"
                    onMouseEnter={() => setHoveredZone("legs")}
                    onClick={() => setActiveZone("legs")}
                  >
                    <div className={`absolute inset-0 border-y border-mystic-gold/0 transition-all duration-500 ${hoveredZone === "legs" ? "border-mystic-gold/20 bg-mystic-gold/5" : ""}`} />
                    <button onClick={(e) => { e.stopPropagation(); editPart("legs"); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full opacity-0 group-hover/zone:opacity-100 transition-all hover:text-mystic-gold"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); editPart("legs"); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full opacity-0 group-hover/zone:opacity-100 transition-all hover:text-mystic-gold"><ChevronRight className="w-5 h-5" /></button>
                    <div className={`absolute left-1/2 -translate-x-1/2 bottom-2 px-3 py-1 rounded-full text-[8px] uppercase tracking-[0.3em] glass opacity-0 group-hover/zone:opacity-100 transition-opacity pointer-events-none ${hoveredZone === "legs" ? "text-mystic-gold border-mystic-gold/30" : "text-white/40"}`}>legs</div>
                  </div>
                </div>
              )}

              {/* Decorative Frame */}
              <div className="absolute inset-0 pointer-events-none border-[12px] border-black/20 rounded-[40px]" />
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]" />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 glass border-l border-white/10 p-6 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-mystic-gold" />
                  <h2 className="text-2xl font-serif italic text-mystic-gold">History</h2>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
                    <Ghost className="w-12 h-12 mb-4" />
                    <p className="text-sm uppercase tracking-widest leading-relaxed">The archives are empty. Manifest something new.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => restoreHistory(item)}
                      className="group cursor-pointer space-y-3"
                    >
                      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/5 ring-mystic-gold/0 group-hover:ring-2 transition-all shadow-lg bg-zinc-900">
                        <img 
                          src={item.image} 
                          alt="History iteration" 
                          className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-mystic-gold font-bold">Restore Iteration</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-start px-1">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest opacity-40 mb-1">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs font-serif italic truncate max-w-[200px]">
                            {item.parts.head.prompt || "Untitled Manifestation"}
                          </p>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:border-mystic-gold/30 transition-colors">
                          <item.atmosphere.icon className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              className="glass max-w-2xl p-8 md:p-12 rounded-[40px] relative overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-mystic-gold/10 blur-3xl rounded-full -mr-16 -mt-16" />
              <h2 className="text-4xl font-serif italic mb-6 text-mystic-gold">Consistent Exquisite Corpse</h2>
              <div className="space-y-4 text-sm md:text-base leading-relaxed opacity-80 font-light">
                <p>
                  Traditional <span className="italic font-serif text-lg">Cadavre Exquis</span> often results in disjointed figures. 
                  This version uses AI to maintain <span className="text-mystic-gold font-medium">anatomical and stylistic consistency</span>.
                </p>
                <ul className="space-y-3 list-none">
                  <li>1. **Conjure**: Enter prompts for all zones and generate a full, unified character.</li>
                  <li>2. **Refine**: Use the refresh icon on a specific zone to modify only that part.</li>
                  <li>3. **Atmosphere**: Change the mood to shift the entire stylistic direction.</li>
                  <li>4. **Archive**: Access your previous iterations via the clock icon in the header.</li>
                </ul>
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

      {/* Welcome / Connection Modal */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 180, delay: 0.1 }}
              className="glass max-w-lg w-full rounded-[40px] overflow-hidden shadow-[0_0_120px_rgba(212,175,55,0.15)] border border-white/10 relative"
            >
              {/* Decorative glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-mystic-gold/20 blur-[60px] rounded-full -mt-10 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-800/20 blur-[40px] rounded-full pointer-events-none" />

              <div className="p-8 md:p-10 relative">
                {/* Header */}
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-mystic-gold/10 border border-mystic-gold/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                    <Wifi className="w-6 h-6 text-mystic-gold" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-serif italic text-mystic-gold leading-tight">Connect to Pollinations</h2>
                    <p className="text-xs uppercase tracking-[0.2em] opacity-40 mt-1 font-sans">Free AI Image Generation</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3 mb-8">
                  <p className="text-sm leading-relaxed opacity-70">
                    <span className="font-serif italic text-base text-white/90">Cadavre Exquis</span> uses{" "}
                    <a
                      href="https://pollinations.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mystic-gold hover:underline inline-flex items-center gap-1"
                    >
                      Pollinations.ai <ExternalLink className="w-3 h-3" />
                    </a>{" "}
                    for generating surrealist characters.
                  </p>
                  <div className="grid grid-cols-3 gap-3 py-2">
                    {[
                      { label: "Free", desc: "no key needed", ok: true },
                      { label: "Flux", desc: "generation model", ok: true },
                      { label: "Auto", desc: "instant connect", ok: true },
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col gap-1 p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <span className={`text-xs font-bold ${item.ok ? "text-emerald-400" : "text-mystic-gold"}`}>{item.label}</span>
                        <span className="text-[10px] opacity-40 leading-tight">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auto Connect Button */}
                <div className="space-y-4 mb-8">
                  <button
                    onClick={handleConnect}
                    className="w-full py-5 bg-gradient-to-r from-mystic-gold to-yellow-500 text-black font-bold rounded-2xl hover:from-yellow-500 hover:to-mystic-gold transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group text-base"
                  >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Connect Automatically
                    <Wifi className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  
                  <p className="text-[10px] opacity-30 text-center leading-relaxed">
                    Already configured with environment API key.<br/>
                    No personal account required for basic usage.
                  </p>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-center gap-2 text-[10px] opacity-40">
                  <Info className="w-3 h-3" />
                  <span>Premium features may require API key upgrade</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
