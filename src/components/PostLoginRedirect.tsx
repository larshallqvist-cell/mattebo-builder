import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, POST_LOGIN_PATH_KEY } from "@/contexts/AuthContext";
import { isAllowedReturnPath } from "@/lib/braklabbetGate";

/** After Google OAuth returns to the site root, send the user back to the approved page (only /braklabbet). */
const PostLoginRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const path = sessionStorage.getItem(POST_LOGIN_PATH_KEY);
    if (path === null) return;
    sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
    if (isAllowedReturnPath(path) && path !== window.location.pathname) {
      navigate(path, { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default PostLoginRedirect;
