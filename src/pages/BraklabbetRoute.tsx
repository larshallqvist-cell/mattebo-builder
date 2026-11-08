import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Braklabbet from "./Braklabbet";
import BrakTraning from "./BrakTraning";

/** /braklabbet visar bråkträningen; det gamla labbet sparas och visas bara för admin via ?lab=1. */
const BraklabbetRoute = () => {
  const [params] = useSearchParams();
  const { isAdmin } = useAuth();
  return isAdmin && params.get("lab") === "1" ? <Braklabbet /> : <BrakTraning />;
};
export default BraklabbetRoute;
