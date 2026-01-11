import { useEffect, useRef, useState } from 'react';

interface Snowflake {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wobble: number;
}

export function SnowAnimation() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    // Create initial snowflakes
    const flakes: Snowflake[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      wobble: Math.random() * 2 - 1
    }));

    setSnowflakes(flakes);

    // Animation loop
    let lastTime = 0;
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      setSnowflakes(prev => prev.map(flake => {
        let newY = flake.y + flake.speed * (delta / 50);
        let newX = flake.x + Math.sin(time / 1000 + flake.id) * flake.wobble * 0.1;

        // Reset to top when reaching bottom
        if (newY > 100) {
          newY = -5;
          newX = Math.random() * 100;
        }

        // Wrap horizontally
        if (newX > 100) newX = 0;
        if (newX < 0) newX = 100;

        return { ...flake, x: newX, y: newY };
      }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="snow-animation" ref={containerRef}>
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.x}%`,
            top: `${flake.y}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity
          }}
        />
      ))}
    </div>
  );
}
