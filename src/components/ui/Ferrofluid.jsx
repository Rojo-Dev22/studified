import { useEffect, useRef } from 'react';

/**
 * Ferrofluid – animated fluid background using canvas.
 * Smooth, flowing blobs that morph and connect like liquid.
 */
export default function Ferrofluid({
  colors = ['#10B981', '#06B6D4', '#3B82F6'],
  speed = 0.5,
  className = '',
  style = {},
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let resizeTimeout;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 100);
    });

    // Create animated blobs
    const blobs = [];
    for (let i = 0; i < 6; i++) {
      blobs.push({
        x: Math.random(),
        y: Math.random(),
        radius: 0.12 + Math.random() * 0.18,
        vx: (Math.random() - 0.5) * 0.002 * speed,
        vy: (Math.random() - 0.5) * 0.002 * speed,
        phase: Math.random() * Math.PI * 2,
        colorIndex: i % colors.length,
        pulseSpeed: 0.8 + Math.random() * 0.6,
        pulseAmp: 0.1 + Math.random() * 0.15,
      });
    }

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;

      if (w === 0 || h === 0) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, w, h);
      const time = Date.now() * 0.001;

      // Update blobs
      for (const blob of blobs) {
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Gentle wandering
        blob.vx += (Math.random() - 0.5) * 0.0003;
        blob.vy += (Math.random() - 0.5) * 0.0003;
        blob.vx *= 0.999;
        blob.vy *= 0.999;

        // Wrap
        if (blob.x < -0.15) blob.x = 1.15;
        if (blob.x > 1.15) blob.x = -0.15;
        if (blob.y < -0.15) blob.y = 1.15;
        if (blob.y > 1.15) blob.y = -0.15;
      }

      // Draw connecting fluid tendrils first (behind blobs)
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < blobs.length; i++) {
        for (let j = i + 1; j < blobs.length; j++) {
          const a = blobs[i];
          const b = blobs[j];
          const ax = a.x * w;
          const ay = a.y * h;
          const bx = b.x * w;
          const by = b.y * h;
          const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
          const maxDist = Math.min(w, h) * 0.4;
          if (dist < maxDist) {
            const t = 1 - dist / maxDist;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = colors[a.colorIndex % colors.length];
            ctx.lineWidth = t * 12;
            ctx.globalAlpha = t * 0.15;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Draw blobs
      for (const blob of blobs) {
        const cx = blob.x * w;
        const cy = blob.y * h;
        const baseRadius = blob.radius * Math.min(w, h);
        const pulse = 1 + Math.sin(time * blob.pulseSpeed + blob.phase) * blob.pulseAmp;
        const radius = baseRadius * pulse;

        // Glow
        const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2);
        const color = colors[blob.colorIndex % colors.length];
        glowGrad.addColorStop(0, color + '20');
        glowGrad.addColorStop(1, color + '00');
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Main blob
        const nextColor = colors[(blob.colorIndex + 1) % colors.length];
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, color);
        grad.addColorStop(0.4, color + 'C0');
        grad.addColorStop(0.7, nextColor + '60');
        grad.addColorStop(1, nextColor + '00');

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.55;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [colors, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0, ...style }}
    />
  );
}
