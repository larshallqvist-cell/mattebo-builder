import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, forwardRef } from "react";

const aphorisms = [
  '"Jag har missat mer än 9 000 skott i min karriär. Jag har förlorat nästan 300 matcher. 26 gånger har jag fått förtroendet att ta det avgörande skottet och missat. Jag har misslyckats om och om igen i mitt liv. Och det är därför jag lyckas." - Michael Jordan 🏀',
  '"Mästare skapas inte i gymmen. Mästare skapas av något de har djupt inne i sig – en önskan, en dröm, en vision." - Muhammad Ali 🥊',
  '"Mästare fortsätter spela tills de gör rätt." - Billie Jean King 🎾',
  '"Man drömmer. Man planerar. Man når målet. Det kommer att finnas hinder. Det kommer att finnas tvivlare. Det kommer att finnas misstag. Men med hårt arbete, med tro, med tillit till dig själv och de omkring dig, finns det inga gränser." - Michael Phelps 🏊',
  '"Det finns ingen väg runt hårt arbete. Omfamna det. Du måste lägga ner timmarna eftersom det alltid finns något du kan förbättra." - Roger Federer 🎾',
  '"Ju svårare segern är, desto större är glädjen i att vinna." - Pelé ⚽',
  '"Jag tränade i 4 år för att springa i 9 sekunder. Många ger upp när de inte ser resultat efter två månader." - Usain Bolt ⚡',
  '"Styrka kommer inte från att vinna. Dina kamper utvecklar dina styrkor. När du går igenom svårigheter och bestämmer dig för att inte ge upp, det är styrka." - Arnold Schwarzenegger 💪',
  '"Du kan inte slå den person som aldrig ger upp." - Babe Ruth ⚾',
  '"Var inte rädd för misslyckanden. Det är vägen till framgång." - LeBron James 🏀',
  '"Det är svårare att stanna på toppen än att ta sig dit." - Mia Hamm ⚽',
  '"Tro bara på dig själv. Även om du inte gör det, låtsas att du gör det, och vid någon tidpunkt kommer du att göra det." - Venus Williams 🎾',
  '"Du måste inte bara ha tävlingsinstinkt utan också förmågan att, oavsett omständigheterna, aldrig ge upp." - Abby Wambach ⚽',
  '"Gör alltid en total ansträngning, även när oddsen är emot dig." - Arnold Palmer ⛳',
  '"Om du misslyckas med att förbereda dig, förbereder du dig på att misslyckas." - Mark Spitz 🏊',
  '"Framgång är att gå från misslyckande till misslyckande utan att förlora entusiasmen." - Winston Churchill 🦁',
  '"Botten blev den fasta grunden som jag byggde mitt liv på." - J.K. Rowling 📚',
  '"Du kan möta många nederlag, men du får aldrig bli besegrad." - Maya Angelou ✨',
  '"Det verkar alltid omöjligt tills det är gjort." - Nelson Mandela 🌍',
  '"Förvandla dina sår till visdom." - Oprah Winfrey 💫',
  '"Karaktär kan inte utvecklas i lugn och ro. Endast genom upplevelser av prövningar och lidande kan själen stärkas, ambitionen inspireras och framgång uppnås." - Helen Keller 🌟',
  '"Kom ihåg att din egen beslutsamhet att lyckas är viktigare än något annat." - Abraham Lincoln 🎩',
  '"Vi måste acceptera ändlig besvikelse, men vi får aldrig förlora det oändliga hoppet." - Martin Luther King Jr. ✊',
  '"Vår största svaghet ligger i att ge upp. Det säkraste sättet att lyckas är alltid att försöka bara en gång till." - Thomas Edison 💡',
  '"Det som inte dödar oss gör oss starkare." - Friedrich Nietzsche 🔥',
  '"Det spelar ingen roll hur långsamt du går så länge du inte stannar." - Confucius 🚶',
  '"Det finns inget bättre än motgångar. Varje nederlag, varje hjärtesorg, varje förlust innehåller sitt eget frö, sin egen läxa om hur du kan förbättra din prestation nästa gång." - Malcolm X ✊',
  '"Det handlar inte om huruvida du blir nedslagen, det handlar om huruvida du reser dig upp." - Vince Lombardi 🏈',
  '"Ibland slår livet dig i huvudet med en tegelsten. Förlora inte tron." - Steve Jobs 🍎',
  '"Framgång är 99 procent misslyckande." - Soichiro Honda 🏍️',
  '"Jag vet ingenting om tur, bara att ju mer jag tränar desto mer tur har jag." - Anonymt 🍀',
  '"Fall sju gånger, res dig åtta." - Japanskt ordspråk 🇯🇵',
  '"Om du går genom helvetet, fortsätt gå." - Winston Churchill 🔥',
  '"Det är inte så att jag är så smart, det är bara det att jag stannar kvar vid problemen längre." - Albert Einstein 🧠',
  '"Hinder är de skrämmande saker du ser när du tar ögonen från ditt mål." - Henry Ford 🚗',
  '"Endast de som vågar misslyckas stort kan någonsin uppnå något stort." - Robert F. Kennedy 🌟',
  '"Mod ryter inte alltid. Ibland är mod den tysta rösten vid dagens slut som säger \'Jag ska försöka igen imorgon\'." - Mary Anne Radmacher 🌸',
  '"Du är inte besegrad när du förlorar. Du är besegrad när du ger upp." - Paulo Coelho 📖',
  '"Motgångar skapar män, framgång skapar monster." - Victor Hugo ⚖️',
  '"Gör vad du kan, med vad du har, där du är." - Theodore Roosevelt 🇺🇸',
  '"Det är inte bergen framför dig att bestiga som tröttar ut dig; det är gruset i din sko." - Muhammad Ali 🥊',
  '"Visa mig någon som har gjort något värt att nämna, så ska jag visa dig någon som har övervunnit motgångar." - Lou Holtz 🏈',
  '"Ibland är motgångar vad du behöver möta för att bli framgångsrik." - Zig Ziglar 🎯',
  '"Vi utvecklar inte mod genom att vara glada varje dag. Vi utvecklar det genom att överleva svåra tider och utmana motgångar." - Barbara De Angelis 💎',
  '"Att förvandla känslor till ord kan hjälpa oss att bearbeta och övervinna motgångar." - Sheryl Sandberg 📝',
  '"Ju större hinder, desto mer ära i att övervinna det." - Molière 🎭',
  '"Att bli utmanad i livet är oundvikligt, att bli besegrad är valfritt." - Roger Crawford 🏆',
  '"Den som vet när han ska slåss och när han inte ska slåss kommer att vinna." - Sun Tzu ⚔️',
  '"Var och en av oss har en eld i våra hjärtan för någonting. Det är vårt mål i livet att hitta den och hålla den tänd." - Mary Lou Retton 🤸',
  '"Du har överlevt 100 procent av dina sämsta dagar." - Robin Arzón 🏃',
];

