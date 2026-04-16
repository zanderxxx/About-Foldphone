import React, { useEffect, useRef } from 'react';

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
  phase: number;
}

interface ParticleWaveProps {
  color?: string;
  triggerId?: string;
}

export const ParticleWave: React.FC<ParticleWaveProps> = ({ color = "#ffffff", triggerId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const lastTriggerId = useRef<string | undefined>(triggerId);

  const initParticles = (width: number, height: number) => {
    const p: Particle[] = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      p.push({
        x,
        y,
        originX: x,
        originY: y,
        vx: 0,
        vy: 0,
        size: Math.random() * 1.5 + 0.5,
        color,
        alpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
    particles.current = p;
  };

  const explode = (width: number, height: number) => {
    particles.current.forEach(p => {
      const angle = Math.random() * Math.PI * 2;
      const force = Math.random() * 25 + 10;
      p.vx = Math.cos(angle) * force;
      p.vy = Math.sin(angle) * force;
      p.size = Math.random() * 3 + 1; // Briefly grow
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        initParticles(canvas.width, canvas.height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() * 0.001;

      particles.current.forEach(p => {
        // Base Wave Motion
        const waveY = canvas.height / 2 + Math.sin(time + p.phase + p.originX * 0.008) * (canvas.height * 0.25);
        const waveX = p.originX;

        // Physics
        p.vx *= 0.94; // Friction
        p.vy *= 0.94;

        // Size decay back to normal
        if (p.size > 1.5) p.size *= 0.98;

        // Gravity towards wave pattern
        const dx = waveX - p.x;
        const dy = waveY - p.y;
        
        // Dynamic gravity: stronger when closer, weaker when far (to allow explosion to travel)
        const dist = Math.sqrt(dx * dx + dy * dy);
        const grav = dist < 50 ? 0.05 : 0.015;
        
        p.vx += dx * grav;
        p.vy += dy * grav;

        p.x += p.vx;
        p.y += p.vy;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Connecting lines for web effect
        particles.current.forEach(other => {
          const distDx = p.x - other.x;
          const distDy = p.y - other.y;
          const distSq = distDx * distDx + distDy * distDy;
          if (distSq < 2000) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - distSq / 2000) * 0.1;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Handle color updates
  useEffect(() => {
    particles.current.forEach(p => {
      p.color = color;
    });
  }, [color]);

  // Handle trigger
  useEffect(() => {
    if (triggerId !== lastTriggerId.current) {
      explode(canvasRef.current?.width || 0, canvasRef.current?.height || 0);
      lastTriggerId.current = triggerId;
    }
  }, [triggerId]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-screen"
    />
  );
};
