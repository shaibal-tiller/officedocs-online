import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { FileText, Trash2, Edit, Filter } from "lucide-react";
import { format } from "date-fns";
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
import { useNavigate } from "react-router-dom";
import { useDrafts, DraftDocument } from "@/hooks/useLocalStorage";
import { useState } from "react";

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
  const { drafts, deleteDraft } = useDrafts();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const navigate = useNavigate();

  const handleDelete = (id: string) => {
    deleteDraft(id);
    toast({
      title: "Draft deleted",
      description: "The draft has been removed.",
    });
  };

  const handleEdit = (doc: DraftDocument) => {
    const route = formTypeRoutes[doc.document_type];
    if (route) {
      navigate(`${route}?edit=${doc.id}`);
    }
  };

  const filteredDrafts = typeFilter === "all" 
    ? drafts 
    : drafts.filter(doc => doc.document_type === typeFilter);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Saved Drafts</h1>
            <p className="text-muted-foreground">
              You can keep up to 5 drafts. Oldest drafts are replaced when limit is reached.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drafts</SelectItem>
                <SelectItem value="leave_application">Leave Applications</SelectItem>
                <SelectItem value="money_requisition">Money Requisitions</SelectItem>
                <SelectItem value="material_requisition">Material Requisitions</SelectItem>
                <SelectItem value="advance_adjustment">Advance Adjustments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredDrafts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {typeFilter === "all" ? "No drafts yet" : "No drafts found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {typeFilter === "all" 
                  ? "Create a document and save it as draft."
                  : "No drafts match the selected filter."}
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
            {filteredDrafts.map((doc) => (
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
                          Last updated: {format(new Date(doc.updated_at), "PPP 'at' p")}
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          Draft
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this draft. This action cannot be undone.
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
