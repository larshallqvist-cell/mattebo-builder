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

// PostIt-lapp komponent för korrigering av felaktiga knappar
const CorrectionLabel = ({ 
  text, 
  style 
}: { 
  text: string; 
  style?: React.CSSProperties;
}) => (
  <div 
    className="absolute pointer-events-none z-10"
    style={style}
  >
    <div 
      className="relative bg-[#fffef0] shadow-md transform rotate-[-2deg]"
      style={{
        width: '28px',
        height: '24px',
        boxShadow: '1px 2px 4px rgba(0,0,0,0.3)',
        border: '1px solid #e8e4c9',
      }}
    >
      <span 
        className="absolute inset-0 flex items-center justify-center text-[11px] text-[#1a1a8a]"
        style={{
          fontFamily: "'Caveat', 'Comic Sans MS', cursive",
          fontWeight: 700,
          transform: 'rotate(1deg)',
        }}
      >
        {text}
      </span>
    </div>
  </div>
);

const CalculatorModal = ({ open, onOpenChange }: CalculatorModalProps) => {
  const isMobile = useIsMobile();
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [exponentMode, setExponentMode] = useState(false);
  
  // Now we can scale up with the high-res image
  const scale = isMobile ? Math.min(window.innerWidth / 280, 1.5) : 1.3;
  const baseWidth = 260;
  const baseHeight = 360;
  
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
    setExponentMode(false);
  }, []);
  
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
        case "^":
          newValue = Math.pow(currentValue, inputValue);
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
  
  // Scientific functions
  const insertPi = useCallback(() => {
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
    performOperation("^");
  }, [performOperation]);
  
  const toggleEngNotation = useCallback(() => {
    const value = parseFloat(display.replace(",", "."));
    if (exponentMode) {
      setDisplay(String(value).replace(".", ","));
    } else {
      setDisplay(value.toExponential().replace(".", ","));
    }
    setExponentMode(!exponentMode);
  }, [display, exponentMode]);
  
  // Button sizes scaled
  const btnSize = 34 * scale;
  const gap = 10 * scale;
  
  const Button = ({ 
    onClick, 
    title = ""
  }: { 
    onClick: () => void;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      style={{ width: `${btnSize}px`, height: `${btnSize}px` }}
      className="transition-all duration-150 active:scale-95 rounded-[4px] bg-transparent hover:bg-white/10"
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
            imageRendering: 'auto',
            filter: 'contrast(1.02)',
          }}
        >
          {/* Display area - positioned to match the LCD screen in background */}
          <div 
            className="absolute flex items-center justify-end pr-3"
            style={{ 
              top: `${14 * scale}px`, 
              left: `${18 * scale}px`, 
              right: `${18 * scale}px`, 
              height: `${40 * scale}px` 
            }}
          >
            <div 
              className="text-right font-mono text-[#1a2a1a] truncate font-bold tracking-wider"
              style={{ fontSize: `${18 * scale}px` }}
            >
              {display}
            </div>
          </div>
        
          {/* Korrigeringslappar för felaktiga knappar på bilden */}
          <CorrectionLabel text="xʸ" style={{ top: `${106 * scale}px`, left: `${22 * scale + 3 * (btnSize + gap) + 3 * scale}px` }} />
          <CorrectionLabel text="+" style={{ top: `${(109 + 39) * scale}px`, left: `${22 * scale + 3 * (btnSize + gap) + 3 * scale}px` }} />
          <CorrectionLabel text="−" style={{ top: `${(109 + 39) * scale}px`, left: `${22 * scale + 4 * (btnSize + gap) + 3 * scale}px` }} />
          <CorrectionLabel text="×" style={{ top: `${(109 + 78) * scale}px`, left: `${22 * scale + 3 * (btnSize + gap) + 3 * scale}px` }} />
          <CorrectionLabel text="÷" style={{ top: `${(109 + 78) * scale}px`, left: `${22 * scale + 4 * (btnSize + gap) + 3 * scale}px` }} />

          {/* Button grid container - positioned to match background buttons */}
          <div 
            className="absolute"
            style={{ top: `${109 * scale}px`, left: `${22 * scale}px` }}
          >
            {/* Rad 1: π, √, x², x^y, (tom) */}
            <div className="flex" style={{ gap: `${gap}px`, marginBottom: `${5 * scale}px` }}>
              <Button onClick={insertPi} title="π (Pi)" />
              <Button onClick={squareRoot} title="√ (Roten ur)" />
              <Button onClick={square} title="x² (Kvadrat)" />
              <Button onClick={power} title="x^y (Potens)" />
              <button style={{ width: `${btnSize}px`, height: `${btnSize}px` }} className="opacity-0 pointer-events-none" />
            </div>
            
            {/* Rad 2: 7, 8, 9, +, - */}
            <div className="flex" style={{ gap: `${gap}px`, marginBottom: `${5 * scale}px` }}>
              <Button onClick={() => inputDigit("7")} title="7" />
              <Button onClick={() => inputDigit("8")} title="8" />
              <Button onClick={() => inputDigit("9")} title="9" />
              <Button onClick={() => performOperation("+")} title="+" />
              <Button onClick={() => performOperation("-")} title="-" />
            </div>
            
            {/* Rad 3: 4, 5, 6, ×, ÷ */}
            <div className="flex" style={{ gap: `${gap}px`, marginBottom: `${5 * scale}px` }}>
              <Button onClick={() => inputDigit("4")} title="4" />
              <Button onClick={() => inputDigit("5")} title="5" />
              <Button onClick={() => inputDigit("6")} title="6" />
              <Button onClick={() => performOperation("×")} title="× (Multiplikation)" />
              <Button onClick={() => performOperation("÷")} title="÷ (Division)" />
            </div>
            
            {/* Rad 4: 1, 2, 3 */}
            <div className="flex" style={{ gap: `${gap}px`, marginBottom: `${5 * scale}px` }}>
              <Button onClick={() => inputDigit("1")} title="1" />
              <Button onClick={() => inputDigit("2")} title="2" />
              <Button onClick={() => inputDigit("3")} title="3" />
            </div>
            
            {/* Rad 5: 0, komma, Eng */}
            <div className="flex" style={{ gap: `${gap}px` }}>
              <Button onClick={() => inputDigit("0")} title="0" />
              <Button onClick={inputDecimal} title=", (komma)" />
              <Button onClick={toggleEngNotation} title="Eng (Grundpotensform)" />
            </div>
            
            {/* C-knapp (Clear) - stor knapp position rad 4, kolumn 4 */}
            <button
              onClick={clear}
              title="C (Clear)"
              className="absolute rounded-[4px] transition-all duration-150 active:scale-95 bg-transparent hover:bg-white/10"
              style={{ 
                top: `${(39 * 3) * scale}px`, 
                left: `${3 * (btnSize + gap)}px`,
                width: `${btnSize}px`,
                height: `${btnSize * 2 + 5 * scale}px`
              }}
            />
            
            {/* =-knapp (Lika med) - stor knapp position rad 4-5, kolumn 5 */}
            <button
              onClick={calculate}
              title="= (Lika med)"
              className="absolute rounded-[4px] transition-all duration-150 active:scale-95 bg-transparent hover:bg-white/10"
              style={{ 
                top: `${(39 * 3) * scale}px`, 
                left: `${4 * (btnSize + gap)}px`,
                width: `${btnSize}px`,
                height: `${btnSize * 2 + 5 * scale}px`
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalculatorModal;
