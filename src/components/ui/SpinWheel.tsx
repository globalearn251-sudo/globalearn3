import { useEffect, useRef, useState } from 'react';

interface SpinWheelProps {
  segments: Array<{
    label: string;
    color: string;
    value: number;
  }>;
  onSpinEnd?: (winningIndex: number) => void;
  isSpinning: boolean;
  winningIndex?: number; // Add prop to specify winning segment
}

export function SpinWheel({ segments, onSpinEnd, isSpinning, winningIndex }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [targetRotation, setTargetRotation] = useState(0);
  const [canvasSize, setCanvasSize] = useState(400);

  // Handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Set canvas size to container width, min 200px, max 400px
        const size = Math.max(200, Math.min(containerWidth - 40, 400));
        setCanvasSize(size);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    drawWheel();
  }, [segments, rotation, canvasSize]);

  useEffect(() => {
    if (isSpinning) {
      // Use provided winning index or random if not specified
      const finalWinningIndex = winningIndex !== undefined 
        ? winningIndex 
        : Math.floor(Math.random() * segments.length);
      
      const segmentAngle = 360 / segments.length;
      const targetAngle = 360 * 5 + (360 - finalWinningIndex * segmentAngle) + segmentAngle / 2;
      
      setTargetRotation(targetAngle);
      
      // Animate rotation
      const duration = 4000; // 4 seconds
      const startTime = Date.now();
      const startRotation = rotation;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRotation = startRotation + (targetAngle - startRotation) * easeOut;
        
        setRotation(currentRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          onSpinEnd?.(finalWinningIndex);
        }
      };

      animate();
    }
  }, [isSpinning, winningIndex]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure canvas size is valid
    if (canvasSize <= 0 || segments.length === 0) return;

    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const radius = Math.max(10, Math.min(centerX, centerY) - 10);

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Save context
    ctx.save();

    // Rotate canvas
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Draw segments
    const segmentAngle = (2 * Math.PI) / segments.length;

    segments.forEach((segment, index) => {
      const startAngle = index * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      // Responsive font size
      const fontSize = Math.max(10, Math.min(14, canvasSize / 22));
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillText(segment.label, radius * 0.65, 0);
      ctx.restore();
    });

    // Draw center circle (responsive) - ensure positive radius
    const centerCircleRadius = Math.max(5, canvasSize / 10);
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerCircleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw inner circle (responsive) - ensure positive radius
    const innerCircleRadius = Math.max(3, canvasSize / 16);
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerCircleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();

    // Restore context
    ctx.restore();
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full max-w-md">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-primary drop-shadow-lg" />
      </div>
      
      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="drop-shadow-2xl"
        />
      </div>
    </div>
  );
}
