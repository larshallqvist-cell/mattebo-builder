import { useState, useEffect } from "react";
import MetalPanel from "./MetalPanel";
import { UtensilsCrossed, Edit2, Save, X, ExternalLink, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// LocalStorage key for persisting menu
const STORAGE_KEY = "mattebo_lunch_menu";

interface DayMenu {
  day: string;
  menu: string;
}

const DEFAULT_MENU: DayMenu[] = [
  { day: "Måndag", menu: "" },
  { day: "Tisdag", menu: "" },
  { day: "Onsdag", menu: "" },
  { day: "Torsdag", menu: "" },
  { day: "Fredag", menu: "" },
];

const LunchMenu = () => {
  const [menuItems, setMenuItems] = useState<DayMenu[]>(DEFAULT_MENU);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState<DayMenu[]>(DEFAULT_MENU);
  const { user } = useAuth();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMenuItems(parsed);
        setEditBuffer(parsed);
      } catch {
        // Invalid data, use defaults
      }
    }
  }, []);

  const handleEdit = () => {
    setEditBuffer([...menuItems]);
    setIsEditing(true);
  };

  const handleSave = () => {
    setMenuItems(editBuffer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(editBuffer));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditBuffer([...menuItems]);
    setIsEditing(false);
  };

  const updateDay = (index: number, menu: string) => {
    const updated = [...editBuffer];
    updated[index] = { ...updated[index], menu };
    setEditBuffer(updated);
  };

  const hasContent = menuItems.some((item) => item.menu.trim() !== "");

  // Get today's day name in Swedish
  const today = new Date().toLocaleDateString("sv-SE", { weekday: "long" });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <MetalPanel className="h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-neon-copper" />
          <h3 className="font-display text-sm text-foreground">Skollunch</h3>
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 rounded hover:bg-primary/20 text-primary transition-colors"
                title="Spara"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground transition-colors"
                title="Avbryt"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              {user ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                    title="Redigera meny"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href="https://sms.schoolsoft.se/letebo/jsp/teacher/right_teacher_lunchmenu.jsp?requestid=6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                    title="Öppna Schoolsoft"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground/50" title="Logga in för att redigera">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          {editBuffer.map((item, index) => (
            <div key={item.day} className="flex gap-2 items-start">
              <span className="text-xs font-medium text-muted-foreground w-14 pt-1.5 shrink-0">
                {item.day.slice(0, 3)}
              </span>
              <input
                type="text"
                value={item.menu}
                onChange={(e) => updateDay(index, e.target.value)}
                placeholder="Skriv dagens rätt..."
                className="flex-1 text-xs bg-background/50 border border-border/50 rounded px-2 py-1.5 
                         text-foreground placeholder:text-muted-foreground/50
                         focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            Tips: Klistra in från Schoolsoft
          </p>
        </div>
      ) : hasContent ? (
        <div className="space-y-1.5">
          {menuItems.map((item) => (
            <div
              key={item.day}
              className={`flex gap-2 text-xs ${
                item.day === todayCapitalized
                  ? "text-primary font-medium"
                  : "text-foreground/80"
              }`}
            >
              <span className="w-14 shrink-0 text-muted-foreground">
                {item.day.slice(0, 3)}
              </span>
              <span className="flex-1">
                {item.menu || (
                  <span className="text-muted-foreground/40">–</span>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-24 text-muted-foreground text-xs text-center gap-2">
          <p>Ingen meny inlagd</p>
          {user ? (
            <button
              onClick={handleEdit}
              className="text-primary hover:underline"
            >
              Lägg in veckans meny →
            </button>
          ) : (
            <p className="text-muted-foreground/60">
              Logga in för att lägga in meny
            </p>
          )}
        </div>
      )}
    </MetalPanel>
  );
};

export default LunchMenu;
