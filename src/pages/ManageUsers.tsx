import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, FileText, Download, Loader2, Eye, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";
import { format } from "date-fns";
import { exportToPdf } from "@/lib/pdfExport";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  designation: string | null;
  employee_id: string | null;
  mobile_number: string | null;
  created_at: string;
  email?: string;
}

interface Document {
  id: string;
  title: string;
  document_type: string;
  status: string;
  created_at: string;
  user_id: string;
  form_data: any;
  attachments: any[];
}

export default function ManageUsers() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userDocuments, setUserDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({ title: "Access Denied", description: "You don't have permission to access this page.", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from("profiles" as any)
      .select("*")
      .order("created_at", { ascending: false }) as any);

    if (error) {
      toast({ title: "Error loading users", description: error.message, variant: "destructive" });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const loadUserDocuments = async (userId: string) => {
    setLoadingDocs(true);
    const { data, error } = await (supabase
      .from("documents" as any)
      .select("*")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }) as any);

    if (error) {
      toast({ title: "Error loading documents", description: error.message, variant: "destructive" });
    } else {
      setUserDocuments(data || []);
    }
    setLoadingDocs(false);
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUser(userId);
    
    // First delete all user's documents
    const { error: docError } = await (supabase
      .from("documents" as any)
      .delete()
      .eq("user_id", userId) as any);

    if (docError) {
      toast({ title: "Error deleting user documents", description: docError.message, variant: "destructive" });
      setDeletingUser(null);
      return;
    }

    // Delete user profile
    const { error: profileError } = await (supabase
      .from("profiles" as any)
      .delete()
      .eq("user_id", userId) as any);

    if (profileError) {
      toast({ title: "Error deleting user profile", description: profileError.message, variant: "destructive" });
      setDeletingUser(null);
      return;
    }

    // Delete user role
    const { error: roleError } = await (supabase
      .from("user_roles" as any)
      .delete()
      .eq("user_id", userId) as any);

    if (roleError) {
      console.error("Error deleting user role:", roleError);
    }

    toast({ title: "User deleted", description: "User and all their data have been removed." });
    setDeletingUser(null);
    loadUsers();
  };

  const handleDeleteDocument = async (docId: string) => {
    setDeletingDoc(docId);
    
    const { error } = await (supabase
      .from("documents" as any)
      .delete()
      .eq("id", docId) as any);

    if (error) {
      toast({ title: "Error deleting document", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document deleted" });
      if (selectedUser) {
        loadUserDocuments(selectedUser.user_id);
      }
    }
    setDeletingDoc(null);
  };

  const handleDeleteAllDocuments = async (userId: string) => {
    const { error } = await (supabase
      .from("documents" as any)
      .delete()
      .eq("user_id", userId) as any);

    if (error) {
      toast({ title: "Error deleting documents", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "All documents deleted" });
      loadUserDocuments(userId);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      leave_application: "Leave Application",
      money_requisition: "Money Requisition",
      material_requisition: "Material Requisition",
      advance_adjustment: "Advance Adjustment",
    };
    return types[type] || type;
  };

  if (adminLoading || loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-tiller-green" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-tiller-green">
              <Users className="h-6 w-6" />
              Manage Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                    <TableCell>{user.employee_id || "N/A"}</TableCell>
                    <TableCell>{user.designation || "N/A"}</TableCell>
                    <TableCell>{user.mobile_number || "N/A"}</TableCell>
                    <TableCell>{format(new Date(user.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                loadUserDocuments(user.user_id);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Documents
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Documents - {selectedUser?.full_name || "User"}</DialogTitle>
                              <DialogDescription>
                                Manage documents for this user
                              </DialogDescription>
                            </DialogHeader>
                            
                            {loadingDocs ? (
                              <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            ) : userDocuments.length === 0 ? (
                              <p className="text-center text-muted-foreground py-8">No documents found</p>
                            ) : (
                              <>
                                <div className="flex justify-end mb-4">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete All
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete all documents?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete all documents for this user. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => selectedUser && handleDeleteAllDocuments(selectedUser.user_id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete All
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                                
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Title</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Date</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {userDocuments.map((doc) => (
                                      <TableRow key={doc.id}>
                                        <TableCell className="font-medium">{doc.title}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline">{getDocumentTypeLabel(doc.document_type)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={doc.status === "draft" ? "secondary" : "default"}>
                                            {doc.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(doc.created_at), "dd MMM yyyy")}</TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => navigate(`/forms/${doc.document_type.replace('_', '-').replace('_application', '').replace('_requisition', '').replace('_adjustment', '')}?edit=${doc.id}`)}
                                            >
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-destructive">
                                                  {deletingDoc === doc.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                  ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                  )}
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Delete document?</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    This will permanently delete this document. This action cannot be undone.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                  <AlertDialogAction
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                  >
                                                    Delete
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </>
                            )}
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={deletingUser === user.user_id}>
                              {deletingUser === user.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete user?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this user and all their documents. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
