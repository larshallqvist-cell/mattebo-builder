import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Check, X, ArrowLeft, Shield, Trash2, Pencil, ClipboardList,
  CalendarDays, Inbox, Users, Mail,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import LessonPlanEditor from "@/components/LessonPlanEditor";
import HomeworkEditor from "@/components/HomeworkEditor";
import SurveyAdmin from "@/components/SurveyAdmin";
import CollapsibleAdminSection from "@/components/CollapsibleAdminSection";

interface AccessRequest {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

const Admin = () => {
  const { user, isAdmin, accessStatus, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setRequests(data as AccessRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchRequests();
  }, [isAdmin]);

  const updateStatus = async (id: string, status: "approved" | "denied") => {
    const { error } = await supabase
      .from("access_requests")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "approved" ? "Godkänd!" : "Nekad" });
      fetchRequests();
    }
  };

  const deleteUser = async (r: AccessRequest) => {
    setDeletingId(r.id);
    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { user_id: r.user_id },
    });
    setDeletingId(null);

    const message = (data as any)?.error ?? error?.message;
    if (message) {
      toast({ title: "Kunde inte radera", description: message, variant: "destructive" });
    } else {
      toast({ title: "Användare raderad", description: r.email });
      fetchRequests();
    }
  };

  const DeleteButton = ({ r }: { r: AccessRequest }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={deletingId === r.id} className="gap-1">
          <Trash2 className="w-4 h-4" /> Radera
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Radera användare permanent?</AlertDialogTitle>
          <AlertDialogDescription>
            {r.email} tas bort helt — inloggning, profil och behörighet försvinner.
            Detta går inte att ångra.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteUser(r)}>Radera</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (authLoading || accessStatus === "loading" || accessStatus === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Laddar…</p>
      </div>
    );
  }

  if (!user || accessStatus !== "approved" || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const pending = requests.filter((r) => r.status === "pending");
  const handled = requests.filter((r) => r.status !== "pending");

  const pendingBadge = pending.length > 0 && (
    <span className="relative flex items-center gap-2 shrink-0">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
      </span>
      <span className="text-sm font-semibold text-amber-500">{pending.length} nya</span>
    </span>
  );

  return (
    <div
      className="h-screen w-full overflow-y-auto overscroll-contain bg-background p-6 pt-24"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="max-w-4xl mx-auto space-y-4 pb-24">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-orbitron font-bold text-foreground">
              Admin
            </h1>
          </div>
          {/* Mailbox lamp: lit when new access requests have arrived */}
          <div className="ml-auto flex items-center gap-2" title={pending.length > 0 ? `${pending.length} väntande förfrågningar` : "Inga väntande förfrågningar"}>
            {pending.length > 0 && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
              </span>
            )}
            <Mail className={`w-5 h-5 ${pending.length > 0 ? "text-amber-400" : "text-muted-foreground"}`} />
            {pending.length > 0 && (
              <span className="text-sm font-semibold text-amber-500">{pending.length}</span>
            )}
          </div>
        </div>

        <CollapsibleAdminSection title="Läxruta" icon={<Pencil className="w-5 h-5" />}>
          <HomeworkEditor />
        </CollapsibleAdminSection>

        <CollapsibleAdminSection title="Veckoavstämning" icon={<ClipboardList className="w-5 h-5" />}>
          <SurveyAdmin />
        </CollapsibleAdminSection>

        <CollapsibleAdminSection title="Lektionsplanering" icon={<CalendarDays className="w-5 h-5" />}>
          <LessonPlanEditor />
        </CollapsibleAdminSection>

        {/* Pending */}
        <CollapsibleAdminSection
          title={`Väntande förfrågningar (${pending.length})`}
          icon={<Inbox className="w-5 h-5" />}
          badge={pendingBadge}
        >
          <div className="p-5">
            {loading ? (
              <p className="text-muted-foreground text-sm">Laddar…</p>
            ) : pending.length === 0 ? (
              <p className="text-muted-foreground text-sm">Inga väntande förfrågningar.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Åtgärd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.full_name || "—"}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>
                        {new Date(r.created_at).toLocaleDateString("sv-SE")}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          onClick={() => updateStatus(r.id, "approved")}
                          className="gap-1"
                        >
                          <Check className="w-4 h-4" /> Godkänn
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(r.id, "denied")}
                          className="gap-1"
                        >
                          <X className="w-4 h-4" /> Neka
                        </Button>
                        <DeleteButton r={r} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CollapsibleAdminSection>

        {/* Handled */}
        <CollapsibleAdminSection
          title={`Insläppta och hanterade (${handled.length})`}
          icon={<Users className="w-5 h-5" />}
        >
          <div className="p-5">
            {handled.length === 0 ? (
              <p className="text-muted-foreground text-sm">Inga hanterade ännu.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Åtgärd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {handled.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.full_name || "—"}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>
                        <span
                          className={
                            r.status === "approved"
                              ? "text-green-500"
                              : "text-destructive"
                          }
                        >
                          {r.status === "approved" ? "Godkänd" : "Nekad"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(r.created_at).toLocaleDateString("sv-SE")}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {r.status === "approved" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(r.id, "denied")}
                            className="gap-1"
                          >
                            <X className="w-4 h-4" /> Neka
                          </Button>
                        )}
                        <DeleteButton r={r} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CollapsibleAdminSection>
      </div>
    </div>
  );
};

export default Admin;
