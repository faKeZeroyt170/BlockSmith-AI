
import { GoogleGenAI } from "@google/genai";
import { GenerationParams, TextureType } from "../types";

export const generateTexture = async (params: GenerationParams): Promise<{ imageUrl: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let layoutInstruction = '';
  if (params.type === TextureType.BLOCK) {
    layoutInstruction = `Seamless tiling texture for a Minecraft block. The texture should represent the properties of "${params.target}".`;
  } else {
    layoutInstruction = `Centered sprite on pure WHITE background for a Minecraft item. The sprite should look like a version of "${params.target}".`;
  }

  const imagePrompt = `
    Create a ${params.resolution}x${params.resolution} Minecraft style ${params.type} asset.
    Subject: ${params.prompt}
    Target Replacement: ${params.target}
    Style: ${params.style}
    Technical: ${layoutInstruction} No blur, pixel-perfect, centered.
  `.trim();

  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: imagePrompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });

  let imageUrl = '';
  for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  if (!imageUrl) throw new Error("No image data returned from Gemini API");
  
  return { imageUrl };
};
