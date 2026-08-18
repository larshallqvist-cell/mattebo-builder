import { useState, useEffect, useCallback } from "react";
import MetalPanel from "./MetalPanel";
import { UtensilsCrossed, Edit2, Save, X, ExternalLink, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DayMenu {
  day: string;
  date: string; // ISO date string
  menu: string;
}

const WEEKDAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];

// Get a week's dates (Mon-Fri), offset in weeks from the current one
const getWeekDates = (offset = 0): { day: string; date: string }[] => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);

  return WEEKDAYS.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { day, date: d.toISOString().split("T")[0] };
  });
};

// ISO week number for a date string
const getWeekNumber = (iso: string): number => {
  const d = new Date(iso + "T00:00:00Z");
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
};

interface LunchMenuProps {
  /** Renders a single compact row without the surrounding panel */
  compact?: boolean;
}

const LunchMenu = ({ compact = false }: LunchMenuProps) => {
  const [menuItems, setMenuItems] = useState<DayMenu[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState<DayMenu[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const weekDates = getWeekDates(0);

  const loadWeek = useCallback(async (offset: number): Promise<DayMenu[]> => {
    const wd = getWeekDates(offset);
    const { data, error } = await supabase
      .from("lunch_menu")
      .select("date, menu_text")
      .in("date", wd.map((d) => d.date));

    if (error) {
      console.error("Error fetching lunch menu:", error);
      return wd.map((d) => ({ ...d, menu: "" }));
    }
    return wd.map((d) => ({
      ...d,
      menu: data?.find((row) => row.date === d.date)?.menu_text || "",
    }));
  }, []);

  // Fetch this week's menu from database
  useEffect(() => {
    loadWeek(0).then((items) => {
      setMenuItems(items);
      setEditBuffer(items);
      setLoading(false);
    });
  }, [loadWeek]);

  const goToWeek = async (offset: number) => {
    setWeekOffset(offset);
    setEditBuffer(await loadWeek(offset));
  };

  const handleEdit = () => {
    setWeekOffset(0);
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

    if (weekOffset === 0) setMenuItems(editBuffer);
    setIsEditing(false);
    setWeekOffset(0);
  };

  const handleCancel = () => {
    setWeekOffset(0);
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

  if (compact) {
    if (isEditing) {
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <button onClick={() => goToWeek(weekOffset - 1)} className="p-1 rounded hover:bg-primary/20 text-muted-foreground" title="Föregående vecka">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-medium text-foreground">
              Vecka {editBuffer[0] ? getWeekNumber(editBuffer[0].date) : ""}
              {weekOffset === 0 ? " (denna)" : ""}
            </span>
            <button onClick={() => goToWeek(weekOffset + 1)} className="p-1 rounded hover:bg-primary/20 text-muted-foreground" title="Nästa vecka">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {editBuffer.map((item, index) => (
            <div key={item.date} className="flex gap-2 items-center">
              <span className="text-[10px] font-medium text-muted-foreground w-8 shrink-0">
                {item.day.slice(0, 3)}
              </span>
              <input
                type="text"
                value={item.menu}
                onChange={(e) => updateDay(index, e.target.value)}
                placeholder="Dagens rätt..."
                className="flex-1 min-w-0 text-[11px] bg-background/50 border border-border/50 rounded px-2 py-1
                         text-foreground placeholder:text-muted-foreground/50
                         focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          ))}
          <div className="flex justify-end gap-1">
            <button onClick={handleSave} className="p-1 rounded hover:bg-primary/20 text-primary" title="Spara">
              <Save className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleCancel} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground" title="Avbryt">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 min-w-0 text-xs">
        <UtensilsCrossed className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        {loading ? (
          <span className="text-muted-foreground/60">Laddar meny...</span>
        ) : isWeekend ? (
          <span className="text-muted-foreground/60">Ingen skollunch idag 🌙</span>
        ) : todayMenu?.menu.trim() ? (
          <span className="truncate text-foreground" title={todayMenu.menu}>
            <span className="text-muted-foreground mr-1">{todayCapitalized.slice(0, 3)}:</span>
            {todayMenu.menu}
          </span>
        ) : (
          <span className="text-muted-foreground/60 truncate">Ingen meny inlagd för idag</span>
        )}
        {user && (
          <>
            <button
              onClick={handleEdit}
              className="ml-auto p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              title="Redigera meny"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <a
            href="https://sms.schoolsoft.se/letebo/jsp/teacher/right_teacher_lunchmenu.jsp?requestid=6"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
            title="Öppna Schoolsoft"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </>
        )}
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <button onClick={() => goToWeek(weekOffset - 1)} className="p-1 rounded hover:bg-primary/20 text-muted-foreground" title="Föregående vecka">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-foreground">
              Vecka {editBuffer[0] ? getWeekNumber(editBuffer[0].date) : ""}
              {weekOffset === 0 ? " (denna)" : ""}
            </span>
            <button onClick={() => goToWeek(weekOffset + 1)} className="p-1 rounded hover:bg-primary/20 text-muted-foreground" title="Nästa vecka">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
