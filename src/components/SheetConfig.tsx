import { useState, useEffect } from "react";
import { Settings, X, Save, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const SheetConfig = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetId, setSheetId] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('mattebo_sheet_id');
    if (stored) setSheetId(stored);
  }, []);

  const handleSave = () => {
    if (sheetId.trim()) {
      localStorage.setItem('mattebo_sheet_id', sheetId.trim());
      toast.success('Sheet-ID sparat! Ladda om sidan för att se ändringarna.');
    } else {
      localStorage.removeItem('mattebo_sheet_id');
      toast.info('Sheet-ID borttaget. Fallback-data används.');
    }
    setIsOpen(false);
  };

  const extractSheetId = (input: string): string => {
    // Handle full Google Sheets URLs
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input;
  };

  const handleInputChange = (value: string) => {
    setSheetId(extractSheetId(value));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-secondary hover:bg-secondary/80 rounded-full shadow-lg transition-all hover:scale-110"
        title="Konfigurera Google Sheet"
      >
        <Settings className="w-5 h-5 text-secondary-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Konfigurera Google Sheet</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Google Sheet ID eller URL
            </label>
            <Input
              value={sheetId}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Klistra in Sheet-ID eller hela URL:en"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Sheet-ID:t är den långa koden i URL:en efter /d/
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium text-foreground mb-2">Sheet-struktur:</p>
            <p className="text-xs text-muted-foreground mb-2">
              Skapa en flik per årskurs: <strong>Åk6</strong>, <strong>Åk7</strong>, <strong>Åk8</strong>, <strong>Åk9</strong>
            </p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li><strong>Kolumn A:</strong> Kapitel (1-5)</li>
              <li><strong>Kolumn B:</strong> Kategori (Videolektioner, Spel, etc.)</li>
              <li><strong>Kolumn C:</strong> Länktext</li>
              <li><strong>Kolumn D:</strong> URL</li>
            </ul>
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="mb-1">⚠️ Sheetet måste vara publikt delat ("Anyone with the link can view")</p>
            <a 
              href="https://docs.google.com/spreadsheets/create" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Skapa nytt Google Sheet <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Spara
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetConfig;
