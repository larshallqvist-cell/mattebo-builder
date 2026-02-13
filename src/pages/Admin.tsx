import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Check, X, ArrowLeft, Shield } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const { user, isAdmin, accessStatus } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!user || accessStatus !== "approved" || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const pending = requests.filter((r) => r.status === "pending");
  const handled = requests.filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-background p-6 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
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
        </div>

        {/* Pending */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-nunito">
              Väntande förfrågningar ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Handled */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-nunito">
              Hanterade ({handled.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
