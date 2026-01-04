import { useState, useCallback } from "react";

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
        flex items-center justify-center rounded-lg font-bold text-lg
        transition-all duration-150 active:scale-95
        ${isActive ? 'animate-pulse-glow bg-accent text-accent-foreground' : 'bg-calculator-gray text-primary-foreground hover:bg-muted'}
        ${className}
      `}
    >
      {children}
    </button>
  );
  
  return (
    <div className="bg-card rounded-xl p-4 border border-border shadow-lg">
      {/* Display */}
      <div className="bg-muted rounded-lg p-3 mb-4">
        <div className="text-right text-2xl font-mono text-foreground truncate">
          {display}
        </div>
      </div>
      
      {/* Button grid - 5 columns */}
      <div className="grid grid-cols-5 gap-2">
        {/* Row 1: π, √, x², x^y, [Radio: Pluggmusik] */}
        <Button onClick={insertPi} className="h-12 bg-secondary hover:bg-secondary/80">π</Button>
        <Button onClick={squareRoot} className="h-12 bg-secondary hover:bg-secondary/80">√</Button>
        <Button onClick={square} className="h-12 bg-secondary hover:bg-secondary/80">x²</Button>
        <Button onClick={power} className="h-12 bg-secondary hover:bg-secondary/80">xʸ</Button>
        <Button 
          onClick={() => toggleRadio("spa")}
          isActive={activeRadio === "spa"}
          className="h-12"
        >
          <span title={radioChannels[0].name}>{radioChannels[0].label}</span>
        </Button>
        
        {/* Row 2: 7, 8, 9, ×, [Radio: Gubbrock] */}
        <Button onClick={() => inputDigit("7")} className="h-12">7</Button>
        <Button onClick={() => inputDigit("8")} className="h-12">8</Button>
        <Button onClick={() => inputDigit("9")} className="h-12">9</Button>
        <Button onClick={() => performOperation("×")} className="h-12 bg-secondary hover:bg-secondary/80">×</Button>
        <Button 
          onClick={() => toggleRadio("rock")}
          isActive={activeRadio === "rock"}
          className="h-12"
        >
          <span title={radioChannels[1].name}>{radioChannels[1].label}</span>
        </Button>
        
        {/* Row 3: 4, 5, 6, ÷, [Radio: HipHop] */}
        <Button onClick={() => inputDigit("4")} className="h-12">4</Button>
        <Button onClick={() => inputDigit("5")} className="h-12">5</Button>
        <Button onClick={() => inputDigit("6")} className="h-12">6</Button>
        <Button onClick={() => performOperation("÷")} className="h-12 bg-secondary hover:bg-secondary/80">÷</Button>
        <Button 
          onClick={() => toggleRadio("hiphop")}
          isActive={activeRadio === "hiphop"}
          className="h-12"
        >
          <span title={radioChannels[2].name}>{radioChannels[2].label}</span>
        </Button>
        
        {/* Row 4: 1, 2, 3, +, (empty or =) */}
        <Button onClick={() => inputDigit("1")} className="h-12">1</Button>
        <Button onClick={() => inputDigit("2")} className="h-12">2</Button>
        <Button onClick={() => inputDigit("3")} className="h-12">3</Button>
        <Button onClick={() => performOperation("+")} className="h-12 bg-secondary hover:bg-secondary/80">+</Button>
        <Button onClick={calculate} className="h-12 row-span-2 bg-accent hover:bg-accent/80 text-accent-foreground">=</Button>
        
        {/* Row 5: 0, ., Eng, C */}
        <Button onClick={() => inputDigit("0")} className="h-12">0</Button>
        <Button onClick={inputDecimal} className="h-12">.</Button>
        <Button onClick={toggleEngNotation} className="h-12 bg-secondary hover:bg-secondary/80 text-sm">Eng</Button>
        <Button onClick={clear} className="h-12 bg-destructive/80 hover:bg-destructive text-destructive-foreground">C</Button>
      </div>
      
      {/* Radio status */}
      {activeRadio && (
        <div className="mt-3 text-center text-sm text-muted-foreground">
          ♪ Spelar: {radioChannels.find(c => c.id === activeRadio)?.name}
        </div>
      )}
    </div>
  );
};

export default Calculator;
