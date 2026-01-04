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
        bg-transparent hover:bg-white/10
        w-10 h-10
        ${isActive ? 'ring-2 ring-[#c9b97a]/50 bg-white/20' : ''}
        ${className}
      `}
    />
  );
  
  return (
    <div 
      className="relative rounded-xl overflow-hidden shadow-2xl"
      style={{
        backgroundImage: `url(${calculatorBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Title */}
      <div className="text-center pt-2 pb-1">
        <span className="text-[#c9b97a] font-bold text-sm tracking-wider drop-shadow-md">
          Lasseculator
        </span>
      </div>
      
      {/* Overlay for button area */}
      <div className="p-4 pt-1">
        {/* Display - LCD style */}
        <div className="bg-[#8b9a6b] rounded-lg p-3 mb-4 border-4 border-[#5a5a4d] shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
          <div className="text-right text-2xl font-mono text-[#1a2a1a] truncate font-bold tracking-wider">
            {display}
          </div>
        </div>
        
        {/* Button grid - 5 columns */}
        <div className="grid grid-cols-5 gap-1.5">
          {/* Row 1: π, √, x², x^y, [Radio: Spa] */}
          <Button onClick={insertPi} title="π" />
          <Button onClick={squareRoot} title="√" />
          <Button onClick={square} title="x²" />
          <Button onClick={power} title="xʸ" />
          <Button 
            onClick={() => toggleRadio("spa")}
            isActive={activeRadio === "spa"}
            title={radioChannels[0].name}
          />
          
          {/* Row 2: 7, 8, 9, ×, [Radio: Rock] */}
          <Button onClick={() => inputDigit("7")} title="7" />
          <Button onClick={() => inputDigit("8")} title="8" />
          <Button onClick={() => inputDigit("9")} title="9" />
          <Button onClick={() => performOperation("×")} title="×" />
          <Button 
            onClick={() => toggleRadio("rock")}
            isActive={activeRadio === "rock"}
            title={radioChannels[1].name}
          />
          
          {/* Row 3: 4, 5, 6, ÷, [Radio: HipHop] */}
          <Button onClick={() => inputDigit("4")} title="4" />
          <Button onClick={() => inputDigit("5")} title="5" />
          <Button onClick={() => inputDigit("6")} title="6" />
          <Button onClick={() => performOperation("÷")} title="÷" />
          <Button 
            onClick={() => toggleRadio("hiphop")}
            isActive={activeRadio === "hiphop"}
            title={radioChannels[2].name}
          />
          
          {/* Row 4: 1, 2, 3, +, = (spans 2 rows) */}
          <Button onClick={() => inputDigit("1")} title="1" />
          <Button onClick={() => inputDigit("2")} title="2" />
          <Button onClick={() => inputDigit("3")} title="3" />
          <Button onClick={() => performOperation("+")} title="+" />
          <Button onClick={calculate} className="row-span-2 h-[84px]" title="=" />
          
          {/* Row 5: 0, ., C, − */}
          <Button onClick={() => inputDigit("0")} title="0" />
          <Button onClick={inputDecimal} title="." />
          <Button onClick={clear} title="C" />
          <Button onClick={() => performOperation("-")} title="−" />
        </div>
        
        {/* Radio status */}
        {activeRadio && (
          <div className="mt-3 text-center text-sm text-[#c9b97a]/80">
            ♪ Spelar: {radioChannels.find(c => c.id === activeRadio)?.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calculator;
