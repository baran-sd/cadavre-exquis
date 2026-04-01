export type Zone = "head" | "torso" | "legs";

export interface GenerationParams {
  headPrompt: string;
  torsoPrompt: string;
  legsPrompt: string;
  atmosphere: string;
  baseImage?: string;
  zoneToEdit?: Zone;
}

export async function generateFullCharacter({ headPrompt, torsoPrompt, legsPrompt, atmosphere }: GenerationParams): Promise<string> {
  const apiKey = import.meta.env.VITE_POLLEN_API_KEY || "";
  
  if (!apiKey) {
    console.error("⚠️ API key missing! Add VITE_POLLEN_API_KEY to .env file");
    throw new Error("API key not configured");
  }

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
    console.log("🎨 Generating full character with Pollinations...");
    console.log("API Key present:", !!apiKey);
    
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

    console.log("Response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("API Error:", error);
      throw new Error(error.error?.message || "Generation failed");
    }

    const data = await response.json();
    console.log("✅ Full character generated successfully!");
    
    return `data:image/png;base64,${data.data[0].b64_json}`;
  } catch (error) {
    console.error("Full character generation error:", error);
    throw error;
  }
}

export async function editCharacterPart({ headPrompt, torsoPrompt, legsPrompt, atmosphere, baseImage, zoneToEdit }: GenerationParams): Promise<string | null> {
  if (!baseImage || !zoneToEdit) return null;
  
  const apiKey = import.meta.env.VITE_POLLEN_API_KEY || "";
  
  const currentPrompt = zoneToEdit === 'head' ? headPrompt : zoneToEdit === 'torso' ? torsoPrompt : legsPrompt;
  
  const editPrompt = `SURREALIST IMAGE EDITING TASK:
  You are modifying a specific zone of an existing surrealist character.
  
  ZONE TO MODIFY: ${zoneToEdit}
  NEW DESCRIPTION FOR ${zoneToEdit}: ${currentPrompt || "Surreal and mystical"}
  
  STRICT CONSTRAINTS:
  1. ONLY change the ${zoneToEdit} area. 
  2. The ${(["head", "torso", "legs"] as Zone[]).filter(z => z !== zoneToEdit).join(" and ")} MUST remain exactly as they are in the original image.
  3. The background, lighting, and overall 1920s surrealist oil painting style MUST be preserved perfectly.
  4. Ensure a seamless transition between the new ${zoneToEdit} and the rest of the body.
  5. The atmosphere is ${atmosphere}.`;

  try {
    console.log(`✏️ Editing ${zoneToEdit} zone with Pollinations...`);
    
    const response = await fetch("https://gen.pollinations.ai/v1/images/edits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "klein",
        prompt: editPrompt,
        image: baseImage,
        size: "1024x1792",
        response_format: "b64_json"
      })
    });

    console.log("Edit response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("Edit API Error:", error);
      throw new Error(error.error?.message || "Edit failed");
    }

    const data = await response.json();
    console.log(`✅ ${zoneToEdit} zone edited successfully!`);
    
    return `data:image/png;base64,${data.data[0].b64_json}`;
  } catch (error) {
    console.error("Character edit error:", error);
    throw error;
  }
}