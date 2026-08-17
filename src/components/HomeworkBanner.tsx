import { GraduationCap } from "lucide-react";
import { useHomework } from "@/hooks/useHomework";

interface HomeworkBannerProps {
  grade: number;
  className?: string;
}

/** Rectangular highlight box at the very top of a grade page. */
const HomeworkBanner = ({ grade, className = "" }: HomeworkBannerProps) => {
  const { title, content, loading } = useHomework(grade);

  if (loading || !content.trim()) return null;

  return (
    <section
      className={`rounded-xl border px-4 py-2.5 ${className}`}
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--homework-bg-soft)) 0%, hsl(var(--homework-bg)) 100%)",
        borderColor: "hsl(var(--homework-border))",
        color: "hsl(var(--homework-text))",
        boxShadow: "0 12px 28px -18px hsl(var(--homework-border) / 0.9)",
      }}
    >
      <h2 className="flex items-center gap-2 font-orbitron text-sm md:text-base font-bold uppercase tracking-wide">
        <GraduationCap className="h-4 w-4" />
        {title}
      </h2>
      <p className="mt-1 whitespace-pre-line font-nunito text-sm md:text-[0.95rem] leading-snug">
        {content}
      </p>
    </section>
  );
};

export default HomeworkBanner;
