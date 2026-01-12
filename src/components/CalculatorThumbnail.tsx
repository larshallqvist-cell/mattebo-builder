import { useState } from "react";
import calculatorBg from "@/assets/THE_LASSE_CULATOR.jpg";
import CalculatorModal from "./CalculatorModal";

const CalculatorThumbnail = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative w-[100px] aspect-[260/360] rounded-lg overflow-hidden 
          shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105
          border-2 border-secondary/30 hover:border-primary/50 flex-shrink-0"
        title="Öppna kalkylatorn"
      >
        <img 
          src={calculatorBg} 
          alt="Kalkylator"
          className="w-full h-full object-cover"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium
            bg-black/50 px-3 py-1 rounded-full">
            Öppna
          </span>
        </div>
      </button>
      
      <CalculatorModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default CalculatorThumbnail;
