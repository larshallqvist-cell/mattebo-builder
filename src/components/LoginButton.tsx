import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface LoginButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const LoginButton = ({ 
  className, 
  variant = "default",
  size = "default" 
}: LoginButtonProps) => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <Button
      onClick={signInWithGoogle}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      <LogIn className="w-4 h-4 mr-2" />
      Logga in
    </Button>
  );
};

export default LoginButton;
