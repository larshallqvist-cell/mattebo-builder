import { useState, useCallback } from "react";
import calculatorBg from "@/assets/calculator-bg.jpeg";
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
  
  // Responsive sizing: mobile = fullscreen, desktop = larger
  const scale = isMobile ? 1 : 1.4;
  const baseWidth = 260;
  const baseHeight = 360;
  const width = isMobile ? '100vw' : `${baseWidth * scale}px`;
  const height = isMobile ? '100vh' : `${baseHeight * scale}px`;
  
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
  
  // Button size scales with calculator
  const btnSize = isMobile ? 'w-[calc((100vw-100px)/5)] h-[calc((100vw-100px)/5)]' : `w-[${34 * scale}px] h-[${34 * scale}px]`;
  const btnSizeStyle = isMobile 
    ? { width: 'calc((100vw - 100px) / 5)', height: 'calc((100vw - 100px) / 5)', maxWidth: '60px', maxHeight: '60px' }
    : { width: `${34 * scale}px`, height: `${34 * scale}px` };
  const gapSize = isMobile ? 'calc((100vw - 100px) / 25)' : `${10 * scale}px`;
  const rowGap = isMobile ? 'calc((100vw - 100px) / 40)' : `${5 * scale}px`;
  
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
      style={btnSizeStyle}
      className={`
        transition-all duration-150 active:scale-95
        rounded-[4px]
        bg-transparent hover:bg-white/10
        ${className}
      `}
    />
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`p-0 bg-transparent border-none shadow-none ${isMobile ? 'fixed inset-0 w-screen h-screen max-w-none max-h-none m-0 rounded-none translate-x-0 translate-y-0 left-0 top-0' : 'w-auto max-w-none'}`}
      >
        <DialogTitle className="sr-only">Kalkylator</DialogTitle>
        <div 
          className={`relative shadow-2xl ${isMobile ? 'rounded-none' : 'rounded-xl'}`}
          style={{
            backgroundImage: `url(${calculatorBg})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            width: width,
            height: height,
          }}
        >
          {/* Display area - ljusgrå bakgrund med tydlig font */}
          <div 
            className="absolute rounded-sm flex items-center justify-end px-2"
            style={{ 
              backgroundColor: '#c8d4c0',
              top: '6.5%',
              left: '15%',
              right: '15%',
              height: '10.2%'
            }}
          >
            <div 
              className="text-right truncate font-mono text-[#1a1a1a]"
              style={{ fontSize: isMobile ? '28px' : `${20 * scale}px`, fontWeight: 600, letterSpacing: '1px' }}
            >
              {display}
            </div>
          </div>
          
          {/* Memory indicator */}
          {memory !== 0 && (
            <div 
              className="absolute text-[#1a2a1a]/60 font-mono"
              style={{ top: '4.4%', left: '8.5%', fontSize: isMobile ? '14px' : `${12 * scale}px` }}
            >
              M
            </div>
          )}
        
          {/* Button grid container - percentage based positions */}
          <div 
            className="absolute flex flex-col"
            style={{ 
              top: '30.3%', 
              left: '8.5%',
              right: '8.5%',
              gap: rowGap
            }}
          >
            {/* Row 1: π, √, %, ÷, × */}
            <div className="flex" style={{ gap: gapSize }}>
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
            <div className="flex" style={{ gap: gapSize }}>
              <Button onClick={() => inputDigit("7")} title="7" />
              <Button onClick={() => inputDigit("8")} title="8" />
              <Button onClick={() => inputDigit("9")} title="9" />
              <Button onClick={square} title="x²" />
              <Button onClick={() => performOperation("-")} title="−" />
            </div>
            
            {/* Row 3: 4, 5, 6, x^y, + */}
            <div className="flex" style={{ gap: gapSize }}>
              <Button onClick={() => inputDigit("4")} title="4" />
              <Button onClick={() => inputDigit("5")} title="5" />
              <Button onClick={() => inputDigit("6")} title="6" />
              <Button onClick={power} title="x^y" />
              <Button onClick={() => performOperation("+")} title="+" />
            </div>
            
            {/* Row 4: 1, 2, 3, M+ */}
            <div className="flex" style={{ gap: gapSize }}>
              <Button onClick={() => inputDigit("1")} title="1" />
              <Button onClick={() => inputDigit("2")} title="2" />
              <Button onClick={() => inputDigit("3")} title="3" />
              <Button onClick={memoryAdd} title="M+" />
            </div>
            
            {/* Row 5: 0, ., C, MR */}
            <div className="flex" style={{ gap: gapSize }}>
              <Button onClick={() => inputDigit("0")} title="0" />
              <Button onClick={inputDecimal} title="." />
              <Button onClick={clear} title="C" />
              <Button onClick={memoryRecall} title="MR" />
            </div>
          </div>
          
          {/* = knappen (dubbelknapp rad 4-5) */}
          <button
            onClick={calculate}
            title="="
            style={{
              position: 'absolute',
              right: '8.5%',
              top: '62.8%',
              width: btnSizeStyle.width,
              height: isMobile ? 'calc((100vw - 100px) / 5 * 2 + (100vw - 100px) / 40)' : `${(34 * 2 + 5) * scale}px`,
              maxHeight: isMobile ? '125px' : undefined
            }}
            className="rounded-[4px] transition-all duration-150 active:scale-95 bg-transparent hover:bg-white/10"
          />
          
          {/* Extra rad för backspace och MC längst ner */}
          <div 
            className="absolute flex"
            style={{ bottom: '4%', left: '8.5%', gap: gapSize }}
          >
            <button
              onClick={backspace}
              title="⌫ Radera"
              style={{ 
                width: btnSizeStyle.width, 
                height: isMobile ? '32px' : `${24 * scale}px`,
                maxWidth: btnSizeStyle.maxWidth
              }}
              className="rounded-[4px] bg-secondary/60 hover:bg-secondary/80 
                text-xs text-secondary-foreground transition-all active:scale-95"
            >
              ⌫
            </button>
            <button
              onClick={memoryClear}
              title="MC Rensa minne"
              style={{ 
                width: btnSizeStyle.width, 
                height: isMobile ? '32px' : `${24 * scale}px`,
                maxWidth: btnSizeStyle.maxWidth
              }}
              className="rounded-[4px] bg-secondary/60 hover:bg-secondary/80 
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
