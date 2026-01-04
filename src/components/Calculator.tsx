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
  
  const radioChannels = [
    { id: "spa", label: "🧘", name: "Spa/Relax" },
    { id: "rock", label: "🎸", name: "Classic Rock" },
    { id: "hiphop", label: "🎤", name: "RnB/HipHop" },
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
        default:
          newValue = inputValue;
      }
      
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  }, [display, previousValue, operation]);
  
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
      
      {/* Button grid - 5x5 */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1: Radio buttons + Clear */}
        {radioChannels.map((channel) => (
          <Button 
            key={channel.id}
            onClick={() => toggleRadio(channel.id)}
            isActive={activeRadio === channel.id}
            className="h-12"
          >
            <span title={channel.name}>{channel.label}</span>
          </Button>
        ))}
        <Button onClick={clear} className="h-12 bg-destructive/80 hover:bg-destructive text-destructive-foreground">
          C
        </Button>
        
        {/* Row 2: 7 8 9 ÷ */}
        <Button onClick={() => inputDigit("7")} className="h-12">7</Button>
        <Button onClick={() => inputDigit("8")} className="h-12">8</Button>
        <Button onClick={() => inputDigit("9")} className="h-12">9</Button>
        <Button onClick={() => performOperation("÷")} className="h-12 bg-secondary hover:bg-secondary/80">÷</Button>
        
        {/* Row 3: 4 5 6 × */}
        <Button onClick={() => inputDigit("4")} className="h-12">4</Button>
        <Button onClick={() => inputDigit("5")} className="h-12">5</Button>
        <Button onClick={() => inputDigit("6")} className="h-12">6</Button>
        <Button onClick={() => performOperation("×")} className="h-12 bg-secondary hover:bg-secondary/80">×</Button>
        
        {/* Row 4: 1 2 3 - */}
        <Button onClick={() => inputDigit("1")} className="h-12">1</Button>
        <Button onClick={() => inputDigit("2")} className="h-12">2</Button>
        <Button onClick={() => inputDigit("3")} className="h-12">3</Button>
        <Button onClick={() => performOperation("-")} className="h-12 bg-secondary hover:bg-secondary/80">−</Button>
        
        {/* Row 5: 0 . = + */}
        <Button onClick={() => inputDigit("0")} className="h-12">0</Button>
        <Button onClick={inputDecimal} className="h-12">.</Button>
        <Button onClick={calculate} className="h-12 bg-accent hover:bg-accent/80 text-accent-foreground">=</Button>
        <Button onClick={() => performOperation("+")} className="h-12 bg-secondary hover:bg-secondary/80">+</Button>
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
