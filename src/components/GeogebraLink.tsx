import geogebraLogo from "@/assets/geogebra-logo.png";

interface GeogebraLinkProps {
  compact?: boolean;
}

const GeogebraLink = ({ compact = false }: GeogebraLinkProps) => {
  return (
    <a
      href="https://www.geogebra.org/classic"
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        window.open('https://www.geogebra.org/classic', '_blank', 'noopener,noreferrer');
      }}
      className={`group flex flex-col items-center justify-center rounded-lg overflow-hidden 
        shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105
        border-2 border-secondary/30 hover:border-primary/50 flex-shrink-0
        bg-gradient-to-b from-slate-800 to-slate-900
        ${compact ? 'w-[50px] p-1.5' : 'w-[80px] p-2'}`}
      title="Öppna Geogebra"
    >
      <img 
        src={geogebraLogo} 
        alt="Geogebra"
        className={`object-contain ${compact ? 'w-8 h-8' : 'w-12 h-12'}`}
      />
      <span className={`text-foreground/80 font-bold mt-1 group-hover:text-primary transition-colors
        ${compact ? 'text-[7px]' : 'text-[9px]'}`}>
        GEOGEBRA
      </span>
    </a>
  );
};

export default GeogebraLink;
