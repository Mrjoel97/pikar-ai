import { motion, useTime, useTransform } from "framer-motion";

export default function HeroBackgroundAnimation() {
  const time = useTime();
  
  // Continuous rotation
  const rotateX = useTransform(time, [0, 20000], [0, 360], { clamp: false });
  const rotateY = useTransform(time, [0, 30000], [0, 360], { clamp: false });
  
  // Cycle for breathing/deforming effect (every 6 seconds)
  const pulse = useTransform(time, (t) => {
    const cycle = (t % 6000) / 6000;
    return Math.sin(cycle * Math.PI * 2); // Oscillates between -1 and 1
  });

  // Transform values based on the pulse
  const separation = useTransform(pulse, [-1, 1], [100, 180]); // Distance of faces from center
  const opacity = useTransform(pulse, [-1, 0, 1], [0.2, 0.5, 0.2]);
  const scale = useTransform(pulse, [-1, 1], [0.8, 1.1]);
  
  // Dynamic color shift
  const color1 = useTransform(pulse, [-1, 1], ["rgba(16, 185, 129, 0.2)", "rgba(59, 130, 246, 0.2)"]); // Emerald to Blue
  const borderColor = useTransform(pulse, [-1, 1], ["rgba(16, 185, 129, 0.5)", "rgba(59, 130, 246, 0.5)"]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none -z-1 perspective-[1000px]">
      <motion.div
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: "preserve-3d",
        }}
        className="relative w-64 h-64"
      >
        {/* Cube Faces */}
        <CubeFace rotateX={0} rotateY={0} translateZ={separation} bg={color1} border={borderColor} />
        <CubeFace rotateX={0} rotateY={180} translateZ={separation} bg={color1} border={borderColor} />
        <CubeFace rotateX={0} rotateY={90} translateZ={separation} bg={color1} border={borderColor} />
        <CubeFace rotateX={0} rotateY={-90} translateZ={separation} bg={color1} border={borderColor} />
        <CubeFace rotateX={90} rotateY={0} translateZ={separation} bg={color1} border={borderColor} />
        <CubeFace rotateX={-90} rotateY={0} translateZ={separation} bg={color1} border={borderColor} />
        
        {/* Inner Core (Wireframe) */}
        <motion.div 
          className="absolute inset-0 m-auto w-32 h-32 border border-primary/30 rounded-lg"
          style={{
            rotateX: useTransform(time, [0, 10000], [0, -360], { clamp: false }),
            rotateY: useTransform(time, [0, 15000], [0, -360], { clamp: false }),
            transformStyle: "preserve-3d",
          }}
        />
      </motion.div>
    </div>
  );
}

function CubeFace({ rotateX, rotateY, translateZ, bg, border }: any) {
  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        z: translateZ,
        backgroundColor: bg,
        borderColor: border,
      }}
      className="absolute inset-0 border-2 rounded-xl backdrop-blur-[1px] shadow-[0_0_15px_rgba(0,0,0,0.05)]"
    />
  );
}