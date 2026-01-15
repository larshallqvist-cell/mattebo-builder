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
  
  // Round button (for scientific functions row) - VISIBLE FOR DEBUGGING
  const RoundButton = ({ 
    onClick, 
    title = ""
  }: { 
    onClick: () => void;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      style={{ width: `${20 * scale}px`, height: `${20 * scale}px` }}
      className="transition-all duration-150 active:scale-95 rounded-full bg-red-500/50 hover:bg-red-500/70 border border-red-400"
    />
  );
  
  // Square button (for number grid) - VISIBLE FOR DEBUGGING
  const SquareButton = ({ 
    onClick, 
    title = "",
    className = ""
  }: { 
    onClick: () => void;
    title?: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      style={{ width: `${28 * scale}px`, height: `${28 * scale}px` }}
      className={`transition-all duration-150 active:scale-95 rounded-[3px] bg-blue-500/50 hover:bg-blue-500/70 border border-blue-400 ${className}`}
    />
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
            className="absolute flex items-center justify-end pr-4"
            style={{ 
              top: `${20 * scale}px`, 
              left: `${20 * scale}px`, 
              right: `${20 * scale}px`, 
              height: `${55 * scale}px` 
            }}
          >
            <div 
              className="text-right font-mono text-[#2a3a2a]/80 truncate font-bold tracking-wider"
              style={{ fontSize: `${22 * scale}px` }}
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
        
          {/* Row 1: Round buttons - Pi, √, x², x^y, (empty) */}
          <div 
            className="absolute flex"
            style={{ 
              top: `${120 * scale}px`, 
              left: `${43 * scale}px`,
              gap: `${10 * scale}px`
            }}
          >
            <RoundButton onClick={inputPi} title="π (Pi)" />
            <RoundButton onClick={squareRoot} title="√" />
            <RoundButton onClick={square} title="x²" />
            <RoundButton onClick={power} title="x^y" />
            <RoundButton onClick={() => {}} title="" />
          </div>

          {/* Square button grid - 5 columns x 5 rows */}
          <div 
            className="absolute"
            style={{ 
              top: `${203 * scale}px`, 
              left: `${34 * scale}px`
            }}
          >
            {/* Row 1: 7, 8, 9, +, - */}
            <div className="flex" style={{ gap: `${7 * scale}px`, marginBottom: `${5 * scale}px` }}>
              <SquareButton onClick={() => inputDigit("7")} title="7" />
              <SquareButton onClick={() => inputDigit("8")} title="8" />
              <SquareButton onClick={() => inputDigit("9")} title="9" />
              <SquareButton onClick={() => performOperation("+")} title="+" />
              <SquareButton onClick={() => performOperation("-")} title="-" />
            </div>
            
            {/* Row 2: 4, 5, 6, ×, ÷ */}
            <div className="flex" style={{ gap: `${7 * scale}px`, marginBottom: `${5 * scale}px` }}>
              <SquareButton onClick={() => inputDigit("4")} title="4" />
              <SquareButton onClick={() => inputDigit("5")} title="5" />
              <SquareButton onClick={() => inputDigit("6")} title="6" />
              <SquareButton onClick={() => performOperation("×")} title="×" />
              <SquareButton onClick={() => performOperation("÷")} title="÷" />
            </div>
            
            {/* Row 3: 1, 2, 3, C, = (dubbelknappar börjar här) */}
            <div className="flex" style={{ gap: `${7 * scale}px`, marginBottom: `${5 * scale}px` }}>
              <SquareButton onClick={() => inputDigit("1")} title="1" />
              <SquareButton onClick={() => inputDigit("2")} title="2" />
              <SquareButton onClick={() => inputDigit("3")} title="3" />
              <SquareButton onClick={clear} title="C" />
              <SquareButton onClick={calculate} title="=" />
            </div>
            
            {/* Row 4: 0, komma, ENG, C, = (dubbelknappar fortsätter) */}
            <div className="flex" style={{ gap: `${7 * scale}px` }}>
              <SquareButton onClick={() => inputDigit("0")} title="0" />
              <SquareButton onClick={inputDecimal} title="," />
              <SquareButton onClick={toggleScientificNotation} title="ENG" />
              <SquareButton onClick={clear} title="C" />
              <SquareButton onClick={calculate} title="=" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalculatorModal;
