import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Calendar, Calculator, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import CalculatorModal from "./CalculatorModal";

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
    if ('scrollTo' in item && item.scrollTo) {
      const element = document.getElementById(item.scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
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
          borderTop: `1px solid ${glowColor}30`,
          boxShadow: `0 -4px 20px rgba(0, 0, 0, 0.4), 0 0 30px ${glowColor}10`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 4).map((item, index) => {
            const Icon = item.icon;
            const isActive = item.active;
            
            return (
              <Link
                key={index}
                to={item.to}
                onClick={() => handleNavClick(item)}
                className="relative flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-xl transition-all duration-200 active:scale-95"
                style={{
                  background: isActive ? `${glowColor}20` : "transparent",
                }}
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  transition={{ duration: 0.1 }}
                >
                  <Icon 
                    className="w-6 h-6 mb-1" 
                    style={{ 
                      color: isActive ? glowColor : "hsl(var(--muted-foreground))",
                      filter: isActive ? `drop-shadow(0 0 6px ${glowColor})` : "none",
                    }} 
                  />
                </motion.div>
                <span 
                  className="text-[10px] font-nunito font-medium"
                  style={{ 
                    color: isActive ? glowColor : "hsl(var(--muted-foreground))",
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                    style={{ background: glowColor, boxShadow: `0 0 10px ${glowColor}` }}
                  />
                )}
              </Link>
            );
          })}
          
          {/* Calculator button */}
          {grade && (
            <button
              onClick={() => setShowCalculator(true)}
              className="relative flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-xl transition-all duration-200 active:scale-95"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.1 }}
              >
                <Calculator 
                  className="w-6 h-6 mb-1" 
                  style={{ color: "hsl(var(--muted-foreground))" }} 
                />
              </motion.div>
              <span className="text-[10px] font-nunito font-medium text-muted-foreground">
                Kalkylator
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
