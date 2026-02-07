import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Calendar, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import CalculatorModal from "./CalculatorModal";
import { hapticFeedback } from "@/hooks/useHaptic";

interface MobileBottomNavProps {
  grade?: number;
}

const MobileBottomNav = ({ grade }: MobileBottomNavProps) => {
  const location = useLocation();
  const [showCalculator, setShowCalculator] = useState(false);
  
  const isHome = location.pathname === "/";
  const currentGrade = grade || parseInt(location.pathname.replace("/ak", "")) || 6;
  
  const glowColors: Record<number, string> = {
    6: "hsl(var(--neon-turquoise))",
    7: "hsl(var(--neon-copper))",
    8: "hsl(var(--neon-blue))",
    9: "hsl(var(--neon-violet))",
  };
  
  const glowColor = glowColors[currentGrade] || "hsl(var(--primary))";

  const navItems = [
    { 
      icon: Home, 
      label: "Hem", 
      to: "/", 
      active: isHome 
    },
    ...(grade ? [
      { 
        icon: BookOpen, 
        label: "Resurser", 
        to: `#resources`, 
        active: false,
        scrollTo: "resources"
      },
      { 
        icon: Calendar, 
        label: "Planering", 
        to: `#calendar`, 
        active: false,
        scrollTo: "calendar"
      },
    ] : [
      { icon: BookOpen, label: "Åk 6", to: "/ak6", active: location.pathname === "/ak6" },
      { icon: BookOpen, label: "Åk 7", to: "/ak7", active: location.pathname === "/ak7" },
      { icon: BookOpen, label: "Åk 8", to: "/ak8", active: location.pathname === "/ak8" },
      { icon: BookOpen, label: "Åk 9", to: "/ak9", active: location.pathname === "/ak9" },
    ]),
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    hapticFeedback('light');
    if ('scrollTo' in item && item.scrollTo) {
      const element = document.getElementById(item.scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  const handleCalculatorClick = () => {
    hapticFeedback('medium');
    setShowCalculator(true);
  };

  return (
    <>
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "linear-gradient(180deg, rgba(20, 28, 40, 0.98) 0%, rgba(15, 20, 30, 0.99) 100%)",
          backdropFilter: "blur(20px)",
          borderTop: `2px solid ${glowColor}50`,
          boxShadow: `0 -4px 30px rgba(0, 0, 0, 0.5), 0 0 40px ${glowColor}20`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Glowing top edge */}
        <div 
          className="absolute top-0 left-4 right-4 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${glowColor}80 30%, ${glowColor} 50%, ${glowColor}80 70%, transparent)`,
            boxShadow: `0 0 15px ${glowColor}60`,
          }}
        />
        
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.slice(0, 4).map((item, index) => {
            const Icon = item.icon;
            const isActive = item.active;
            
            return (
              <Link
                key={index}
                to={item.to}
                onClick={() => handleNavClick(item)}
                className="relative flex flex-col items-center justify-center min-w-[65px] py-2 px-3 rounded-xl transition-all duration-200 active:scale-95"
                style={{
                  background: isActive ? `${glowColor}25` : "transparent",
                  boxShadow: isActive ? `0 0 15px ${glowColor}30, inset 0 0 10px ${glowColor}10` : "none",
                }}
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  transition={{ duration: 0.1 }}
                >
                  <Icon 
                    className="w-7 h-7 mb-1" 
                    style={{ 
                      color: isActive ? glowColor : "hsl(var(--muted-foreground))",
                      filter: isActive ? `drop-shadow(0 0 8px ${glowColor})` : "none",
                    }} 
                  />
                </motion.div>
                <span 
                  className="text-[11px] font-nunito font-semibold"
                  style={{ 
                    color: isActive ? glowColor : "hsl(var(--muted-foreground))",
                    textShadow: isActive ? `0 0 8px ${glowColor}` : "none",
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full"
                    style={{ background: glowColor, boxShadow: `0 0 12px ${glowColor}, 0 0 20px ${glowColor}60` }}
                  />
                )}
              </Link>
            );
          })}
          
          {grade && (
            <button
              onClick={handleCalculatorClick}
              className="relative flex flex-col items-center justify-center min-w-[65px] py-2 px-3 rounded-xl transition-all duration-200 active:scale-95 hover:bg-primary/10"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.1 }}
              >
                <Calculator 
                  className="w-7 h-7 mb-1" 
                  style={{ color: "hsl(var(--neon-green))" }} 
                />
              </motion.div>
              <span 
                className="text-[11px] font-nunito font-semibold"
                style={{ color: "hsl(var(--neon-green))" }}
              >
                Räknare
              </span>
            </button>
          )}
        </div>
      </motion.nav>
      
      <CalculatorModal open={showCalculator} onOpenChange={setShowCalculator} />
    </>
  );
};

export default MobileBottomNav;
