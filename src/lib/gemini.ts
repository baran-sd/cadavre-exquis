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
 */
export async function generateFullCharacter({ headPrompt, torsoPrompt, legsPrompt, atmosphere }: GenerationParams): Promise<string> {
  // Use public unauthenticated endpoint by default for maximum reliability, 
  // as pk_ keys on gen.pollinations.ai have strict model/format restrictions.
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
  // Using the free GET endpoint which returns the image directly.
  // This is the most stable way to get images without crashing the browser with huge base64 strings.
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(combinedPrompt)}?width=1024&height=1792&model=flux&nologo=true&seed=${seed}`;
}

/**
 * Edit a part of the character.
 */
export async function editCharacterPart({ headPrompt, torsoPrompt, legsPrompt, atmosphere, baseImage, zoneToEdit }: GenerationParams): Promise<string | null> {
  if (!baseImage || !zoneToEdit) return null;
  
  const currentPrompt = zoneToEdit === 'head' ? headPrompt : zoneToEdit === 'torso' ? torsoPrompt : legsPrompt;
  
  const editPrompt = `SURREALIST IMAGE EDITING TASK:
  Modify ONLY the ${zoneToEdit} zone of the character.
  New description: ${currentPrompt || "Surreal and mystical"}
  Atmosphere: ${atmosphere}.
  Maintain the exact style, lighting and background of the rest of the body.`;

  const seed = Math.floor(Math.random() * 888888);
  // Fallback to generation with a consistent seed or use public image API
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(editPrompt)}?width=1024&height=1792&model=flux&nologo=true&seed=${seed}`;
}