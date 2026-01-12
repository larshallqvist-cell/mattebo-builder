import Hero from "@/components/Hero";
import GradeCard from "@/components/GradeCard";
import ak6Image from "@/assets/ak6.jpg";
import ak7Image from "@/assets/ak7.jpg";
import ak8Image from "@/assets/ak8.jpg";
import ak9Image from "@/assets/ak9.jpg";
const gradeData = [{
  grade: 6,
  image: ak6Image
}, {
  grade: 7,
  image: ak7Image
}, {
  grade: 8,
  image: ak8Image
}, {
  grade: 9,
  image: ak9Image
}];
const Index = () => {
  return <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Hero Section - 20% */}
      <div className="relative">
        <Hero title="Lasses mattegrejor" />
        
        {/* Glowing divider line - yellow like the chalk text */}
        <div style={{
        background: 'linear-gradient(90deg, transparent, hsl(var(--chalk-yellow)) 15%, hsl(var(--chalk-yellow)) 85%, transparent)'
      }} className="absolute bottom-0 left-0 right-0 h-[4px] animate-glow-pulse-yellow px-[50px] text-primary mx-0 py-[10px] my-[3px] border-0" />
      </div>
      
      {/* Grade Selection - 80% */}
      <main className="flex-1 flex items-start justify-center px-4 pt-4 md:pt-8">
        <div className="w-full max-w-6xl">
      {/* Title with impatient letter animations */}
          <h2 className="text-2xl md:text-3xl text-center text-foreground mb-4 md:mb-6 animate-fade-in flex justify-center gap-[1px]">
            {"Välj din årskurs".split("").map((letter, i) => (
              <span
                key={i}
                className={letter === " " ? "w-2" : "inline-block animate-impatient"}
                style={{ 
                  animationDelay: `${i * 0.1 + Math.random() * 0.5}s`,
                  animationDuration: `${0.8 + Math.random() * 0.6}s`
                }}
              >
                {letter}
              </span>
            ))}
          </h2>
          
          {/* Grade Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 justify-items-center my-[5px]">
            {gradeData.map((item, index) => <div key={item.grade} className="animate-scale-in" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <GradeCard grade={item.grade} image={item.image} delay={index} />
              </div>)}
          </div>
          
          {/* Footer hint */}
          <p className="text-center text-muted-foreground mt-8 md:mt-12 text-sm animate-fade-in" style={{
          animationDelay: '0.5s'
        }}>
            Klicka på en årskurs för att se resurser och lektionsplaneringar
          </p>
        </div>
      </main>
    </div>;
};
export default Index;