interface MascotPanelProps {
  className?: string;
  /** Slimmer variant: smaller robot and tighter text, for tight columns */
  compact?: boolean;
}

const SparkleEffect = forwardRef<HTMLDivElement>((_, ref) => {
  const particles = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 80,
      y: (Math.random() - 0.5) * 40,
      size: 3 + Math.random() * 4,
      delay: Math.random() * 0.15,
    })), []
  );

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 pointer-events-none overflow-hidden z-10"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            background: "hsl(36 70% 55%)",
            boxShadow: `0 0 ${p.size * 2}px hsl(36 70% 55%), 0 0 ${p.size * 4}px hsl(36 70% 45%)`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
});
SparkleEffect.displayName = "SparkleEffect";

const MascotPanel = forwardRef<HTMLDivElement, MascotPanelProps>(({ className, compact = false }, ref) => {
  const [message, setMessage] = useState(aphorisms[Math.floor(Math.random() * aphorisms.length)]);
  const [isBlinking, setIsBlinking] = useState(false);
  const [sparkleKey, setSparkleKey] = useState(0);

  const triggerSparkle = useCallback(() => {
    setSparkleKey(k => k + 1);
  }, []);

  const getRandomAphorism = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * aphorisms.length);
    setMessage(aphorisms[randomIndex]);
    triggerSparkle();
  }, [triggerSparkle]);

  useEffect(() => {
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
      className={`relative rounded-lg flex items-start ${compact ? 'p-2 gap-2' : 'p-3 gap-3'} ${className || ''}`}
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
        <svg width={compact ? 40 : 60} height={compact ? 47 : 70} viewBox="0 0 60 70" className="drop-shadow-lg">
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
          className={`relative rounded-lg ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}
          style={{
            background: "rgba(64, 224, 208, 0.1)",
            border: "1px solid rgba(64, 224, 208, 0.3)",
          }}
        >
          <AnimatePresence mode="wait">
            <SparkleEffect key={sparkleKey} />
          </AnimatePresence>
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-orbitron font-semibold text-neon-turquoise mb-0.5`}>
            MAT-T-E
          </p>
          <motion.p 
            key={message}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${compact ? 'text-xs leading-snug line-clamp-3' : 'text-sm'} text-foreground/90 font-nunito`}
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
