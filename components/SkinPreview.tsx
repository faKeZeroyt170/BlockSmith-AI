
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SkinPreviewProps {
  textureUrl: string;
  isSlim?: boolean;
}

const SkinPreview: React.FC<SkinPreviewProps> = ({ textureUrl, isSlim = false }) => {
  const [rotX, setRotX] = useState(-10);
  const [rotY, setRotY] = useState(30);
  const [zoom, setZoom] = useState(0.8);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const armWidth = isSlim ? 30 : 40;

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

  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Simplified CSS 3D Humanoid Parts
  const Cube = ({ w, h, d, x = 0, y = 0, z = 0, className = "" }: any) => (
    <div className={`preserve-3d absolute ${className}`} style={{ width: w, height: h, transform: `translate3d(${x}px, ${y}px, ${z}px)` }}>
      <div className="face" style={{ width: w, height: h, transform: `rotateY(0deg) translateZ(${d/2}px)`, backgroundImage: `url(${textureUrl})` }}></div>
      <div className="face" style={{ width: w, height: h, transform: `rotateY(180deg) translateZ(${d/2}px)`, backgroundImage: `url(${textureUrl})` }}></div>
      <div className="face" style={{ width: d, height: h, left: (w-d)/2, transform: `rotateY(90deg) translateZ(${w/2}px)`, backgroundImage: `url(${textureUrl})` }}></div>
      <div className="face" style={{ width: d, height: h, left: (w-d)/2, transform: `rotateY(-90deg) translateZ(${w/2}px)`, backgroundImage: `url(${textureUrl})` }}></div>
      <div className="face" style={{ width: w, height: d, top: (h-d)/2, transform: `rotateX(90deg) translateZ(${h/2}px)`, backgroundImage: `url(${textureUrl})` }}></div>
      <div className="face" style={{ width: w, height: d, top: (h-d)/2, transform: `rotateX(-90deg) translateZ(${h/2}px)`, backgroundImage: `url(${textureUrl})` }}></div>
    </div>
  );

  return (
    <div 
      className="flex items-center justify-center h-full w-full bg-slate-950 rounded-xl overflow-hidden relative perspective-1000 cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onWheel={(e) => setZoom(prev => Math.max(0.4, Math.min(1.5, prev - e.deltaY * 0.001)))}
    >
      <div className="scene preserve-3d" style={{ transform: `scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)` }}>
        <div className="character-model preserve-3d relative flex flex-col items-center">
          {/* Head */}
          <Cube w={80} h={80} d={80} y={-80} className="head" />
          {/* Body */}
          <Cube w={80} h={120} d={40} y={0} className="body" />
          {/* Left Arm */}
          <Cube w={armWidth} h={120} d={40} x={-(40 + armWidth/2)} y={0} className="arm-l" />
          {/* Right Arm */}
          <Cube w={armWidth} h={120} d={40} x={40 + armWidth/2} y={0} className="arm-r" />
          {/* Left Leg */}
          <Cube w={40} h={120} d={40} x={-20} y={120} className="leg-l" />
          {/* Right Leg */}
          <Cube w={40} h={120} d={40} x={20} y={120} className="leg-r" />
        </div>
      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .face {
          position: absolute;
          background-size: 800%; /* Simplified mapping */
          image-rendering: pixelated;
          border: 1px solid rgba(0,0,0,0.05);
          background-color: #333;
        }
        .character-model { width: 80px; height: 320px; }
      `}</style>
    </div>
  );
};

export default SkinPreview;
