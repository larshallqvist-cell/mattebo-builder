import { GraduationCap, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Teacher-only chip: switch between the teacher's own view and the view a
 * student gets (no post-it toggle, no upload buttons, no admin links).
 */
const StudentViewToggle = ({ compact = false }: { compact?: boolean }) => {
  const { isTeacher, studentView, setStudentView } = useAuth();
  if (!isTeacher) return null;

  const Icon = studentView ? Shield : GraduationCap;

  return (
    <button
      type="button"
      onClick={() => setStudentView(!studentView)}
      aria-pressed={studentView}
      title={
        studentView
          ? "Du ser sidan som en elev – klicka för att tillbaka till lärarvyn"
          : "Klicka för att se sidan precis som en elev"
      }
      className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-xs font-nunito font-semibold shadow-sm transition-colors sm:px-3 sm:py-1 ${
        studentView
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/85"
          : "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      <span className={compact ? "hidden sm:inline" : ""}>
        {studentView ? "Lärarvy" : "Elevvy"}
      </span>
    </button>
  );
};

export default StudentViewToggle;
