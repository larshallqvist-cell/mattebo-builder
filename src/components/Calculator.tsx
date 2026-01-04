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
    children, 
    onClick, 
    className = "",
    isActive = false
  }: { 
    children: React.ReactNode; 
    onClick: () => void;
    className?: string;
    isActive?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center rounded-sm font-bold text-sm
        transition-all duration-150 active:scale-95
        bg-[#4a4a3d]/70 text-[#c9b97a] border border-[#3a3a2d]/50 
        shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.2)]
        hover:bg-[#5a5a4d]/80 hover:text-[#d9c98a]
        w-[34px] h-[34px]
        ${isActive ? 'animate-pulse-glow bg-[#6a6a5d] ring-2 ring-[#c9b97a]/50' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
  
  return (
    <div 
      className="relative rounded-xl overflow-hidden shadow-2xl w-[220px]"
      style={{
        backgroundImage: `url(${calculatorBg})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for button area */}
      <div className="pt-3 pb-4 px-3">
        {/* Display - LCD style - positioned to match background */}
        <div className="bg-[#8b9a6b]/90 rounded p-2 mb-2 mx-1 border-2 border-[#5a5a4d] shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
          <div className="text-right text-xl font-mono text-[#1a2a1a] truncate font-bold tracking-wider">
            {display}
          </div>
        </div>
        
        
        {/* Button grid - 5 columns */}
        <div className="grid grid-cols-5 gap-[5px] px-1">
          {/* Row 1: π, √, x², x^y, [Radio: Spa] */}
          <Button onClick={insertPi}>π</Button>
          <Button onClick={squareRoot}>√</Button>
          <Button onClick={square}>x²</Button>
          <Button onClick={power}>xʸ</Button>
          <Button 
            onClick={() => toggleRadio("spa")}
            isActive={activeRadio === "spa"}
            className="text-xs"
          >
            <span title={radioChannels[0].name}>{radioChannels[0].label}</span>
          </Button>
          
          {/* Row 2: 7, 8, 9, ×, [Radio: Rock] */}
          <Button onClick={() => inputDigit("7")}>7</Button>
          <Button onClick={() => inputDigit("8")}>8</Button>
          <Button onClick={() => inputDigit("9")}>9</Button>
          <Button onClick={() => performOperation("×")}>×</Button>
          <Button 
            onClick={() => toggleRadio("rock")}
            isActive={activeRadio === "rock"}
            className="text-xs"
          >
            <span title={radioChannels[1].name}>{radioChannels[1].label}</span>
          </Button>
          
          {/* Row 3: 4, 5, 6, ÷, [Radio: HipHop] */}
          <Button onClick={() => inputDigit("4")}>4</Button>
          <Button onClick={() => inputDigit("5")}>5</Button>
          <Button onClick={() => inputDigit("6")}>6</Button>
          <Button onClick={() => performOperation("÷")}>÷</Button>
          <Button 
            onClick={() => toggleRadio("hiphop")}
            isActive={activeRadio === "hiphop"}
            className="text-xs"
          >
            <span title={radioChannels[2].name}>{radioChannels[2].label}</span>
          </Button>
          
          {/* Row 4: 1, 2, 3, +, = (spans 2 rows) */}
          <Button onClick={() => inputDigit("1")}>1</Button>
          <Button onClick={() => inputDigit("2")}>2</Button>
          <Button onClick={() => inputDigit("3")}>3</Button>
          <Button onClick={() => performOperation("+")}>+</Button>
          <Button onClick={calculate} className="row-span-2 h-[73px]">=</Button>
          
          {/* Row 5: 0, ., C, − */}
          <Button onClick={() => inputDigit("0")}>0</Button>
          <Button onClick={inputDecimal}>.</Button>
          <Button onClick={clear} className="text-[#c45a3a]">C</Button>
          <Button onClick={() => performOperation("-")}>−</Button>
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
