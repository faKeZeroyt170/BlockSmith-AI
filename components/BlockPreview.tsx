
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface BlockPreviewProps {
  textureUrl: string;
}

const BlockPreview: React.FC<BlockPreviewProps> = ({ textureUrl }) => {
  const [rotX, setRotX] = useState(-25);
  const [rotY, setRotY] = useState(45);
  const [zoom, setZoom] = useState(1);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastPos.current = { x: clientX, y: clientY };
  };

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    
    const deltaX = clientX - lastPos.current.x;
    const deltaY = clientY - lastPos.current.y;

    setRotY(prev => prev + deltaX * 0.5);
    setRotX(prev => Math.max(-90, Math.min(90, prev - deltaY * 0.5)));

    lastPos.current = { x: clientX, y: clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev - e.deltaY * 0.001)));
  };

  const resetCamera = () => {
    setRotX(-25);
    setRotY(45);
    setZoom(1);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-center h-full w-full bg-slate-950 rounded-xl overflow-hidden relative perspective-1000 cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onWheel={handleWheel}
    >
      {/* HUD overlay for controls hint */}
      <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none opacity-40">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 013 0m-6 3V11m0 5.5v-1a1.5 1.5 0 013 0v1" /></svg>
          Drag to Rotate
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          Scroll to Zoom
        </div>
      </div>

      <button 
        onClick={resetCamera}
        className="absolute bottom-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg text-[10px] font-bold border border-slate-700 transition-colors z-10"
      >
        Reset Camera
      </button>

      <div 
        className="scene w-48 h-48 preserve-3d transition-transform duration-100 ease-out"
        style={{ transform: `scale(${zoom})` }}
      >
        <div 
          className="cube w-full h-full relative preserve-3d"
          style={{ transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)` }}
        >
          {/* All 6 sides of the Minecraft block */}
          <div className="face front" style={{ backgroundImage: `url(${textureUrl})` }}></div>
          <div className="face back" style={{ backgroundImage: `url(${textureUrl})` }}></div>
          <div className="face right" style={{ backgroundImage: `url(${textureUrl})` }}></div>
          <div className="face left" style={{ backgroundImage: `url(${textureUrl})` }}></div>
          <div className="face top" style={{ backgroundImage: `url(${textureUrl})`, filter: 'brightness(1.1)' }}></div>
          <div className="face bottom" style={{ backgroundImage: `url(${textureUrl})`, filter: 'brightness(0.6)' }}></div>
          
          {/* Wireframe edges for extra definition */}
          <div className="absolute inset-0 preserve-3d pointer-events-none">
            <div className="face front !bg-none border border-black/10"></div>
            <div className="face back !bg-none border border-black/10"></div>
            <div className="face right !bg-none border border-black/10"></div>
            <div className="face left !bg-none border border-black/10"></div>
            <div className="face top !bg-none border border-black/10"></div>
            <div className="face bottom !bg-none border border-black/10"></div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .scene {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .cube {
          position: relative;
          width: 160px;
          height: 160px;
          transform-style: preserve-3d;
        }
        .face {
          position: absolute;
          width: 160px;
          height: 160px;
          background-size: cover;
          image-rendering: pixelated;
        }
        .front  { transform: rotateY(0deg) translateZ(80px); }
        .back   { transform: rotateY(180deg) translateZ(80px); }
        .right  { transform: rotateY(90deg) translateZ(80px); filter: brightness(0.85); }
        .left   { transform: rotateY(-90deg) translateZ(80px); filter: brightness(0.85); }
        .top    { transform: rotateX(90deg) translateZ(80px); }
        .bottom { transform: rotateX(-90deg) translateZ(80px); }
      `}</style>
    </div>
  );
};

export default BlockPreview;
