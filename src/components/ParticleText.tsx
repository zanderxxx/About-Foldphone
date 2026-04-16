import React, { useEffect, useRef, useState, useMemo } from 'react';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface ParticleTextProps {
  text: string;
  color?: string;
  fontSize?: number;
}

export const ParticleText: React.FC<ParticleTextProps> = ({ 
  text, 
  color = "#ffffff", 
  fontSize = 64 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const [isExploding, setIsExploding] = useState(false);
  const currentText = useRef(text);
  const targetPoints = useRef<{x: number, y: number}[]>([]);

  // Sample points from text
  const sampleText = (txt: string, ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    const responsiveSize = window.innerWidth < 768 ? fontSize * 0.7 : fontSize;
    ctx.font = `200 ${responsiveSize}px "Inter"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // PC context (left-aligned) or Mobile context (centered)
    const isMobile = window.innerWidth < 768;
    const xPos = isMobile ? width / 2 : width / 5; // Align with the PC dashboard layout
    if (!isMobile) ctx.textAlign = "left";

    ctx.fillText(txt, xPos, height / 2);

    const imageData = ctx.getImageData(0, 0, width, height).data;
    const points: {x: number, y: number}[] = [];
    const step = window.innerWidth < 768 ? 2 : 2.5; // High resolution sampling for clarity

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (Math.floor(y) * width + Math.floor(x)) * 4;
        if (imageData[index + 3] > 160) { // Sharper threshold
          points.push({ x, y });
        }
      }
    }
    // Limit particles for performance if the text is very long
    return points.length > 2000 ? points.filter((_, i) => i % 2 === 0) : points;
  };

  const explode = () => {
    particles.current.forEach(p => {
      const angle = Math.random() * Math.PI * 2;
      const force = Math.random() * 20 + 10;
      p.vx = Math.cos(angle) * force;
      p.vy = Math.sin(angle) * force;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        // Initial text sampling
        targetPoints.current = sampleText(currentText.current, ctx, canvas.width, canvas.height);
        
        // Create initial particles
        particles.current = targetPoints.current.map(pt => ({
          x: pt.x + (Math.random() - 0.5) * 100,
          y: pt.y + (Math.random() - 0.5) * 100,
          originX: pt.x,
          originY: pt.y,
          vx: 0,
          vy: 0,
          size: Math.random() * 1.5 + 0.5,
          color,
          alpha: Math.random() * 0.4 + 0.6
        }));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.current.forEach((p, i) => {
        const target = targetPoints.current[i] || { x: canvas.width / 2, y: canvas.height / 2 };

        // Physics
        p.vx *= 0.9;
        p.vy *= 0.9;

        const dx = target.x - p.x;
        const dy = target.y - p.y;
        
        p.vx += dx * 0.05;
        p.vy += dy * 0.05;

        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Handle Text Change (Explosion + Transformation)
  useEffect(() => {
    if (text !== currentText.current) {
      explode();
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Wait for explosion to spread
      setTimeout(() => {
        currentText.current = text;
        const newPoints = sampleText(text, ctx, canvas.width, canvas.height);
        targetPoints.current = newPoints;

        // Adjust particle count
        if (newPoints.length > particles.current.length) {
          const diff = newPoints.length - particles.current.length;
          for (let i = 0; i < diff; i++) {
            const source = particles.current[Math.floor(Math.random() * particles.current.length)] || {x: canvas.width/2, y: canvas.height/2};
            particles.current.push({
              ...source,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              alpha: Math.random() * 0.4 + 0.6,
              color
            });
          }
        } else if (newPoints.length < particles.current.length) {
          particles.current = particles.current.slice(0, newPoints.length);
        }
        
        // Update color for all
        particles.current.forEach(p => p.color = color);

      }, 300);
    }
  }, [text, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full pointer-events-none"
      style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }}
    />
  );
};
