
// Minecraft texture types supported by the application
export enum TextureType {
  BLOCK = 'block',
  ITEM = 'item',
  SKIN = 'skin'
}

export enum MinecraftEdition {
  JAVA = 'java',
  BEDROCK = 'bedrock'
}

export interface TextureItem {
  id: string;
  name: string;
  description: string;
  type: TextureType;
  replacementTarget: string;
  imageUrl: string;
  resolution: number;
  createdAt: number;
}

export interface GenerationParams {
  prompt: string;
  type: TextureType;
  style: string;
  resolution: number;
  target: string;
  edition: MinecraftEdition;
}
