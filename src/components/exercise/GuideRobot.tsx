import robot from "@/assets/guide-robot.webp";
import { cn } from "@/lib/utils";

/** Liten robotguide. Används sparsamt: vid framstegen eller i ett tips. */
const GuideRobot = ({ size = 40, className }: { size?: number; className?: string }) => (
  <img src={robot} alt="" aria-hidden="true" width={size} height={size} loading="lazy" decoding="async"
    className={cn("select-none object-contain drop-shadow-sm", className)} style={{ width: size, height: size }} />
);

export default GuideRobot;
