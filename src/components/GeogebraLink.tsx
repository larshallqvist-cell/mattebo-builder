import geogebraLogo from "@/assets/geogebra-logo.png";

interface GeogebraLinkProps {
  compact?: boolean;
  fillSpace?: boolean;
}

const GeogebraLink = ({ compact = false, fillSpace = false }: GeogebraLinkProps) => {
  const baseClasses = `group flex flex-col items-center justify-center rounded-lg overflow-hidden 
    shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105
    border-2 border-secondary/30 hover:border-primary/50
    bg-gradient-to-b from-slate-800 to-slate-900`;
  
  const sizeClasses = fillSpace 
    ? 'w-full h-full p-2' 
    : compact 
      ? 'w-[60px] p-1.5 flex-shrink-0' 
      : 'w-[80px] p-2 flex-shrink-0';

  const iconSize = fillSpace ? 'w-8 h-8 md:w-10 md:h-10' : compact ? 'w-10 h-10' : 'w-12 h-12';
  const textSize = fillSpace ? 'text-[7px] md:text-[8px]' : compact ? 'text-[8px]' : 'text-[9px]';

  return (
    <a
      href="https://www.geogebra.org/classic"
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        window.open('https://www.geogebra.org/classic', '_blank', 'noopener,noreferrer');
      }}
      className={`${baseClasses} ${sizeClasses}`}
      title="Öppna Geogebra"
    >
      <img 
        src={geogebraLogo} 
        alt="Geogebra"
        className={`object-contain ${iconSize}`}
      />
      <span className={`text-foreground/80 font-bold mt-1 group-hover:text-primary transition-colors ${textSize}`}>
        GEOGEBRA
      </span>
    </a>
  );
};

export default GeogebraLink;
