import mattebokenLogo from "@/assets/matteboken-logo.png";

interface MattebokenLinkProps {
  compact?: boolean;
}

const MattebokenLink = ({ compact = false }: MattebokenLinkProps) => {
  return (
    <a
      href="https://www.matteboken.se"
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        window.open('https://www.matteboken.se', '_blank', 'noopener,noreferrer');
      }}
      className={`group flex flex-col items-center justify-center rounded-lg overflow-hidden 
        shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105
        border-2 border-secondary/30 hover:border-primary/50 flex-shrink-0
        bg-gradient-to-b from-slate-800 to-slate-900
        ${compact ? 'w-[60px] p-1.5' : 'w-[80px] p-2'}`}
      title="Öppna Matteboken"
    >
      <img 
        src={mattebokenLogo} 
        alt="Matteboken"
        className={`object-contain ${compact ? 'w-10 h-10' : 'w-12 h-12'}`}
      />
      <span className={`text-foreground/80 font-bold mt-1 group-hover:text-primary transition-colors
        ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
        MATTEBOKEN
      </span>
    </a>
  );
};

export default MattebokenLink;
