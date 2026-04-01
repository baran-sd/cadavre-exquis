export type Zone = "head" | "torso" | "legs";

export interface GenerationParams {
  headPrompt: string;
  torsoPrompt: string;
  legsPrompt: string;
  atmosphere: string;
  baseImage?: string;
  zoneToEdit?: Zone;
}

/**
 * Generate a full body character.
 * Uses a robust approach: tries the key-based API first, and falls back
 * to the simple unauthenticated GET endpoint if it fails or returns 403.
 */
export async function generateFullCharacter({ headPrompt, torsoPrompt, legsPrompt, atmosphere }: GenerationParams): Promise<string> {
  const apiKey = import.meta.env.VITE_POLLEN_API_KEY || "";
  
  const combinedPrompt = `A full-body surrealist character. 
  Style: 1920s surrealism, dream-like, high contrast, mysterious. 
  Atmosphere: ${atmosphere}.
  
  Character Details:
  - Head: ${headPrompt || "mystical and surreal"}
  - Torso: ${torsoPrompt || "mystical and surreal"}
  - Legs: ${legsPrompt || "mystical and surreal"}
  
  The character should be centered, full-body, on a consistent dark atmospheric background. 
  Artistic medium: Oil painting or charcoal sketch.`;

  try {
    console.log("🎨 Attempting generation...");
    
    // Fallback URL for regular Pollinations if key is missing or we want robustness
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(combinedPrompt)}?width=1024&height=1792&model=flux&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
    
    if (!apiKey || apiKey.startsWith("your_")) {
      console.log("No valid API key found, using public endpoint.");
      return fallbackUrl;
    }

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
        seed: Math.floor(Math.random() * 999999)
      })
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        console.warn("API Key forbidden or invalid, falling back to public endpoint.");
        return fallbackUrl;
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Generation failed (${response.status})`);
    }

    const data = await response.json();
    if (data.data && data.data[0] && data.data[0].b64_json) {
       console.log("✅ Success with API key!");
       return `data:image/png;base64,${data.data[0].b64_json}`;
    }
    
    return fallbackUrl;
  } catch (error) {
    console.error("Caught error in generation, trying fallback...", error);
    // Absolute fallback: a simplified prompt that always works
    return `https://image.pollinations.ai/prompt/${encodeURIComponent("surrealist exquisite corpse character " + atmosphere)}?width=1024&height=1792&seed=42`;
  }
}

/**
 * Edit a part of the character.
 */
export async function editCharacterPart({ headPrompt, torsoPrompt, legsPrompt, atmosphere, baseImage, zoneToEdit }: GenerationParams): Promise<string | null> {
  if (!baseImage || !zoneToEdit) return null;
  
  const apiKey = import.meta.env.VITE_POLLEN_API_KEY || "";
  const currentPrompt = zoneToEdit === 'head' ? headPrompt : zoneToEdit === 'torso' ? torsoPrompt : legsPrompt;
  
  const editPrompt = `SURREALIST IMAGE EDITING TASK:
  Modify ONLY the ${zoneToEdit} zone.
  Description: ${currentPrompt || "Surreal and mystical"}
  Atmosphere: ${atmosphere}
  Keep the rest of the image exactly the same.`;

  try {
    console.log(`✏️ Editing ${zoneToEdit} zone...`);
    
    if (!apiKey || apiKey.startsWith("your_")) {
      // In-browser edit fallback (pseudo-edit via regeneratng with same seed is complex, so we just use the free API)
      // Note: Free API doesn't support "edits" via POST JSON like the Pro one, so we just generate a variation
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(editPrompt)}?width=1024&height=1792&model=flux&seed=${Math.floor(Math.random() * 999999)}`;
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
    
    // If edit fails or forbidden, we generate a new one
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(editPrompt)}?width=1024&height=1792&seed=${Date.now()}`;
  } catch (error) {
    console.error("Edit error, returning default prompt", error);
    return null;
  }
}