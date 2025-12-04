import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileText, Trash2, Copy, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface Document {
  id: string;
  form_type: string;
  form_data: any;
  status: string;
  created_at: string;
  updated_at: string;
}

const formTypeLabels: Record<string, string> = {
  leave_application: "Leave Application",
  money_requisition: "Money Requisition",
  material_requisition: "Material Requisition",
  advance_adjustment: "Advance Adjustment",
};

const formTypeColors: Record<string, string> = {
  leave_application: "bg-tiller-green",
  money_requisition: "bg-accent",
  material_requisition: "bg-tiller-green",
  advance_adjustment: "bg-accent",
};

export default function History() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading documents",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase
      .from("documents")
      .update({ is_deleted: true })
      .eq("id", id);

    setDeleting(null);
    if (error) {
      toast({
        title: "Error deleting document",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Document deleted",
        description: "The document has been moved to trash.",
      });
      setDocuments(documents.filter((doc) => doc.id !== id));
    }
  };

  const handleDuplicate = async (doc: Document) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("documents").insert({
      user_id: user.id,
      form_type: doc.form_type,
      form_data: doc.form_data,
      status: "draft",
    });

    if (error) {
      toast({
        title: "Error duplicating document",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Document duplicated!",
        description: "A copy has been created as a draft.",
      });
      loadDocuments();
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Document History</h1>
          <p className="text-muted-foreground">
            View, duplicate, or delete your saved documents.
          </p>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first document from the dashboard.
              </p>
              <Button 
                onClick={() => navigate("/dashboard")}
                className="bg-tiller-green hover:bg-tiller-green/90"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${formTypeColors[doc.form_type]} flex items-center justify-center flex-shrink-0`}>
                        <FileText className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {formTypeLabels[doc.form_type] || doc.form_type}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Created: {format(new Date(doc.created_at), "PPP 'at' p")}
                        </p>
                        <Badge variant={doc.status === "draft" ? "secondary" : "default"} className="mt-2">
                          {doc.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDuplicate(doc)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicate
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            {deleting === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will move the document to trash. You can restore it later if needed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(doc.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
