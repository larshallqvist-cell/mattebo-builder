import { useState, useEffect } from "react";
import MetalPanel from "./MetalPanel";
import { UtensilsCrossed, Edit2, Save, X, ExternalLink, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DayMenu {
  day: string;
  date: string; // ISO date string
  menu: string;
}

const WEEKDAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];

// Get the current week's dates (Mon-Fri)
const getCurrentWeekDates = (): { day: string; date: string }[] => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  return WEEKDAYS.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { day, date: d.toISOString().split("T")[0] };
  });
};

const LunchMenu = () => {
  const [menuItems, setMenuItems] = useState<DayMenu[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState<DayMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const weekDates = getCurrentWeekDates();

  // Fetch this week's menu from database
  useEffect(() => {
    const fetchMenu = async () => {
      const dates = weekDates.map((d) => d.date);
      const { data, error } = await supabase
        .from("lunch_menu")
        .select("date, menu_text")
        .in("date", dates);

      if (error) {
        console.error("Error fetching lunch menu:", error);
        setLoading(false);
        return;
      }

      const items: DayMenu[] = weekDates.map((wd) => {
        const found = data?.find((row) => row.date === wd.date);
        return { day: wd.day, date: wd.date, menu: found?.menu_text || "" };
      });

      setMenuItems(items);
      setEditBuffer(items);
      setLoading(false);
    };

    fetchMenu();
  }, []);

  const handleEdit = () => {
    setEditBuffer([...menuItems]);
    setIsEditing(true);
  };

  const handleSave = async () => {
    // Upsert all days that have content
    const upserts = editBuffer
      .filter((item) => item.menu.trim() !== "")
      .map((item) => ({
        date: item.date,
        menu_text: item.menu.trim(),
      }));

    // Delete days that were cleared
    const deletes = editBuffer
      .filter((item) => item.menu.trim() === "")
      .map((item) => item.date);

    if (upserts.length > 0) {
      const { error } = await supabase
        .from("lunch_menu")
        .upsert(upserts, { onConflict: "date" });
      if (error) {
        console.error("Error saving lunch menu:", error);
        return;
      }
    }

    if (deletes.length > 0) {
      const { error } = await supabase
        .from("lunch_menu")
        .delete()
        .in("date", deletes);
      if (error) {
        console.error("Error deleting lunch menu:", error);
        return;
      }
    }

    setMenuItems(editBuffer);
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
  const isWeekend = !WEEKDAYS.includes(todayCapitalized);
  const todayMenu = menuItems.find((item) => item.day === todayCapitalized);

  return (
    <MetalPanel className="h-full">
      <div className="flex items-center justify-between mb-2">
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

      {loading ? (
        <p className="text-xs text-muted-foreground/60 py-1">Laddar meny...</p>
      ) : isEditing ? (
        <div className="space-y-2">
          {editBuffer.map((item, index) => (
            <div key={item.date} className="flex gap-2 items-start">
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
      ) : isWeekend ? (
        <p className="text-xs text-muted-foreground/60 py-1">Ingen skollunch idag 🌙</p>
      ) : hasContent && todayMenu?.menu.trim() ? (
        <div className="flex gap-2 text-xs text-primary font-medium">
          <span className="shrink-0 text-muted-foreground">{todayCapitalized.slice(0, 3)}</span>
          <span>{todayMenu.menu}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <p>Ingen meny inlagd för idag</p>
          {user && (
            <button onClick={handleEdit} className="text-primary hover:underline">
              Lägg in →
            </button>
          )}
        </div>
      )}
    </MetalPanel>
  );
};

export default LunchMenu;
