import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CollapsibleAdminSectionProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * Expandable/collapsible section for the admin page.
 * Collapsed by default; content mounts only when opened.
 */
const CollapsibleAdminSection = ({
  title,
  icon,
  badge,
  children,
  defaultOpen = false,
}: CollapsibleAdminSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-accent/40 transition-colors"
      >
        {icon && <span className="text-primary shrink-0">{icon}</span>}
        <span className="font-nunito font-semibold text-lg text-foreground flex-1">
          {title}
        </span>
        {badge}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground shrink-0"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-1 pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default CollapsibleAdminSection;
