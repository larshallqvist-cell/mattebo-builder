import { useState, useCallback } from "react";
import calculatorBg from "@/assets/calculator-bg.jpeg";

interface CalculatorProps {
  onRadioChange?: (channel: string | null) => void;
}

const Calculator = ({ onRadioChange }: CalculatorProps) => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [activeRadio, setActiveRadio] = useState<string | null>(null);
  const [exponentMode, setExponentMode] = useState(false);
  
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
    setExponentMode(false);
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
  
  const toggleEngNotation = useCallback(() => {
    const value = parseFloat(display);
    if (exponentMode) {
      setDisplay(String(value));
    } else {
      setDisplay(value.toExponential());
    }
    setExponentMode(!exponentMode);
  }, [display, exponentMode]);
  
  const toggleRadio = useCallback((channelId: string) => {
    const newChannel = activeRadio === channelId ? null : channelId;
    setActiveRadio(newChannel);
    onRadioChange?.(newChannel);
  }, [activeRadio, onRadioChange]);
  
  const Button = ({ 
    onClick, 
    className = "",
    isActive = false,
    title = ""
  }: { 
    onClick: () => void;
    className?: string;
    isActive?: boolean;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`
        transition-all duration-150 active:scale-95
        bg-white/10 hover:bg-white/20 border border-white/40
        w-[32px] h-[32px] rounded-sm
        ${isActive ? 'ring-2 ring-[#c9b97a]/50 bg-white/30' : ''}
        ${className}
      `}
    />
  );
  
  return (
    <div 
      className="relative rounded-xl overflow-hidden shadow-2xl flex-shrink-0"
      style={{
        backgroundImage: `url(${calculatorBg})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        width: '260px',
        height: '360px',
      }}
    >
      {/* Display area - positioned to match the LCD screen in background */}
      <div className="absolute top-[14px] left-[18px] right-[18px] h-[40px] flex items-center justify-end pr-3">
        <div className="text-right text-lg font-mono text-[#1a2a1a] truncate font-bold tracking-wider">
          {display}
        </div>
      </div>
      
      {/* Button grid container - positioned to match background buttons */}
      <div className="absolute top-[112px] left-[18px]">
        {/* Row 1: 5 knappar */}
        <div className="flex gap-x-[14px] mb-[8px]">
          <Button onClick={insertPi} title="π" />
          <Button onClick={squareRoot} title="√" />
          <Button onClick={() => {
            const val = parseFloat(display);
            setDisplay(String(val / 100));
          }} title="%" />
          <Button onClick={() => performOperation("÷")} title="÷" />
          <Button onClick={() => performOperation("×")} title="×" />
        </div>
        
        {/* Row 2: 5 knappar */}
        <div className="flex gap-x-[14px] mb-[8px]">
          <Button onClick={() => inputDigit("7")} title="7" />
          <Button onClick={() => inputDigit("8")} title="8" />
          <Button onClick={() => inputDigit("9")} title="9" />
          <Button onClick={square} title="x²" />
          <Button onClick={() => performOperation("-")} title="−" />
        </div>
        
        {/* Row 3: 5 knappar */}
        <div className="flex gap-x-[14px] mb-[8px]">
          <Button onClick={() => inputDigit("4")} title="4" />
          <Button onClick={() => inputDigit("5")} title="5" />
          <Button onClick={() => inputDigit("6")} title="6" />
          <Button onClick={power} title="x^y" />
          <Button onClick={() => performOperation("+")} title="+" />
        </div>
        
        {/* Row 4: 4 knappar + start av dubbelknapp */}
        <div className="flex gap-x-[14px] mb-[8px]">
          <Button onClick={() => inputDigit("1")} title="1" />
          <Button onClick={() => inputDigit("2")} title="2" />
          <Button onClick={() => inputDigit("3")} title="3" />
          <Button onClick={() => toggleRadio("spa")} isActive={activeRadio === "spa"} title="Spa" />
        </div>
        
        {/* Row 5: 4 knappar */}
        <div className="flex gap-x-[14px]">
          <Button onClick={() => inputDigit("0")} title="0" />
          <Button onClick={inputDecimal} title="." />
          <Button onClick={clear} title="C" />
          <Button onClick={() => toggleRadio("rock")} isActive={activeRadio === "rock"} title="Rock" />
        </div>
        
        {/* Dubbelknapp = (höjd över rad 4-5) längst ner till höger */}
        <button
          onClick={calculate}
          title="="
          className="absolute right-0 top-[120px] w-[32px] h-[72px] rounded-sm
            transition-all duration-150 active:scale-95
            bg-white/10 hover:bg-white/20 border border-white/40"
        />
        
      </div>
      
      {/* Radio status - positioned at bottom */}
      {activeRadio && (
        <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-[#c9b97a]/80">
          ♪ {radioChannels.find(c => c.id === activeRadio)?.name}
        </div>
      )}
    </div>
  );
};

export default Calculator;
