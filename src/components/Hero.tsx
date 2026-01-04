import heroBg from "@/assets/hero-bg.jpg";

interface HeroProps {
  title: string;
  subtitle?: string;
  heightClass?: string;
}

const Hero = ({ title, subtitle, heightClass = "h-[20vh]" }: HeroProps) => {
  return (
    <section 
      className={`relative w-full ${heightClass} flex items-center justify-center overflow-hidden`}
    >
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl chalk-text font-bold tracking-wide">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-lg md:text-xl text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Decorative chalk dust effect */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
