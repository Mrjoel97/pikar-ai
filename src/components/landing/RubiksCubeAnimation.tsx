import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function RubiksCubeAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const size = Math.min(window.innerWidth * 0.4, 400);
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const cubeSize = size * 0.15;

    // Rubik's cube colors
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#FFFF33", "#FF33FF", "#33FFFF"];

    // Animation state
    let animationFrame: number;
    let time = 0;
    const cycleDuration = 12000; // 12 seconds per full cycle

    // Individual cube piece class
    class CubePiece {
      x: number;
      y: number;
      z: number;
      targetX: number;
      targetY: number;
      targetZ: number;
      color: string;
      opacity: number;
      rotationX: number;
      rotationY: number;
      rotationZ: number;

      constructor(x: number, y: number, z: number, color: string) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.targetX = x;
        this.targetY = y;
        this.targetZ = z;
        this.color = color;
        this.opacity = 1;
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
      }

      update(phase: number, progress: number) {
        const easeInOutCubic = (t: number) => {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };

        const easedProgress = easeInOutCubic(progress);

        if (phase === 0) {
          // Disassembly phase
          this.targetX = this.x * (1 + easedProgress * 2);
          this.targetY = this.y * (1 + easedProgress * 2);
          this.targetZ = this.z * (1 + easedProgress * 2);
          this.opacity = 1 - easedProgress * 0.5;
          this.rotationX = easedProgress * Math.PI * 2;
          this.rotationY = easedProgress * Math.PI * 1.5;
        } else if (phase === 1) {
          // Reassembly phase
          this.targetX = this.x * (3 - easedProgress * 2);
          this.targetY = this.y * (3 - easedProgress * 2);
          this.targetZ = this.z * (3 - easedProgress * 2);
          this.opacity = 0.5 + easedProgress * 0.5;
          this.rotationX = Math.PI * 2 - easedProgress * Math.PI * 2;
          this.rotationY = Math.PI * 1.5 - easedProgress * Math.PI * 1.5;
        } else {
          // Solving phase - rotate entire cube
          this.targetX = this.x;
          this.targetY = this.y;
          this.targetZ = this.z;
          this.opacity = 1;
          this.rotationX = 0;
          this.rotationY = 0;
          this.rotationZ = easedProgress * Math.PI * 4;
        }
      }

      draw(ctx: CanvasRenderingContext2D, globalRotation: number) {
        ctx.save();
        ctx.translate(centerX, centerY);

        // Apply global rotation
        const rotY = globalRotation;
        const rotX = Math.sin(time * 0.0003) * 0.3;

        // 3D projection
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);

        // Rotate piece
        let x = this.targetX;
        let y = this.targetY;
        let z = this.targetZ;

        // Apply piece rotation
        const cosRX = Math.cos(this.rotationX);
        const sinRX = Math.sin(this.rotationX);
        const cosRY = Math.cos(this.rotationY);
        const sinRY = Math.sin(this.rotationY);
        const cosRZ = Math.cos(this.rotationZ);
        const sinRZ = Math.sin(this.rotationZ);

        // Rotate around X
        let tempY = y * cosRX - z * sinRX;
        let tempZ = y * sinRX + z * cosRX;
        y = tempY;
        z = tempZ;

        // Rotate around Y
        let tempX = x * cosRY + z * sinRY;
        tempZ = -x * sinRY + z * cosRY;
        x = tempX;
        z = tempZ;

        // Rotate around Z
        tempX = x * cosRZ - y * sinRZ;
        tempY = x * sinRZ + y * cosRZ;
        x = tempX;
        y = tempY;

        // Apply global rotation
        tempX = x * cosY - z * sinY;
        tempZ = x * sinY + z * cosY;
        x = tempX;
        z = tempZ;

        tempY = y * cosX - z * sinX;
        tempZ = y * sinX + z * cosX;
        y = tempY;
        z = tempZ;

        // Perspective projection
        const perspective = 600;
        const scale = perspective / (perspective + z);
        const projX = x * scale;
        const projY = y * scale;

        // Draw cube face
        const faceSize = cubeSize * scale;
        ctx.globalAlpha = this.opacity * (0.6 + (z + 200) / 400 * 0.4);
        ctx.fillStyle = this.color;
        ctx.fillRect(projX - faceSize / 2, projY - faceSize / 2, faceSize, faceSize);

        // Draw border
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(projX - faceSize / 2, projY - faceSize / 2, faceSize, faceSize);

        ctx.restore();
      }
    }

    // Create 3x3x3 cube pieces
    const pieces: CubePiece[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const color = colors[Math.floor(Math.random() * colors.length)];
          pieces.push(new CubePiece(x * cubeSize * 1.2, y * cubeSize * 1.2, z * cubeSize * 1.2, color));
        }
      }
    }

    // Animation loop
    const animate = () => {
      time = Date.now();
      const cycleProgress = (time % cycleDuration) / cycleDuration;

      // Determine phase: 0 = disassemble, 1 = reassemble, 2 = solve
      let phase = 0;
      let progress = 0;

      if (cycleProgress < 0.33) {
        phase = 0;
        progress = cycleProgress / 0.33;
      } else if (cycleProgress < 0.66) {
        phase = 1;
        progress = (cycleProgress - 0.33) / 0.33;
      } else {
        phase = 2;
        progress = (cycleProgress - 0.66) / 0.34;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and sort pieces by z-depth
      pieces.forEach(piece => piece.update(phase, progress));
      pieces.sort((a, b) => a.targetZ - b.targetZ);

      // Draw pieces
      const globalRotation = time * 0.0005;
      pieces.forEach(piece => piece.draw(ctx, globalRotation));

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.3 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="opacity-20"
        style={{
          filter: "blur(1px)",
        }}
      />
    </motion.div>
  );
}
