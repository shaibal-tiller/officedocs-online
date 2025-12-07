import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormHeader } from "@/components/forms/FormHeader";
import { FormFooter } from "@/components/forms/FormFooter";
import { FormField } from "@/components/forms/FormField";
import { FileAttachments } from "@/components/forms/FileAttachments";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Printer, Download, Eye, Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { exportToPdf, printDocument } from "@/lib/pdfExport";
import { AttachmentPreview } from "@/components/forms/AttachmentPreview";

type LeaveCategory = "casual" | "earned" | "sick" | "lwp";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface LeaveFormData {
  name: string;
  designation: string;
  mobileNumber: string;
  employeeId: string;
  leaveCategory: LeaveCategory | null;
  startDate: Date | undefined;
  endDate: Date | undefined;
  numberOfDays: string;
  dateOfJoining: Date | undefined;
  reasonForLeave: string;
  delegateName: string;
  applicationDate: Date | undefined;
  fillForAnother: boolean;
  otherName: string;
  otherDesignation: string;
  otherMobileNumber: string;
  otherEmployeeId: string;
}

export default function LeaveApplication() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("edit");

  const [formData, setFormData] = useState<LeaveFormData>({
    name: "",
    designation: "",
    mobileNumber: "",
    employeeId: "",
    leaveCategory: null,
    startDate: undefined,
    endDate: undefined,
    numberOfDays: "",
    dateOfJoining: undefined,
    reasonForLeave: "",
    delegateName: "",
    applicationDate: new Date(),
    fillForAnother: false,
    otherName: "",
    otherDesignation: "",
    otherMobileNumber: "",
    otherEmployeeId: "",
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(editId);

  useEffect(() => {
    loadUserProfile();
    if (editId) {
      loadDocument(editId);
    }
  }, [editId]);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && !editId) {
      const { data: profile } = await (supabase
        .from("profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle() as any);

      if (profile) {
        setFormData((prev) => ({
          ...prev,
          name: profile.full_name || "",
          designation: profile.designation || "",
          mobileNumber: profile.mobile_number || "",
          employeeId: profile.employee_id || "",
        }));
      }
    }
  };

  const loadDocument = async (id: string) => {
    const { data, error } = await (supabase
      .from("documents" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle() as any);

    if (error) {
      toast({
        title: "Error loading document",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      const formDataFromDb = data.form_data;
      setFormData({
        ...formDataFromDb,
        startDate: formDataFromDb.startDate ? new Date(formDataFromDb.startDate) : undefined,
        endDate: formDataFromDb.endDate ? new Date(formDataFromDb.endDate) : undefined,
        dateOfJoining: formDataFromDb.dateOfJoining ? new Date(formDataFromDb.dateOfJoining) : undefined,
        applicationDate: formDataFromDb.applicationDate ? new Date(formDataFromDb.applicationDate) : new Date(),
      });
      setAttachments(data.attachments || []);
      setDocumentId(data.id);
    }
  };

  const handleInputChange = (field: keyof LeaveFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save documents",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    const docData = {
      user_id: user.id,
      document_type: "leave_application",
      title: `Leave Application - ${formData.fillForAnother ? formData.otherName : formData.name || "Untitled"}`,
      form_data: formData,
      status: "draft",
      attachments: attachments,
    };

    let result;
    if (documentId) {
      result = await (supabase
        .from("documents" as any)
        .update(docData)
        .eq("id", documentId) as any);
    } else {
      result = await (supabase.from("documents" as any).insert(docData).select() as any);
      if (result.data && result.data[0]) {
        setDocumentId(result.data[0].id);
      }
    }

    setSaving(false);
    if (result.error) {
      toast({
        title: "Error saving document",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Document saved!",
        description: documentId ? "Your changes have been saved." : "Your leave application has been saved as draft.",
      });
    }
  };

  const handlePrint = () => {
    try {
      printDocument("printable-document");
    } catch (error) {
      toast({
        title: "Print failed",
        description: "Failed to print. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const displayName = formData.fillForAnother ? formData.otherName : formData.name;
      await exportToPdf("printable-document", `Leave_Application_${displayName || "Document"}`);
      toast({
        title: "PDF exported!",
        description: "Your document has been downloaded as PDF.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
    setExporting(false);
  };

  const displayName = formData.fillForAnother ? formData.otherName : formData.name;
  const displayDesignation = formData.fillForAnother ? formData.otherDesignation : formData.designation;
  const displayMobile = formData.fillForAnother ? formData.otherMobileNumber : formData.mobileNumber;
  const displayId = formData.fillForAnother ? formData.otherEmployeeId : formData.employeeId;

  const PreviewContent = () => (
    <div id="printable-document" className="bg-card rounded-lg overflow-hidden shadow-lg print:shadow-none">
      <FormHeader title="Leave Application Form" />
      <div className="p-6 space-y-4">
        <FormField label="Name of Staff requesting for leave" value={displayName} inline />
        <FormField label="Designation" value={displayDesignation} inline />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Mobile Number" value={displayMobile} inline />
          <FormField label="ID Number" value={displayId} inline />
        </div>

        <div className="flex items-center gap-6">
          <span className="font-medium">Leave Category:</span>
          <div className="flex items-center gap-4">
            {(["casual", "earned", "sick", "lwp"] as LeaveCategory[]).map((cat) => (
              <label key={cat} className="flex items-center gap-2">
                <div className={cn(
                  "w-4 h-4 border border-border",
                  formData.leaveCategory === cat && "bg-tiller-green"
                )} />
                <span className="capitalize">{cat === "lwp" ? "L/W/P" : cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField 
            label="Leave Duration" 
            value={formData.startDate ? format(formData.startDate, "dd.MM.yy") : ""} 
            inline 
          />
          <FormField 
            label="to" 
            value={formData.endDate ? format(formData.endDate, "dd.MM.yy") : ""} 
            inline 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Number of days applied for" value={formData.numberOfDays} inline />
          <FormField 
            label="Date of Joining" 
            value={formData.dateOfJoining ? format(formData.dateOfJoining, "dd.MM.yy") : ""} 
            inline 
          />
        </div>

        <div className="space-y-2">
          <span className="font-medium">Reasons for Leave:</span>
          <div className="bg-tiller-field min-h-[80px] p-3">{formData.reasonForLeave}</div>
        </div>

        <p className="text-foreground">
          In my absence my responsibilities will be delegated to my colleague
        </p>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" value={formData.delegateName} inline />
          <FormField label="Signature" value="" inline />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <FormField 
            label="Application Date" 
            value={formData.applicationDate ? format(formData.applicationDate, "dd.MM.yy") : ""} 
            inline 
          />
          <FormField label="Signature of Applicant" value="" inline />
        </div>

        {/* HR Section */}
        <div className="mt-6 border border-border">
          <div className="bg-secondary p-4">
            <p className="font-bold italic">(FOR HR USE ONLY)</p>
            <p className="text-sm italic text-muted-foreground">
              Fill in this table from personnel computerized records in HR Department
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="border p-2">Category of Leave</th>
                <th className="border p-2">Remarks</th>
                <th className="border p-2">Yearly Allotment</th>
                <th className="border p-2">Maximum Carry Over</th>
                <th className="border p-2">Leave Enjoyed</th>
                <th className="border p-2">Due Leave</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2 text-center">Casual</td>
                <td className="border p-2">Calendar Days, 3 consecutive days</td>
                <td className="border p-2 text-center">10</td>
                <td className="border p-2 text-center">-</td>
                <td className="border p-2 bg-tiller-field"></td>
                <td className="border p-2 bg-tiller-field"></td>
              </tr>
              <tr>
                <td className="border p-2 text-center">Sick</td>
                <td className="border p-2">Calendar Days, &gt;2 requires doctor certificate</td>
                <td className="border p-2 text-center">14</td>
                <td className="border p-2 text-center">28</td>
                <td className="border p-2 bg-tiller-field"></td>
                <td className="border p-2 bg-tiller-field"></td>
              </tr>
              <tr>
                <td className="border p-2 text-center">Earned</td>
                <td className="border p-2">Calendar days, no encashment during tenure of job</td>
                <td className="border p-2 text-center">18</td>
                <td className="border p-2 text-center">54</td>
                <td className="border p-2 bg-tiller-field"></td>
                <td className="border p-2 bg-tiller-field"></td>
              </tr>
              <tr>
                <td className="border p-2 text-center">LWP</td>
                <td className="border p-2">Approved only when other leaves exhausted</td>
                <td className="border p-2 text-center">Mgt. discretion</td>
                <td className="border p-2 text-center">-</td>
                <td className="border p-2 bg-tiller-field"></td>
                <td className="border p-2 bg-tiller-field"></td>
              </tr>
            </tbody>
          </table>
          <div className="bg-secondary p-3 grid grid-cols-2 gap-4">
            <FormField label="Date" value="" inline />
            <FormField label="HR Concern" value="" inline />
          </div>
        </div>

        {/* Approval Section */}
        <div className="mt-4 border border-border p-4 space-y-3">
          <div className="flex items-center gap-6">
            <span className="font-medium">Leave:</span>
            <label className="flex items-center gap-2">
              <div className="w-4 h-4 border border-border" />
              <span>Approved</span>
            </label>
            <label className="flex items-center gap-2">
              <div className="w-4 h-4 border border-border" />
              <span>Disapproved</span>
            </label>
          </div>
          <FormField label="Supervisor's Name" value="" inline />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" value="" inline />
            <FormField label="Supervisor's Signature" value="" inline />
          </div>
        </div>
        
        <AttachmentPreview attachments={attachments} />
      </div>
      <FormFooter />
    </div>
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Form Input Section */}
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="text-tiller-green">
                {editId ? "Edit Leave Application" : "Leave Application Form"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fill for Another Toggle */}
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Checkbox
                  id="fillForAnother"
                  checked={formData.fillForAnother}
                  onCheckedChange={(checked) => handleInputChange("fillForAnother", checked)}
                />
                <Label htmlFor="fillForAnother">Fill for another person</Label>
              </div>

              {formData.fillForAnother && (
                <div className="space-y-4 p-4 border border-border rounded-lg bg-secondary/50">
                  <h4 className="font-medium">Other Person's Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="otherName">Full Name</Label>
                      <Input
                        id="otherName"
                        value={formData.otherName}
                        onChange={(e) => handleInputChange("otherName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otherDesignation">Designation</Label>
                      <Input
                        id="otherDesignation"
                        value={formData.otherDesignation}
                        onChange={(e) => handleInputChange("otherDesignation", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otherMobile">Mobile Number</Label>
                      <Input
                        id="otherMobile"
                        value={formData.otherMobileNumber}
                        onChange={(e) => handleInputChange("otherMobileNumber", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otherId">Employee ID</Label>
                      <Input
                        id="otherId"
                        value={formData.otherEmployeeId}
                        onChange={(e) => handleInputChange("otherEmployeeId", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Leave Category */}
              <div className="space-y-3">
                <Label>Leave Category</Label>
                <div className="flex flex-wrap gap-4">
                  {(["casual", "earned", "sick", "lwp"] as LeaveCategory[]).map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.leaveCategory === cat}
                        onCheckedChange={() => handleInputChange("leaveCategory", cat)}
                      />
                      <span className="capitalize">{cat === "lwp" ? "L/W/P" : cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => handleInputChange("startDate", date)}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => handleInputChange("endDate", date)}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfDays">Number of Days</Label>
                  <Input
                    id="numberOfDays"
                    value={formData.numberOfDays}
                    onChange={(e) => handleInputChange("numberOfDays", e.target.value)}
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Joining (Return)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dateOfJoining ? format(formData.dateOfJoining, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dateOfJoining}
                        onSelect={(date) => handleInputChange("dateOfJoining", date)}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonForLeave">Reason for Leave</Label>
                <Textarea
                  id="reasonForLeave"
                  value={formData.reasonForLeave}
                  onChange={(e) => handleInputChange("reasonForLeave", e.target.value)}
                  rows={3}
                  placeholder="Explain the reason for your leave request..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delegateName">Delegate Name (colleague taking over)</Label>
                <Input
                  id="delegateName"
                  value={formData.delegateName}
                  onChange={(e) => handleInputChange("delegateName", e.target.value)}
                  placeholder="Name of colleague who will cover..."
                />
              </div>

              <div className="space-y-2">
                <Label>Application Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.applicationDate ? format(formData.applicationDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.applicationDate}
                      onSelect={(date) => handleInputChange("applicationDate", date)}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* File Attachments */}
              <FileAttachments
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving} className="bg-tiller-green hover:bg-tiller-green/90">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {saving ? "Saving..." : "Save Draft"}
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Document Preview</DialogTitle>
                    </DialogHeader>
                    <PreviewContent />
                  </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={handleExportPdf} disabled={exporting}>
                  {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  {exporting ? "Exporting..." : "Download PDF"}
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview Section */}
          <div className="hidden xl:block">
            <div className="sticky top-4">
              <h3 className="text-lg font-semibold mb-4 text-foreground print:hidden">Live Preview</h3>
              <PreviewContent />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
