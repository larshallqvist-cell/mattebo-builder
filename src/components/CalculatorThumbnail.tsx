import { useState } from "react";
import calculatorBg from "@/assets/THE_LASSE_CULATOR_2.jpg";
import CalculatorModal from "./CalculatorModal";

interface CalculatorThumbnailProps {
  compact?: boolean;
  fillSpace?: boolean;
}

const CalculatorThumbnail = ({ compact = false, fillSpace = false }: CalculatorThumbnailProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const baseClasses = `group relative rounded-lg overflow-hidden 
    shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105
    border-2 border-secondary/30 hover:border-primary/50`;
  
  const sizeClasses = fillSpace 
    ? 'w-full h-full' 
    : compact 
      ? 'w-[60px] aspect-[260/360] flex-shrink-0' 
      : 'w-[100px] aspect-[260/360] flex-shrink-0';
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`${baseClasses} ${sizeClasses}`}
        title="Öppna kalkylatorn"
      >
        <img 
          src={calculatorBg} 
          alt="Kalkylator"
          className="w-full h-full object-cover"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className={`opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium
            bg-black/50 rounded-full ${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-sm px-3 py-1'}`}>
            Öppna
          </span>
        </div>
      </button>
      
      <CalculatorModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default CalculatorThumbnail;
