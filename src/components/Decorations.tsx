import React from 'react';
import { motion } from 'motion/react';

export default function Decorations() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#02050e]">
      {/* Dynamic Theme-Aware Ambient Background Orbs */}
      <motion.div 
        animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{ 
          willChange: "transform",
          background: `radial-gradient(circle, var(--primary-color) 0%, transparent 60%)`
        }}
        className="absolute top-[-25%] left-[-15%] w-[70vw] h-[70vw] opacity-[0.12] rounded-full blur-[140px]"
      />
      <motion.div 
        animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={{ 
          willChange: "transform",
          background: `radial-gradient(circle, var(--primary-color) 0%, transparent 60%)`
        }}
        className="absolute bottom-[-25%] right-[-15%] w-[60vw] h-[60vw] opacity-[0.08] rounded-full blur-[120px]"
      />
      
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_10%,transparent_100%)]"></div>
    </div>
  );
}
