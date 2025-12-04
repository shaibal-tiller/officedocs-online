import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileText, Trash2, Copy, Eye, Loader2, Edit, Filter } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface Document {
  id: string;
  document_type: string;
  title: string;
  form_data: any;
  status: string;
  created_at: string;
  updated_at: string;
  attachments: any[];
}

const formTypeLabels: Record<string, string> = {
  leave_application: "Leave Application",
  money_requisition: "Money Requisition",
  material_requisition: "Material Requisition",
  advance_adjustment: "Advance Adjustment",
};

const formTypeRoutes: Record<string, string> = {
  leave_application: "/forms/leave",
  money_requisition: "/forms/money",
  material_requisition: "/forms/material",
  advance_adjustment: "/forms/advance",
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
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
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

    const { data, error } = await (supabase
      .from("documents" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }) as any);

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
    const { error } = await (supabase
      .from("documents" as any)
      .update({ is_deleted: true })
      .eq("id", id) as any);

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

    const { error } = await (supabase.from("documents" as any).insert({
      user_id: user.id,
      document_type: doc.document_type,
      title: `${doc.title} (Copy)`,
      form_data: doc.form_data,
      status: "draft",
      attachments: doc.attachments || [],
    }) as any);

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

  const handleEdit = (doc: Document) => {
    const route = formTypeRoutes[doc.document_type];
    if (route) {
      navigate(`${route}?edit=${doc.id}`);
    }
  };

  const filteredDocuments = typeFilter === "all" 
    ? documents 
    : documents.filter(doc => doc.document_type === typeFilter);

  const renderFormDataPreview = (doc: Document) => {
    const data = doc.form_data;
    if (!data) return null;

    switch (doc.document_type) {
      case "leave_application":
        return (
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {data.fillForAnother ? data.otherName : data.name}</p>
            <p><strong>Leave Type:</strong> {data.leaveCategory?.toUpperCase()}</p>
            <p><strong>Days:</strong> {data.numberOfDays}</p>
            <p><strong>Reason:</strong> {data.reasonForLeave}</p>
          </div>
        );
      case "money_requisition":
        return (
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {data.fillForAnother ? data.otherName : data.name}</p>
            <p><strong>Amount:</strong> {data.totalAmount}</p>
            <p><strong>Purpose:</strong> {data.purposeOfRequisition}</p>
          </div>
        );
      case "material_requisition":
        return (
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {data.fillForAnother ? data.otherName : data.name}</p>
            <p><strong>Items:</strong> {data.items?.length || 0} item(s)</p>
            <p><strong>Purpose:</strong> {data.purposeOfRequisition}</p>
          </div>
        );
      case "advance_adjustment":
        return (
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {data.fillForAnother ? data.otherName : data.name}</p>
            <p><strong>Advance Amount:</strong> {data.advanceAmount}</p>
            <p><strong>Expenses:</strong> {data.totalExpense}</p>
          </div>
        );
      default:
        return <p className="text-sm text-muted-foreground">No preview available</p>;
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Document History</h1>
            <p className="text-muted-foreground">
              View, edit, duplicate, or delete your saved documents.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="leave_application">Leave Applications</SelectItem>
                <SelectItem value="money_requisition">Money Requisitions</SelectItem>
                <SelectItem value="material_requisition">Material Requisitions</SelectItem>
                <SelectItem value="advance_adjustment">Advance Adjustments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {typeFilter === "all" ? "No documents yet" : "No documents found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {typeFilter === "all" 
                  ? "Create your first document from the dashboard."
                  : "No documents match the selected filter."}
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
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${formTypeColors[doc.document_type] || "bg-muted"} flex items-center justify-center flex-shrink-0`}>
                        <FileText className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {doc.title || formTypeLabels[doc.document_type] || doc.document_type}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formTypeLabels[doc.document_type]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {format(new Date(doc.created_at), "PPP 'at' p")}
                        </p>
                        <Badge variant={doc.status === "draft" ? "secondary" : "default"} className="mt-2">
                          {doc.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewDoc(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
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

        {/* View Document Dialog */}
        <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewDoc?.title}</DialogTitle>
            </DialogHeader>
            {viewDoc && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge>{formTypeLabels[viewDoc.document_type]}</Badge>
                  <Badge variant="secondary">{viewDoc.status}</Badge>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  {renderFormDataPreview(viewDoc)}
                </div>

                {viewDoc.attachments && viewDoc.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Attachments</h4>
                    <div className="space-y-1">
                      {viewDoc.attachments.map((att: any, idx: number) => (
                        <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {att.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleEdit(viewDoc)} className="bg-tiller-green hover:bg-tiller-green/90">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Document
                  </Button>
                  <Button variant="outline" onClick={() => setViewDoc(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
