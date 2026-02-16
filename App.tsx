
import React, { useState } from 'react';
import { TextureItem, TextureType, MinecraftEdition } from './types';
import { generateTexture } from './services/geminiService';
import { pixelateImage } from './utils/pixelate';
import BlockPreview from './components/BlockPreview';
import PixelEditor from './components/PixelEditor';

// @ts-ignore
const JSZip = window.JSZip;

const SUGGESTED_BLOCKS = ['grass_block', 'dirt', 'stone', 'cobblestone', 'oak_planks', 'diamond_ore', 'iron_ore', 'glass', 'tnt', 'crafting_table', 'obsidian', 'bedrock', 'sand', 'gravel', 'gold_block'];
const SUGGESTED_ITEMS = ['iron_sword', 'diamond_pickaxe', 'apple', 'stick', 'iron_ingot', 'diamond', 'ender_pearl', 'bow', 'feather', 'coal', 'raw_iron', 'bucket', 'bread', 'golden_apple'];

const App: React.FC = () => {
  const [textures, setTextures] = useState<TextureItem[]>([]);
  const [currentTexture, setCurrentTexture] = useState<TextureItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<TextureType>(TextureType.BLOCK);
  const [resolution, setResolution] = useState(16);
  const [style, setStyle] = useState('Vanilla-ish');
  const [edition, setEdition] = useState<MinecraftEdition>(MinecraftEdition.JAVA);
  const [replacementTarget, setReplacementTarget] = useState('diamond_ore');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !replacementTarget) return;
    setIsGenerating(true);
    setError(null);

    try {
      const { imageUrl } = await generateTexture({
        prompt, 
        type, 
        style, 
        resolution,
        edition,
        target: replacementTarget
      });

      const pixelatedUrl = await pixelateImage(imageUrl, resolution);

      const newItem: TextureItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: prompt,
        description: `${resolution}x ${style} ${type.toUpperCase()}`,
        type,
        replacementTarget: replacementTarget.toLowerCase().trim().replace(/\s+/g, '_'),
        imageUrl: pixelatedUrl,
        resolution: resolution,
        createdAt: Date.now(),
      };

      setTextures(prev => [newItem, ...prev]);
      setCurrentTexture(newItem);
      setPrompt(''); // Clear prompt for next use
    } catch (err: any) {
      setError(err.message || 'Failed to generate asset.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTexture = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent selecting the texture when clicking delete
    if (window.confirm('Are you sure you want to delete this texture?')) {
      setTextures(prev => prev.filter(t => t.id !== id));
      if (currentTexture?.id === id) {
        setCurrentTexture(null);
        setIsEditing(false);
      }
    }
  };

  const handleEditorSave = (newUrl: string) => {
    if (!currentTexture) return;
    const updatedTexture = { ...currentTexture, imageUrl: newUrl };
    setCurrentTexture(updatedTexture);
    setTextures(prev => prev.map(t => t.id === currentTexture.id ? updatedTexture : t));
    setIsEditing(false);
  };

  const downloadResourcePack = async () => {
    if (textures.length === 0) return;
    const zip = new JSZip();
    const isJava = edition === MinecraftEdition.JAVA;

    if (isJava) {
      zip.file("pack.mcmeta", JSON.stringify({
        pack: { pack_format: 15, description: "BlockSmith AI Texture Pack" }
      }, null, 2));

      const texturesFolder = zip.folder("assets/minecraft/textures");
      const blocksFolder = texturesFolder.folder("block");
      const itemsFolder = texturesFolder.folder("item");

      for (const t of textures) {
        const res = await fetch(t.imageUrl);
        const blob = await res.blob();
        const safeName = t.replacementTarget;
        if (t.type === TextureType.BLOCK) blocksFolder.file(`${safeName}.png`, blob);
        else itemsFolder.file(`${safeName}.png`, blob);
      }
    } else {
      // Bedrock
      zip.file("manifest.json", JSON.stringify({
        format_version: 2,
        header: { 
          name: "BlockSmith AI Pack", 
          uuid: crypto.randomUUID(), 
          version: [1, 0, 0], 
          min_engine_version: [1, 16, 0] 
        },
        modules: [{ type: "resources", uuid: crypto.randomUUID(), version: [1, 0, 0] }]
      }, null, 2));

      const texturesFolder = zip.folder("textures");
      const blocksFolder = texturesFolder.folder("blocks");
      const itemsFolder = texturesFolder.folder("items");

      for (const t of textures) {
        const res = await fetch(t.imageUrl);
        const blob = await res.blob();
        const safeName = t.replacementTarget;
        if (t.type === TextureType.BLOCK) blocksFolder.file(`${safeName}.png`, blob);
        else itemsFolder.file(`${safeName}.png`, blob);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `BlockSmith_AI_Pack.zip`;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05070a]">
      <header className="bg-slate-950/80 border-b border-slate-800/50 p-4 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 p-2 rounded-xl shadow-[0_0_20px_rgba(22,163,74,0.3)]">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold pixel-font text-green-500 leading-none tracking-tight">BLOCKSMITH <span className="text-slate-200">AI</span></h1>
          </div>
          
          <button 
            onClick={downloadResourcePack}
            disabled={textures.length === 0}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 disabled:opacity-30 px-6 py-2.5 rounded-xl transition-all font-bold text-white shadow-lg shadow-green-900/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span>EXPORT PACK</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900/50 border border-slate-800/50 p-6 rounded-3xl shadow-2xl backdrop-blur-md">
            <div className="flex p-1 bg-black rounded-2xl mb-6 border border-slate-800">
              <button onClick={() => setEdition(MinecraftEdition.JAVA)} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${edition === MinecraftEdition.JAVA ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>JAVA</button>
              <button onClick={() => setEdition(MinecraftEdition.BEDROCK)} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${edition === MinecraftEdition.BEDROCK ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>BEDROCK</button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Texture Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setType(TextureType.BLOCK)} className={`py-3 rounded-xl border text-xs font-bold transition-all ${type === TextureType.BLOCK ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>BLOCK</button>
                  <button type="button" onClick={() => setType(TextureType.ITEM)} className={`py-3 rounded-xl border text-xs font-bold transition-all ${type === TextureType.ITEM ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>ITEM</button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Replacement Target (Minecraft ID)</label>
                <input 
                  type="text"
                  list="target-suggestions"
                  value={replacementTarget}
                  onChange={(e) => setReplacementTarget(e.target.value)}
                  placeholder="e.g. grass_block, diamond_ore..."
                  className="w-full bg-black border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-green-500 transition-colors"
                />
                <datalist id="target-suggestions">
                  {(type === TextureType.BLOCK ? SUGGESTED_BLOCKS : SUGGESTED_ITEMS).map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <p className="mt-2 text-[9px] text-slate-500 italic">Enter the exact name of the block or item you want to replace.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Description</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your design (e.g. Golden obsidian with glowing runes)..."
                  className="w-full bg-black border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:ring-1 focus:ring-green-500 outline-none h-24 resize-none text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Resolution</label>
                  <select value={resolution} onChange={(e) => setResolution(Number(e.target.value))} className="w-full bg-black border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300">
                    <option value={16}>16x16</option>
                    <option value={32}>32x32</option>
                    <option value={64}>64x64</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Art Style</label>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-black border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300">
                    <option>Vanilla-ish</option>
                    <option>Fantasy</option>
                    <option>Retro Pixel</option>
                    <option>Simplistic</option>
                    <option>Detailed</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isGenerating || !prompt || !replacementTarget}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 ${isGenerating ? 'bg-slate-800 text-slate-500' : 'bg-green-600 hover:bg-green-500 text-white shadow-xl shadow-green-900/30'}`}
              >
                {isGenerating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : "GENERATE TEXTURE"}
              </button>
            </form>
          </section>

          {error && (
            <div className="bg-red-900/20 border border-red-800 p-4 rounded-2xl text-red-400 text-xs flex items-center gap-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2">TEXTURE COLLECTION ({textures.length})</h2>
            <div className="grid grid-cols-4 gap-3">
              {textures.map((t) => (
                <div 
                  key={t.id}
                  onClick={() => { setCurrentTexture(t); setIsEditing(false); }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all relative group ${currentTexture?.id === t.id ? 'border-green-500 bg-slate-800 scale-105 shadow-lg shadow-green-900/20' : 'border-slate-800 bg-slate-900/50 opacity-60 hover:opacity-100'}`}
                >
                  <img src={t.imageUrl} className="w-full h-full object-contain p-2 image-rendering-pixelated" />
                  <button 
                    onClick={(e) => handleDeleteTexture(e, t.id)}
                    className="absolute top-1 right-1 p-1 bg-red-900/80 text-white rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all z-10 shadow-lg"
                    title="Delete texture"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          {isEditing && currentTexture ? (
            <PixelEditor 
              initialImageUrl={currentTexture.imageUrl}
              resolution={currentTexture.resolution}
              type={currentTexture.type}
              onSave={handleEditorSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-8 min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm">
              {currentTexture ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-wider">{currentTexture.name}</h3>
                      <p className="text-xs text-slate-500">Target ID: <span className="text-green-500 font-mono">{currentTexture.replacementTarget}</span></p>
                    </div>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="bg-slate-950 hover:bg-slate-800 text-slate-400 px-5 py-2 rounded-xl border border-slate-800 text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      OPEN PIXEL EDITOR
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col md:flex-row gap-12 items-center justify-center">
                    <div className="flex flex-col items-center space-y-4">
                       <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Texture Map</span>
                       <div className="relative group">
                        <img src={currentTexture.imageUrl} className="w-48 h-48 rounded-2xl shadow-2xl image-rendering-pixelated bg-black border-4 border-slate-950"/>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl pointer-events-none">
                          <span className="text-[8px] text-white font-bold">{currentTexture.resolution}x{currentTexture.resolution}</span>
                        </div>
                       </div>
                    </div>
                    <div className="flex flex-col items-center space-y-4">
                       <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">3D Visualization</span>
                       <div className="w-64 h-64">
                          {currentTexture.type === TextureType.BLOCK ? (
                            <BlockPreview textureUrl={currentTexture.imageUrl}/>
                          ) : (
                            <div className="flex items-center justify-center h-full bg-slate-950 rounded-3xl border border-slate-800 shadow-inner group relative">
                              <img src={currentTexture.imageUrl} className="w-32 h-32 image-rendering-pixelated shadow-2xl drop-shadow-[0_0_20px_rgba(255,255,255,0.05)] transform group-hover:scale-110 transition-transform"/>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 4v16m8-8H4"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-400">FORGE YOUR FIRST TEXTURE</h3>
                  <p className="text-sm text-slate-600 max-w-xs">Describe a block or item on the left to begin your AI-assisted resource pack creation.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="p-8 text-center bg-black/50 border-t border-slate-900 mt-auto">
        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.3em]">BlockSmith AI • Minecraft Resource Pack Engine • 2025 v1.0</p>
      </footer>
    </div>
  );
};

export default App;
