
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextureType } from '../types';

interface PixelEditorProps {
  initialImageUrl: string;
  resolution: number;
  type: TextureType;
  onSave: (newImageUrl: string) => void;
  onCancel: () => void;
}

const PixelEditor: React.FC<PixelEditorProps> = ({ initialImageUrl, resolution, type, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#ffffff');
  const [tool, setTool] = useState<'pen' | 'eraser' | 'picker' | 'fill'>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>(['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff']);
  const [showGrid, setShowGrid] = useState(true);

  // Initialize canvas with existing image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, resolution, resolution);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, resolution, resolution);
    };
    img.src = initialImageUrl;
  }, [initialImageUrl, resolution]);

  const getPixelPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = Math.floor(((clientX - rect.left) / rect.width) * resolution);
    const y = Math.floor(((clientY - rect.top) / rect.height) * resolution);
    return { x, y };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawing) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { x, y } = getPixelPos(e);
    if (x < 0 || x >= resolution || y < 0 || y >= resolution) return;

    if (tool === 'pen') {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
      updateRecentColors(color);
    } else if (tool === 'eraser') {
      ctx.clearRect(x, y, 1, 1);
    } else if (tool === 'picker') {
      const data = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1)}`;
      setColor(hex);
      setTool('pen');
    }
  };

  const handleFill = (e: React.MouseEvent) => {
    if (tool !== 'fill') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { x, y } = getPixelPos(e);
    floodFill(ctx, x, y, color);
    updateRecentColors(color);
  };

  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) => {
    const imageData = ctx.getImageData(0, 0, resolution, resolution);
    const data = imageData.data;
    const targetColor = getPixelColor(data, startX, startY);
    const fillRGBA = hexToRgba(fillColor);

    if (colorsMatch(targetColor, fillRGBA)) return;

    const stack = [[startX, startY]];
    while (stack.length > 0) {
      const [currX, currY] = stack.pop()!;
      const currentColor = getPixelColor(data, currX, currY);

      if (colorsMatch(currentColor, targetColor)) {
        setPixelColor(data, currX, currY, fillRGBA);
        if (currX > 0) stack.push([currX - 1, currY]);
        if (currX < resolution - 1) stack.push([currX + 1, currY]);
        if (currY > 0) stack.push([currX, currY - 1]);
        if (currY < resolution - 1) stack.push([currX, currY + 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const getPixelColor = (data: Uint8ClampedArray, x: number, y: number) => {
    const i = (y * resolution + x) * 4;
    return [data[i], data[i+1], data[i+2], data[i+3]];
  };

  const setPixelColor = (data: Uint8ClampedArray, x: number, y: number, rgba: number[]) => {
    const i = (y * resolution + x) * 4;
    data[i] = rgba[0];
    data[i+1] = rgba[1];
    data[i+2] = rgba[2];
    data[i+3] = rgba[3];
  };

  const colorsMatch = (c1: number[], c2: number[]) => {
    return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3];
  };

  const hexToRgba = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
  };

  const updateRecentColors = (newColor: string) => {
    if (!recentColors.includes(newColor)) {
      setRecentColors(prev => [newColor, ...prev.slice(0, 7)]);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Pixel Editor
        </h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-1 text-xs font-bold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors">Apply Changes</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <div className="w-16 border-r border-slate-700 bg-slate-800/30 flex flex-col items-center py-4 gap-4">
          <button 
            onClick={() => setTool('pen')} 
            className={`p-2 rounded-xl transition-all ${tool === 'pen' ? 'bg-green-600 text-white shadow-lg shadow-green-900/40' : 'text-slate-500 hover:bg-slate-700'}`}
            title="Pen"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button 
            onClick={() => setTool('eraser')} 
            className={`p-2 rounded-xl transition-all ${tool === 'eraser' ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-700'}`}
            title="Eraser"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
          <button 
            onClick={() => setTool('fill')} 
            className={`p-2 rounded-xl transition-all ${tool === 'fill' ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-700'}`}
            title="Bucket Fill"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </button>
          <button 
            onClick={() => setTool('picker')} 
            className={`p-2 rounded-xl transition-all ${tool === 'picker' ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-700'}`}
            title="Color Picker"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
          </button>
          <div className="h-px w-8 bg-slate-700 my-2"></div>
          <button 
            onClick={() => setShowGrid(!showGrid)} 
            className={`p-2 rounded-xl transition-all ${showGrid ? 'text-green-500' : 'text-slate-500'}`}
            title="Toggle Grid"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0f] relative overflow-hidden">
          <div className="relative group shadow-2xl">
            <canvas
              ref={canvasRef}
              width={resolution}
              height={resolution}
              onMouseDown={(e) => { setIsDrawing(true); draw(e); handleFill(e); }}
              onMouseMove={draw}
              onMouseUp={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
              className="image-rendering-pixelated cursor-crosshair border border-slate-700 bg-white"
              style={{ width: '400px', height: '400px', background: 'repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 50% / 20px 20px' }}
            />
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{ 
                  backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                  backgroundSize: `${400/resolution}px ${400/resolution}px`
                }}
              ></div>
            )}
            
            {/* Skin Guides Overlay */}
            {type === TextureType.SKIN && showGrid && (
               <div className="absolute inset-0 pointer-events-none border-2 border-red-500/30">
                  {/* Head area hint - typical 64x64 layout */}
                  <div className="absolute top-0 left-0 w-1/4 h-1/4 border-2 border-blue-500/20 flex items-center justify-center text-[8px] text-blue-500 font-bold uppercase">Head</div>
               </div>
            )}
          </div>
        </div>

        {/* Color Panel */}
        <div className="w-24 border-l border-slate-700 bg-slate-800/30 flex flex-col items-center py-4 px-2 gap-4 overflow-y-auto">
          <div className="flex flex-col items-center gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Color</label>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none"
            />
          </div>
          <div className="flex flex-col items-center gap-2 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Recent</label>
            <div className="flex flex-wrap justify-center gap-2">
              {recentColors.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-md border border-white/10 transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-green-500' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixelEditor;
