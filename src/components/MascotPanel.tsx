import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const fallbackMessages = [
  "Du klarar det här! 🤖",
  "Matematik är som ett pussel – bit för bit!",
  "Fel är bara ett steg mot rätt svar!",
  "Fortsätt kämpa, du är på rätt väg!",
  "Varje problem har en lösning!",
];

interface MascotPanelProps {
  className?: string;
}

const MascotPanel = ({ className }: MascotPanelProps) => {
  const [message, setMessage] = useState(fallbackMessages[0]);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAIMessage = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('mascot-message');
      
      if (error) {
        console.error('Error fetching AI message:', error);
        setMessage(fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]);
      } else if (data?.message) {
        setMessage(data.message);
      }
    } catch (err) {
      console.error('Failed to fetch AI message:', err);
      setMessage(fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    // Fetch initial AI message
    fetchAIMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Change message every 30 seconds
    const messageInterval = setInterval(() => {
      fetchAIMessage();
    }, 30000);

    // Blink every few seconds
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 4000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(blinkInterval);
    };
  }, [fetchAIMessage]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={`relative rounded-lg p-3 flex items-start gap-3 ${className || ''}`}
      style={{
        background: `linear-gradient(135deg, 
          hsl(215 25% 18%) 0%, 
          hsl(215 20% 22%) 100%
        )`,
        border: "1px solid rgba(205, 127, 50, 0.3)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
      }}
    >
      {/* Robot mascot SVG - Clickable */}
      <button
        onClick={fetchAIMessage}
        disabled={isLoading}
        className="flex-shrink-0 relative cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 focus:outline-none"
        title="Klicka för nytt meddelande!"
      >
        <svg width="60" height="70" viewBox="0 0 60 70" className="drop-shadow-lg">
          {/* Body - Calculator shape */}
          <rect 
            x="10" y="20" width="40" height="45" rx="4" 
            fill="url(#bodyGradient)"
            stroke="#8B7355"
            strokeWidth="2"
          />
          
          {/* Screen/Face area */}
          <rect 
            x="15" y="25" width="30" height="20" rx="2"
            fill="#1a1a2e"
            stroke="#40E0D0"
            strokeWidth="1"
          />
          
          {/* Eyes */}
          <motion.circle 
            cx="22" cy="35" r={isBlinking ? 1 : 4}
            fill="#40E0D0"
            animate={{ 
              filter: ["drop-shadow(0 0 3px #40E0D0)", "drop-shadow(0 0 6px #40E0D0)", "drop-shadow(0 0 3px #40E0D0)"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle 
            cx="38" cy="35" r={isBlinking ? 1 : 4}
            fill="#40E0D0"
            animate={{ 
              filter: ["drop-shadow(0 0 3px #40E0D0)", "drop-shadow(0 0 6px #40E0D0)", "drop-shadow(0 0 3px #40E0D0)"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Calculator buttons (body decoration) */}
          {[0, 1, 2].map((row) => (
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={17 + col * 10}
                y={48 + row * 5}
                width="7"
                height="4"
                rx="1"
                fill={col === 2 ? "#CD7F32" : "#4a4a5a"}
                opacity={0.8}
              />
            ))
          ))}
          
          {/* Antenna */}
          <line x1="30" y1="20" x2="30" y2="8" stroke="#8B7355" strokeWidth="2"/>
          <motion.circle 
            cx="30" cy="6" r="4"
            fill={isLoading ? "#FFD700" : "#FF6B6B"}
            animate={{
              opacity: isLoading ? [0.3, 1, 0.3] : [0.5, 1, 0.5],
              filter: isLoading 
                ? ["drop-shadow(0 0 2px #FFD700)", "drop-shadow(0 0 8px #FFD700)", "drop-shadow(0 0 2px #FFD700)"]
                : ["drop-shadow(0 0 2px #FF6B6B)", "drop-shadow(0 0 6px #FF6B6B)", "drop-shadow(0 0 2px #FF6B6B)"]
            }}
            transition={{ duration: isLoading ? 0.5 : 1.5, repeat: Infinity }}
          />
          
          {/* Arms */}
          <rect x="2" y="30" width="8" height="4" rx="2" fill="#8B7355"/>
          <rect x="50" y="30" width="8" height="4" rx="2" fill="#8B7355"/>
          
          {/* Gradients */}
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5a5a6a"/>
              <stop offset="50%" stopColor="#4a4a5a"/>
              <stop offset="100%" stopColor="#3a3a4a"/>
            </linearGradient>
          </defs>
        </svg>
      </button>

      {/* Speech bubble */}
      <div className="relative flex-1">
        {/* Bubble pointer */}
        <div 
          className="absolute left-0 top-3 w-0 h-0 -ml-2"
          style={{
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderRight: "8px solid rgba(64, 224, 208, 0.2)",
          }}
        />
        
        <div 
          className="rounded-lg px-3 py-2"
          style={{
            background: "rgba(64, 224, 208, 0.1)",
            border: "1px solid rgba(64, 224, 208, 0.3)",
          }}
        >
          <p className="text-xs font-orbitron font-semibold text-neon-turquoise mb-1">
            MAT-T-E
          </p>
          <motion.p 
            key={message}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-foreground/90 font-nunito"
          >
            {message}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default MascotPanel;
