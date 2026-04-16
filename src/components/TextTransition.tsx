import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface TextTransitionProps {
  text: string;
  className?: string;
}

export const TextTransition: React.FC<TextTransitionProps> = ({ text, className }) => {
  const [displayText, setDisplayText] = useState(text);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 500;
      canvas.height = canvas.parentElement?.clientHeight || 200;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.alpha *= 0.96;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      // Remove dead particles
      particles.current = particles.current.filter(p => p.alpha > 0.01);

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const triggerExplosion = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Spawn particles from the text area
    const count = 50;
    const rect = textRef.current?.getBoundingClientRect();
    const parentRect = canvas.parentElement?.getBoundingClientRect();
    
    if (!rect || !parentRect) return;

    const startX = rect.left - parentRect.left + rect.width / 2;
    const startY = rect.top - parentRect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      particles.current.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        alpha: 1,
        color: "#ffffff"
      });
    }
  };

  useEffect(() => {
    if (text !== displayText) {
      triggerExplosion();
      setTimeout(() => {
        setDisplayText(text);
      }, 150);
    }
  }, [text]);

  return (
    <div className="relative w-full">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-10"
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={displayText}
          ref={textRef}
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={className}
        >
          {displayText}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
