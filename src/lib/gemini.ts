export type Zone = "head" | "torso" | "legs";

export interface GenerationParams {
  headPrompt: string;
  torsoPrompt: string;
  legsPrompt: string;
  atmosphere: string;
  baseImage?: string;
  zoneToEdit?: Zone;
  customApiKey?: string;
}

/**
 * Generate a full body character.
 */
export async function generateFullCharacter({ headPrompt, torsoPrompt, legsPrompt, atmosphere, customApiKey }: GenerationParams): Promise<string> {
  const apiKey = customApiKey || import.meta.env.VITE_POLLEN_API_KEY || "";
  
  const combinedPrompt = `A full-body surrealist character. 
  Style: 1920s surrealism, dream-like, high contrast, mysterious. 
  Atmosphere: ${atmosphere}.
  
  Character Details:
  - Head: ${headPrompt || "mystical and surreal"}
  - Torso: ${torsoPrompt || "mystical and surreal"}
  - Legs: ${legsPrompt || "mystical and surreal"}
  
  The character should be centered, full-body, on a consistent dark atmospheric background. 
  Artistic medium: Oil painting or charcoal sketch.`;

  const seed = Math.floor(Math.random() * 888888);
  const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(combinedPrompt)}?width=1024&height=1792&model=flux&nologo=true&seed=${seed}`;

  try {
    console.log("🎨 Generation attempt with key:", apiKey ? (apiKey.startsWith('sk_') ? 'SECRET' : 'PUBLIC') : 'NONE');
    
    // If no key, use the free GET endpoint
    if (!apiKey) {
      return fallbackUrl;
    }

    // Try OpenAI-compatible POST for better results with key
    const response = await fetch("https://gen.pollinations.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "flux",
        prompt: combinedPrompt,
        size: "1024x1792",
        response_format: "b64_json",
        seed: seed
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data[0] && data.data[0].b64_json) {
         return `data:image/png;base64,${data.data[0].b64_json}`;
      }
    }
    
    // If anything fails with the key, use free fallback
    return fallbackUrl;
  } catch (error) {
    console.error("API error, falling back...", error);
    return fallbackUrl;
  }
}

/**
 * Edit a part of the character.
 */
export async function editCharacterPart({ headPrompt, torsoPrompt, legsPrompt, atmosphere, baseImage, zoneToEdit, customApiKey }: GenerationParams): Promise<string | null> {
  if (!baseImage || !zoneToEdit) return null;
  
  const apiKey = customApiKey || import.meta.env.VITE_POLLEN_API_KEY || "";
  const currentPrompt = zoneToEdit === 'head' ? headPrompt : zoneToEdit === 'torso' ? torsoPrompt : legsPrompt;
  
  const editPrompt = `SURREALIST IMAGE EDITING:
  Change the ${zoneToEdit} to: ${currentPrompt || "Surreal"}
  Atmosphere: ${atmosphere}.
  Maintain existing style and background.`;

  try {
    if (!apiKey) {
      // Prompt based variation for free API
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(editPrompt)}?width=1024&height=1792&model=flux&seed=${Math.floor(Math.random()*9999)}`;
    }

    const response = await fetch("https://gen.pollinations.ai/v1/images/edits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "flux",
        prompt: editPrompt,
        image: baseImage,
        size: "1024x1792",
        response_format: "b64_json"
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data[0] && data.data[0].b64_json) {
        return `data:image/png;base64,${data.data[0].b64_json}`;
      }
    }
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(editPrompt)}?width=1024&height=1792&seed=${Date.now()}`;
  } catch (error) {
    return null;
  }
}