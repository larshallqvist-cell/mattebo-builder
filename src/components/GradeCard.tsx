import { Link } from "react-router-dom";
interface GradeCardProps {
  grade: number;
  image: string;
  delay?: number;
}
const GradeCard = ({
  grade,
  image,
  delay = 0
}: GradeCardProps) => {
  const animationClass = delay % 2 === 0 ? "animate-float" : "animate-float-delayed";
  return <Link to={`/ak${grade}`} className="block w-[160px] h-[160px] md:w-[200px] md:h-[200px] lg:w-[240px] lg:h-[240px]">
      <div className={`grade-card relative w-full h-full group ${animationClass}`} style={{
      animationDelay: `${delay * 0.5}s`
    }}>
        {/* Background image */}
        <div className="absolute inset-0 rounded-xl bg-cover bg-center" style={{
        backgroundImage: `url(${image})`
      }} />
        
        {/* Overlay for darkening effect */}
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/10 transition-all duration-500 rounded-xl" />
        
        {/* Grade number */}
        <div className="absolute inset-0 flex items-center justify-center opacity-80 border-solid rounded-md shadow-lg">
          <span className="text-6xl md:text-7xl lg:text-8xl font-display font-bold text-primary drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110">
            {grade}
          </span>
        </div>
        
      </div>
    </Link>;
};
export default GradeCard;