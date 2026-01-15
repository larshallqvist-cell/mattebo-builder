import { useState, useCallback } from "react";
import calculatorBg from "@/assets/THE_LASSE_CULATOR_2.jpg";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CalculatorModal = ({ open, onOpenChange }: CalculatorModalProps) => {
  const isMobile = useIsMobile();
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState<number>(0);
  
  // Image exact aspect ratio: 473:815 ≈ 0.58:1
  const baseWidth = 237;
  const baseHeight = 408;
  const scale = isMobile ? Math.min(window.innerWidth / 260, 1.6) : 1.5;
  
  const inputDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  }, [display, waitingForOperand]);
  
  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay("0,");
      setWaitingForOperand(false);
    } else if (!display.includes(",") && !display.includes(".")) {
      setDisplay(display + ",");
    }
  }, [display, waitingForOperand]);
  
  const clear = useCallback(() => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, []);
  
  const memoryAdd = useCallback(() => {
    setMemory(memory + parseFloat(display.replace(",", ".")));
  }, [memory, display]);
  
  const memoryRecall = useCallback(() => {
    setDisplay(String(memory).replace(".", ","));
    setWaitingForOperand(true);
  }, [memory]);
  
  const inputPi = useCallback(() => {
    setDisplay(String(Math.PI).replace(".", ","));
    setWaitingForOperand(true);
  }, []);
  
  const squareRoot = useCallback(() => {
    const value = parseFloat(display.replace(",", "."));
    setDisplay(String(Math.sqrt(value)).replace(".", ","));
    setWaitingForOperand(true);
  }, [display]);
  
  const square = useCallback(() => {
    const value = parseFloat(display.replace(",", "."));
    setDisplay(String(value * value).replace(".", ","));
    setWaitingForOperand(true);
  }, [display]);
  
  const power = useCallback(() => {
    const inputValue = parseFloat(display.replace(",", "."));
    setPreviousValue(inputValue);
    setOperation("^");
    setWaitingForOperand(true);
  }, [display]);
  
  const toggleScientificNotation = useCallback(() => {
    const value = parseFloat(display.replace(",", "."));
    const currentDisplay = display.replace(",", ".");
    
    // Toggle between scientific and decimal notation
    if (currentDisplay.includes("e")) {
      // Convert from scientific to decimal
      setDisplay(String(value).replace(".", ","));
    } else {
      // Convert to scientific notation
      setDisplay(value.toExponential().replace(".", ","));
    }
    setWaitingForOperand(true);
  }, [display]);
  
  const performOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display.replace(",", "."));
    
    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue;
      let newValue: number;
      
      switch (operation) {
        case "+":
          newValue = currentValue + inputValue;
          break;
        case "-":
          newValue = currentValue - inputValue;
          break;
        case "×":
          newValue = currentValue * inputValue;
          break;
        case "÷":
          newValue = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
        default:
          newValue = inputValue;
      }
      
      setDisplay(String(newValue).replace(".", ","));
      setPreviousValue(newValue);
    }
    
    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation]);
  
  const calculate = useCallback(() => {
    if (operation && previousValue !== null) {
      const inputValue = parseFloat(display.replace(",", "."));
      let newValue: number;
      
      switch (operation) {
        case "+":
          newValue = previousValue + inputValue;
          break;
        case "-":
          newValue = previousValue - inputValue;
          break;
        case "×":
          newValue = previousValue * inputValue;
          break;
        case "÷":
          newValue = inputValue !== 0 ? previousValue / inputValue : 0;
          break;
        case "^":
          newValue = Math.pow(previousValue, inputValue);
          break;
        default:
          newValue = inputValue;
      }
      
      setDisplay(String(newValue).replace(".", ","));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  }, [display, previousValue, operation]);
  
  const percent = useCallback(() => {
    const value = parseFloat(display.replace(",", "."));
    setDisplay(String(value / 100).replace(".", ","));
    setWaitingForOperand(true);
  }, [display]);
  
  // Correction label - paper taped over button
  const CorrectionLabel = ({ text, crossed = false }: { text: string; crossed?: boolean }) => (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{ 
        background: 'linear-gradient(135deg, #f5f0e6 0%, #ebe4d4 100%)',
        boxShadow: '1px 1px 3px rgba(0,0,0,0.3)',
        borderRadius: '2px',
        transform: 'rotate(-1deg)',
      }}
    >
      <span 
        className="font-caveat font-bold relative"
        style={{ 
          color: '#3d2b1f',
          fontSize: `${22 * scale}px`,
        }}
      >
        {text}
        {crossed && (
          <span 
            className="absolute inset-0 flex items-center justify-center"
            style={{ 
              color: '#8b0000',
              fontSize: `${14 * scale}px`,
              transform: 'rotate(15deg)',
            }}
          >
            ×
          </span>
        )}
      </span>
    </div>
  );

  // Square button with optional correction label
  const SquareButton = ({ 
    onClick, 
    label = "",
    correction = "",
    crossed = false,
    title = "",
    large = false,
    className = ""
  }: { 
    onClick: () => void;
    label?: string;
    correction?: string;
    crossed?: boolean;
    title?: string;
    large?: boolean;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      title={title || correction || label}
      style={{ 
        width: `${28 * scale}px`, 
        height: `${28 * scale}px`,
        fontSize: large ? `${38 * scale}px` : `${22 * scale}px`
      }}
      className={`relative font-mathematics text-white transition-all duration-100 active:scale-90 active:brightness-90 hover:brightness-110 rounded-[3px] flex items-center justify-center ${className}`}
    >
      {label}
      {correction && <CorrectionLabel text={correction} crossed={crossed} />}
    </button>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`p-0 bg-transparent border-none shadow-none ${isMobile ? 'fixed inset-0 w-screen h-screen max-w-none max-h-none m-0 rounded-none translate-x-0 translate-y-0 left-0 top-0 flex items-center justify-center' : 'w-auto max-w-none'}`}
      >
        <DialogTitle className="sr-only">Kalkylator</DialogTitle>
        <div 
          className="relative rounded-xl shadow-2xl"
          style={{
            backgroundImage: `url(${calculatorBg})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            width: `${baseWidth * scale}px`,
            height: `${baseHeight * scale}px`,
          }}
        >
          {/* Display area - positioned to match the LCD screen */}
          <div 
            className="absolute flex items-center justify-end"
            style={{ 
              top: `${26 * scale}px`, 
              left: `${-2 * scale}px`, 
              right: `${50 * scale}px`, 
              height: `${55 * scale}px` 
            }}
          >
            <div 
              className="text-right font-mono truncate font-bold tracking-wider"
              style={{ 
                fontSize: `${22 * scale}px`,
                color: '#7fff00',
                textShadow: '0 0 8px rgba(127, 255, 0, 0.6)'
              }}
            >
              {display}
            </div>
          </div>
          
          {/* Memory indicator */}
          {memory !== 0 && (
            <div 
              className="absolute text-[#2a3a2a]/50 font-mono text-xs"
              style={{ top: `${25 * scale}px`, left: `${25 * scale}px` }}
            >
              M
            </div>
          )}
        
          {/* Round buttons removed - inactive */}

          {/* Square button grid - 5 columns x 5 rows */}
          <div 
            className="absolute"
            style={{ 
              top: `${203 * scale}px`, 
              left: `${34 * scale}px`
            }}
          >
            {/* Row 1: Pi, √, x², x^y, (tom) */}
            <div className="flex" style={{ gap: `${7 * scale}px`, marginBottom: `${5 * scale}px` }}>
              <SquareButton onClick={inputPi} correction="π" />
              <SquareButton onClick={squareRoot} correction="√" />
              <SquareButton onClick={square} correction="x²" />
              <SquareButton onClick={power} correction="xⁿ" />
              <SquareButton onClick={() => {}} label="" />
            </div>
            
            {/* Row 2: 7, 8, 9, +, - */}
            <div className="flex" style={{ gap: `${7 * scale}px`, marginBottom: `${5 * scale}px` }}>
              <SquareButton onClick={() => inputDigit("7")} label="" />
              <SquareButton onClick={() => inputDigit("8")} correction="8" />
              <SquareButton onClick={() => inputDigit("9")} correction="9" />
              <SquareButton onClick={() => performOperation("+")} correction="+" />
              <SquareButton onClick={() => performOperation("-")} correction="−" />
            </div>
            
            {/* Row 3: 4, 5, 6, ×, ÷ */}
            <div className="flex" style={{ gap: `${7 * scale}px`, marginBottom: `${5 * scale}px` }}>
              <SquareButton onClick={() => inputDigit("4")} label="" />
              <SquareButton onClick={() => inputDigit("5")} label="" />
              <SquareButton onClick={() => inputDigit("6")} correction="6" />
              <SquareButton onClick={() => performOperation("×")} correction="×" />
              <SquareButton onClick={() => performOperation("÷")} correction="÷" />
            </div>
            
            {/* Row 4: 1, 2, 3, C, = (dubbelknappar börjar här) */}
            <div className="flex" style={{ gap: `${7 * scale}px`, marginBottom: `${5 * scale}px` }}>
              <SquareButton onClick={() => inputDigit("1")} label="" />
              <SquareButton onClick={() => inputDigit("2")} label="" />
              <SquareButton onClick={() => inputDigit("3")} correction="3" />
              <SquareButton onClick={clear} correction="C" />
              <SquareButton onClick={calculate} label="" />
            </div>
            
            {/* Row 5: 0, komma, ENG, C, = (dubbelknappar fortsätter) */}
            <div className="flex" style={{ gap: `${7 * scale}px` }}>
              <SquareButton onClick={() => inputDigit("0")} label="" />
              <SquareButton onClick={inputDecimal} correction="," />
              <SquareButton onClick={toggleScientificNotation} correction="E" />
              <SquareButton onClick={clear} correction="C" />
              <SquareButton onClick={calculate} label="" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalculatorModal;
