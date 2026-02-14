import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import indieCharacter from "@/assets/indie-character.png";

interface Emotion {
  emoji: string;
  label: string;
}

const emotions: Emotion[] = ["😊", "😍", "🤔", "😴", "🎉"].map(emoji => ({
  emoji,
  label: emoji
}));

const InteractiveCharacter = () => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [emotion, setEmotion] = useState(0);
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string }>>([]);
  const [idleCounter, setIdleCounter] = useState(0);

  // Idle animations
  useEffect(() => {
    const interval = setInterval(() => {
      setIdleCounter(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    setScale(1.15);
    setTimeout(() => setScale(1), 300);

    const newEmotion = (emotion + 1) % emotions.length;
    setEmotion(newEmotion);

    // Add floating emoji
    const id = Date.now();
    const randomEmoji = emotions[Math.floor(Math.random() * emotions.length)].emoji;
    setFloatingEmojis(prev => [...prev, { id, emoji: randomEmoji }]);

    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2000);

    // Random rotation
    setRotation(Math.random() > 0.5 ? -5 : 5);
    setTimeout(() => setRotation(0), 200);
  };

  const handleHover = () => {
    setScale(1.1);
  };

  const handleHoverEnd = () => {
    setScale(1);
  };

  // Idle bounce animation
  const getIdleTransform = () => {
    switch (idleCounter) {
      case 1: return "translateY(-3px) scaleX(1.02)";
      case 2: return "translateY(-5px) scaleX(0.98)";
      case 3: return "translateY(-2px) scaleX(1.01)";
      default: return "translateY(0)";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      {/* Character Container */}
      <motion.div
        className="relative cursor-pointer select-none"
        onClick={handleClick}
        onHoverStart={handleHover}
        onHoverEnd={handleHoverEnd}
        animate={{
          scale: scale,
          rotate: rotation,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 10 }}
      >
        {/* Character Image */}
        <motion.img
          src={indieCharacter}
          alt="Interactive Character"
          className="w-32 h-32 image-rendering-pixelated drop-shadow-lg"
          style={{
            transform: getIdleTransform(),
          }}
        />

        {/* Emotion Display */}
        <motion.div
          className="absolute -top-2 -right-2 text-3xl bg-card rounded-full border-2 border-primary p-2"
          key={emotion}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {emotions[emotion].emoji}
        </motion.div>

        {/* Floating Emojis */}
        <AnimatePresence>
          {floatingEmojis.map((item) => (
            <motion.div
              key={item.id}
              className="absolute left-1/2 top-1/2 text-2xl pointer-events-none"
              initial={{ x: "-50%", y: "0%", opacity: 1 }}
              animate={{
                x: "-50%",
                y: "-80px",
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground font-['JetBrains_Mono']">
          <span className="text-primary">{`> `}</span>clique para interagir
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {emotions[emotion].label}
        </p>
      </div>

      {/* Stats */}
      <motion.div
        className="mt-4 p-4 rounded-lg bg-card/50 border border-border/30 text-xs font-['JetBrains_Mono'] space-y-1 text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <span className="text-primary">mood</span>: {emotions[emotion].emoji}
        </div>
        <div>
          <span className="text-accent">interactions</span>: {emotion + 1}
        </div>
        <div>
          <span className="text-success">status</span>: happy
        </div>
      </motion.div>
    </div>
  );
};

export default InteractiveCharacter;
