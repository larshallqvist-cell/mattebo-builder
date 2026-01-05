import { useState, useCallback } from "react";
import calculatorBg from "@/assets/calculator-bg.jpeg";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface CalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CalculatorModal = ({ open, onOpenChange }: CalculatorModalProps) => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState<number>(0);
  
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
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }, [display, waitingForOperand]);
  
  const clear = useCallback(() => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, []);
  
  const backspace = useCallback(() => {
    if (display.length === 1 || (display.length === 2 && display.startsWith("-"))) {
      setDisplay("0");
    } else {
      setDisplay(display.slice(0, -1));
    }
  }, [display]);
  
  const memoryAdd = useCallback(() => {
    setMemory(memory + parseFloat(display));
  }, [memory, display]);
  
  const memoryRecall = useCallback(() => {
    setDisplay(String(memory));
    setWaitingForOperand(true);
  }, [memory]);
  
  const memoryClear = useCallback(() => {
    setMemory(0);
  }, []);
  
  const performOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display);
    
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
        case "^":
          newValue = Math.pow(currentValue, inputValue);
          break;
        default:
          newValue = inputValue;
      }
      
      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }
    
    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation]);
  
  const calculate = useCallback(() => {
    if (operation && previousValue !== null) {
      const inputValue = parseFloat(display);
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
      
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  }, [display, previousValue, operation]);
  
  // Scientific functions
  const insertPi = useCallback(() => {
    setDisplay(String(Math.PI));
    setWaitingForOperand(true);
  }, []);
  
  const squareRoot = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(Math.sqrt(value)));
    setWaitingForOperand(true);
  }, [display]);
  
  const square = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(value * value));
    setWaitingForOperand(true);
  }, [display]);
  
  const power = useCallback(() => {
    performOperation("^");
  }, [performOperation]);
  
  const Button = ({ 
    onClick, 
    className = "",
    title = ""
  }: { 
    onClick: () => void;
    className?: string;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`
        transition-all duration-150 active:scale-95
        w-[34px] h-[34px] rounded-[4px]
        bg-transparent hover:bg-white/10
        ${className}
      `}
    />
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none w-auto max-w-none">
        <DialogTitle className="sr-only">Kalkylator</DialogTitle>
        <div 
          className="relative rounded-xl shadow-2xl"
          style={{
            backgroundImage: `url(${calculatorBg})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            width: '260px',
            height: '360px',
          }}
        >
          {/* Display area - ljusgrå bakgrund med tydlig font */}
          <div 
            className="absolute top-[14px] left-[18px] right-[18px] h-[40px] rounded-sm flex items-center justify-end px-2"
            style={{ backgroundColor: '#c8d4c0' }}
          >
            <div 
              className="text-right truncate font-mono text-[#1a1a1a]"
              style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '1px' }}
            >
              {display}
            </div>
          </div>
          
          {/* Memory indicator */}
          {memory !== 0 && (
            <div className="absolute top-[16px] left-[22px] text-xs text-[#1a2a1a]/60 font-mono">
              M
            </div>
          )}
        
          {/* Button grid container - fast position */}
          <div className="absolute top-[109px] left-[22px]">
            {/* Row 1: π, √, %, ÷, × */}
            <div className="flex gap-x-[10px] mb-[5px]">
              <Button onClick={insertPi} title="π" />
              <Button onClick={squareRoot} title="√" />
              <Button onClick={() => {
                const val = parseFloat(display);
                setDisplay(String(val / 100));
              }} title="%" />
              <Button onClick={() => performOperation("÷")} title="÷" />
              <Button onClick={() => performOperation("×")} title="×" />
            </div>
            
            {/* Row 2: 7, 8, 9, x², − */}
            <div className="flex gap-x-[10px] mb-[5px]">
              <Button onClick={() => inputDigit("7")} title="7" />
              <Button onClick={() => inputDigit("8")} title="8" />
              <Button onClick={() => inputDigit("9")} title="9" />
              <Button onClick={square} title="x²" />
              <Button onClick={() => performOperation("-")} title="−" />
            </div>
            
            {/* Row 3: 4, 5, 6, x^y, + */}
            <div className="flex gap-x-[10px] mb-[5px]">
              <Button onClick={() => inputDigit("4")} title="4" />
              <Button onClick={() => inputDigit("5")} title="5" />
              <Button onClick={() => inputDigit("6")} title="6" />
              <Button onClick={power} title="x^y" />
              <Button onClick={() => performOperation("+")} title="+" />
            </div>
            
            {/* Row 4: 1, 2, 3, M+ (nu: lägg till i minne) */}
            <div className="flex gap-x-[10px] mb-[5px]">
              <Button onClick={() => inputDigit("1")} title="1" />
              <Button onClick={() => inputDigit("2")} title="2" />
              <Button onClick={() => inputDigit("3")} title="3" />
              <Button onClick={memoryAdd} title="M+" />
            </div>
            
            {/* Row 5: 0, ., C, MR (nu: hämta från minne) */}
            <div className="flex gap-x-[10px]">
              <Button onClick={() => inputDigit("0")} title="0" />
              <Button onClick={inputDecimal} title="." />
              <Button onClick={clear} title="C" />
              <Button onClick={memoryRecall} title="MR" />
            </div>
            
            {/* = knappen (dubbelknapp rad 4-5) */}
            <button
              onClick={calculate}
              title="="
              className="absolute right-[-1px] top-[118px] w-[34px] h-[76px] rounded-[4px]
                transition-all duration-150 active:scale-95
                bg-transparent hover:bg-white/10"
            />
          </div>
          
          {/* Extra rad för backspace och MC längst ner */}
          <div className="absolute bottom-4 left-[22px] flex gap-x-[10px]">
            <button
              onClick={backspace}
              title="⌫ Radera"
              className="w-[34px] h-[24px] rounded-[4px] bg-secondary/60 hover:bg-secondary/80 
                text-xs text-secondary-foreground transition-all active:scale-95"
            >
              ⌫
            </button>
            <button
              onClick={memoryClear}
              title="MC Rensa minne"
              className="w-[34px] h-[24px] rounded-[4px] bg-secondary/60 hover:bg-secondary/80 
                text-xs text-secondary-foreground transition-all active:scale-95"
            >
              MC
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalculatorModal;
