import { useState, useCallback, useRef, useEffect } from "react";
import calculatorBg from "@/assets/THE_LASSE_CULATOR.jpg";

interface CalculatorProps {
  onRadioChange?: (channel: string | null) => void;
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
      {/* Handskriven text */}
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

const Calculator = ({ onRadioChange }: CalculatorProps) => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [activeRadio, setActiveRadio] = useState<string | null>(null);
  const [exponentMode, setExponentMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  // Beräkna skalning baserat på containerns bredd
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const baseWidth = 260;
        const newScale = Math.min(containerWidth / baseWidth, 1.5);
        setScale(newScale);
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  
  const radioChannels = [
    { id: "spa", label: "🧘", name: "Spa - sleep music" },
    { id: "rock", label: "🎸", name: "Classic 70-80's rock" },
    { id: "hiphop", label: "🎤", name: "Hiphop - R'nB" },
  ];
  
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
    // Ersätt komma med punkt för beräkning
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
  
  const toggleRadio = useCallback((channelId: string) => {
    const newChannel = activeRadio === channelId ? null : channelId;
    setActiveRadio(newChannel);
    onRadioChange?.(newChannel);
  }, [activeRadio, onRadioChange]);
  
  // Knappstorlek och gap
  const btnSize = 34;
  const gap = 10;
  
  const Button = ({ 
    onClick, 
    className = "",
    isActive = false,
    title = "",
    children
  }: { 
    onClick: () => void;
    className?: string;
    isActive?: boolean;
    title?: string;
    children?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`
        transition-all duration-150 active:scale-95
        w-[34px] h-[34px] rounded-[4px]
        bg-transparent hover:bg-white/10
        ${isActive ? 'ring-2 ring-[#c9b97a]/60 bg-[#4a4a48]/60' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
  
  return (
    <div ref={containerRef} className="w-full flex justify-center" style={{ height: `${360 * scale}px` }}>
      <div 
        className="relative rounded-xl shadow-2xl origin-top"
        style={{
          backgroundImage: `url(${calculatorBg})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          width: '260px',
          height: '360px',
          transform: `scale(${scale})`,
        }}
      >
        {/* Display area - positioned to match the LCD screen in background */}
        <div className="absolute top-[14px] left-[8px] right-[28px] h-[40px] flex items-center justify-end pr-3">
          <div 
            className="text-right text-lg font-mono truncate font-bold tracking-wider"
            style={{
              color: '#7fff00',
              textShadow: '0 0 8px #7fff00, 0 0 12px #7fff00',
            }}
          >
            {display}
          </div>
        </div>
      
        {/* Korrigeringslapp på knappen i position 5 (tom/tom) - blir dold */}
        {/* Knapp 4 (x^y) har fel märkning på bilden */}
        <CorrectionLabel text="xʸ" style={{ top: '106px', left: `${22 + 3 * (btnSize + gap) + 3}px` }} />
        
        {/* Knapp 9 (+) kan vara felmärkt */}
        <CorrectionLabel text="+" style={{ top: `${109 + (btnSize + gap) + 3}px`, left: `${22 + 3 * (btnSize + gap) + 3}px` }} />
        
        {/* Knapp 10 (-) kan vara felmärkt */}
        <CorrectionLabel text="−" style={{ top: `${109 + (btnSize + gap) + 3}px`, left: `${22 + 4 * (btnSize + gap) + 3}px` }} />
        
        {/* Knapp 14 (×) kan vara felmärkt */}
        <CorrectionLabel text="×" style={{ top: `${109 + 2 * (btnSize + gap) + 3}px`, left: `${22 + 3 * (btnSize + gap) + 3}px` }} />
        
        {/* Knapp 15 (÷) kan vara felmärkt */}
        <CorrectionLabel text="÷" style={{ top: `${109 + 2 * (btnSize + gap) + 3}px`, left: `${22 + 4 * (btnSize + gap) + 3}px` }} />

        {/* Button grid container - positioned to match background buttons */}
        <div className="absolute top-[109px] left-[22px]">
          {/* Rad 1: π, √, x², x^y, (tom) */}
          <div className="flex gap-x-[10px] mb-[5px]">
            <Button onClick={insertPi} title="π (Pi)" />
            <Button onClick={squareRoot} title="√ (Roten ur)" />
            <Button onClick={square} title="x² (Kvadrat)" />
            <Button onClick={power} title="x^y (Potens)" />
            <Button onClick={() => {}} title="" className="opacity-0 pointer-events-none" />
          </div>
          
          {/* Rad 2: 7, 8, 9, +, - */}
          <div className="flex gap-x-[10px] mb-[5px]">
            <Button onClick={() => inputDigit("7")} title="7" />
            <Button onClick={() => inputDigit("8")} title="8" />
            <Button onClick={() => inputDigit("9")} title="9" />
            <Button onClick={() => performOperation("+")} title="+" />
            <Button onClick={() => performOperation("-")} title="-" />
          </div>
          
          {/* Rad 3: 4, 5, 6, ×, ÷ */}
          <div className="flex gap-x-[10px] mb-[5px]">
            <Button onClick={() => inputDigit("4")} title="4" />
            <Button onClick={() => inputDigit("5")} title="5" />
            <Button onClick={() => inputDigit("6")} title="6" />
            <Button onClick={() => performOperation("×")} title="× (Multiplikation)" />
            <Button onClick={() => performOperation("÷")} title="÷ (Division)" />
          </div>
          
          {/* Rad 4: 1, 2, 3 + C (stor knapp som täcker rad 4-5) */}
          <div className="flex gap-x-[10px] mb-[5px]">
            <Button onClick={() => inputDigit("1")} title="1" />
            <Button onClick={() => inputDigit("2")} title="2" />
            <Button onClick={() => inputDigit("3")} title="3" />
            {/* Tom plats för C-knappen */}
          </div>
          
          {/* Rad 5: 0, komma, Eng */}
          <div className="flex gap-x-[10px]">
            <Button onClick={() => inputDigit("0")} title="0" />
            <Button onClick={inputDecimal} title=", (komma)" />
            <Button onClick={toggleEngNotation} title="Eng (Grundpotensform)" />
            {/* Tom plats för =-knappen */}
          </div>
          
          {/* C-knapp (Clear) - stor knapp position rad 4, kolumn 4 */}
          <button
            onClick={clear}
            title="C (Clear)"
            className="absolute top-[117px] w-[34px] h-[76px] rounded-[4px]
              transition-all duration-150 active:scale-95
              bg-transparent hover:bg-white/10"
            style={{ left: `${3 * (btnSize + gap)}px` }}
          />
          
          {/* =-knapp (Lika med) - stor knapp position rad 4-5, kolumn 5 */}
          <button
            onClick={calculate}
            title="= (Lika med)"
            className="absolute top-[117px] w-[34px] h-[76px] rounded-[4px]
              transition-all duration-150 active:scale-95
              bg-transparent hover:bg-white/10"
            style={{ left: `${4 * (btnSize + gap)}px` }}
          />
        </div>
      
        {/* Radio status - positioned at bottom */}
        {activeRadio && (
          <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-[#c9b97a]/80">
            ♪ {radioChannels.find(c => c.id === activeRadio)?.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calculator;