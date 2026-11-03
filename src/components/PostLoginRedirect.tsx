import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, POST_LOGIN_PATH_KEY } from "@/contexts/AuthContext";
import { isAllowedReturnPath } from "@/lib/braklabbetGate";
import { consentReturnPath } from "@/lib/oauth-return-path";

/** After Google OAuth returns to the site root, send the user back to the approved page (Bråklabbet or an agent-connection consent page). */
const PostLoginRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const path = sessionStorage.getItem(POST_LOGIN_PATH_KEY);
    if (path === null) return;
    sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
    const consent = consentReturnPath(path);
    if (consent) {
      navigate(consent, { replace: true });
    } else if (isAllowedReturnPath(path) && path !== window.location.pathname) {
      navigate(path, { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default PostLoginRedirect;
