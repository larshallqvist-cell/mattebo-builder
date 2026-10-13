import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, POST_LOGIN_PATH_KEY } from "@/contexts/AuthContext";

/** After Google OAuth returns to the site root, send the user back to the page they started from. */
const PostLoginRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const path = sessionStorage.getItem(POST_LOGIN_PATH_KEY);
    if (!path) return;
    sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
    if (path.startsWith("/") && !path.startsWith("//") && path !== window.location.pathname) {
      navigate(path, { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default PostLoginRedirect;
