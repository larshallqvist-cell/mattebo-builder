import { motion } from "framer-motion";
import { useState, useEffect, forwardRef } from "react";

const aphorisms = [
  '"Den som vet att han inget vet, vet mer än den som tror sig veta allt." - Sokrates 🦉',
  '"Kunskap är makt." - Francis Bacon ⚡',
  '"Fantasin är viktigare än kunskap." - Albert Einstein 💭',
  '"Livet är det som händer medan du planerar andra saker." - John Lennon 🎵',
  '"I mitt liv har jag haft många bekymmer, de flesta hände aldrig." - Mark Twain 😌',
  '"Det enda jag vet är att jag ingenting vet." - Sokrates 🤔',
  '"Att lära sig är att ständigt upptäcka sin egen okunnighet." - Will Durant 📚',
  '"Den som öppnar en skoldörr, stänger ett fängelse." - Victor Hugo 🚪',
  '"Geni är 1% inspiration och 99% transpiration." - Thomas Edison 💡',
  '"Allt verkar omöjligt tills det är gjort." - Nelson Mandela ✨',
  '"Det svåraste i livet är att känna sig själv." - Thales 🪞',
  '"Den som flyttar berg börjar med att bära små stenar." - Konfucius 🏔️',
  '"Ett sinne som sträckts av nya idéer återgår aldrig till sin ursprungliga form." - Oliver Wendell Holmes 🧠',
  '"Var förändringen du vill se i världen." - Mahatma Gandhi 🌍',
  '"Den enda sanna visdomen är att veta att du ingenting vet." - Sokrates 🌟',
  '"Tid är pengar." - Benjamin Franklin ⏰',
  '"Jag tänker, alltså finns jag." - René Descartes 🧠',
  '"Den som inte lär av historien är dömd att upprepa den." - George Santayana 📜',
  '"Lycka är inte något färdigt. Den kommer från dina egna handlingar." - Dalai Lama 🙏',
  '"Det enda vi har att frukta är fruktan själv." - Franklin D. Roosevelt 💪',
  '"Enkelheten är den yttersta formen av sofistikering." - Leonardo da Vinci 🎨',
  '"Att leva är det sällsyntaste i världen. De flesta existerar bara." - Oscar Wilde ✨',
  '"Den som har ett varför att leva för kan uthärda nästan vilket hur som helst." - Friedrich Nietzsche 🔥',
  '"Bildning är det som finns kvar när man glömt allt man lärt sig." - Ellen Key 🎓',
  '"Tvivel är visdomens början." - René Descartes 🤔',
  '"Ingenting i livet ska fruktas, bara förstås." - Marie Curie 🔬',
  '"Att våga är att förlora fotfästet en stund. Att inte våga är att förlora sig själv." - Søren Kierkegaard 🌊',
  '"Den bästa tiden att plantera ett träd var för 20 år sedan. Den näst bästa är nu." - Kinesiskt ordspråk 🌱',
  '"Framgång är inte slutgiltig, misslyckande är inte fatalt: det är modet att fortsätta som räknas." - Winston Churchill 🦁',
  '"Vi är vad vi upprepade gånger gör. Förträfflighet är alltså inte en handling utan en vana." - Aristoteles 🏛️',
  '"Den som aldrig gjort ett misstag har aldrig provat något nytt." - Albert Einstein 🚀',
  '"Kunskap talar, men visdom lyssnar." - Jimi Hendrix 🎸',
  '"Läs mycket, sov tillräckligt, och oroa dig inte för saker du inte kan påverka." - Marcus Aurelius 📖',
  '"Vägen till tusen mil börjar med ett enda steg." - Lao Tzu 👣',
  '"Det finns inget ädlare än ett sinne som lär sig." - Galileo Galilei 🔭',
  '"Talang vinner matcher, men lagarbete och intelligens vinner mästerskap." - Michael Jordan 🏀',
  '"Svårigheter förbereder vanliga människor för extraordinära öden." - C.S. Lewis 🌟',
  '"Den som är rädd att misslyckas kommer aldrig att vinna." - Pele ⚽',
  '"Utbildning är det mäktigaste vapnet du kan använda för att förändra världen." - Nelson Mandela 📚',
];

interface MascotPanelProps {
  className?: string;
}

const MascotPanel = forwardRef<HTMLDivElement, MascotPanelProps>(({ className }, ref) => {
  const [message, setMessage] = useState(aphorisms[Math.floor(Math.random() * aphorisms.length)]);
  const [isBlinking, setIsBlinking] = useState(false);

  const getRandomAphorism = () => {
    const randomIndex = Math.floor(Math.random() * aphorisms.length);
    setMessage(aphorisms[randomIndex]);
  };

  useEffect(() => {
    // Change message every 30 seconds
    const messageInterval = setInterval(() => {
      getRandomAphorism();
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
  }, []);

  return (
    <motion.div
      ref={ref}
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
        onClick={getRandomAphorism}
        className="flex-shrink-0 relative cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-none"
        title="Klicka för nytt citat!"
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
            fill="#FF6B6B"
            animate={{
              opacity: [0.5, 1, 0.5],
              filter: ["drop-shadow(0 0 2px #FF6B6B)", "drop-shadow(0 0 6px #FF6B6B)", "drop-shadow(0 0 2px #FF6B6B)"]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
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
          <p className="text-sm font-orbitron font-semibold text-neon-turquoise mb-1">
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
});

MascotPanel.displayName = "MascotPanel";

export default MascotPanel;
