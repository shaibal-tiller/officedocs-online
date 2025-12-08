import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormHeader } from "@/components/forms/FormHeader";
import { FormFooter } from "@/components/forms/FormFooter";
import { FormField } from "@/components/forms/FormField";
import { FileAttachments } from "@/components/forms/FileAttachments";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Eye, Save, Plus, Trash2, Loader2, Printer } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToPdf, printDocument } from "@/lib/pdfExport";
import { AttachmentPreview } from "@/components/forms/AttachmentPreview";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface LineItem {
  id: string;
  purpose: string;
  amount: string;
  remarks: string;
}

interface MoneyFormData {
  name: string;
  designation: string;
  mobileNumber: string;
  employeeId: string;
  projectName: string;
  date: Date | undefined;
  lineItems: LineItem[];
  nature: "estimated" | "actual";
  paymentMode: "account_payee" | "bearer" | "cash";
  fillForAnother: boolean;
  otherName: string;
  otherDesignation: string;
  otherMobileNumber: string;
  otherEmployeeId: string;
}

export default function MoneyRequisition() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("edit");

  const [formData, setFormData] = useState<MoneyFormData>({
    name: "",
    designation: "",
    mobileNumber: "",
    employeeId: "",
    projectName: "",
    date: new Date(),
    lineItems: [{ id: "1", purpose: "", amount: "", remarks: "" }],
    nature: "estimated",
    paymentMode: "cash",
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
      toast({ title: "Error loading document", description: error.message, variant: "destructive" });
      return;
    }

    if (data) {
      const formDataFromDb = data.form_data;
      setFormData({
        ...formDataFromDb,
        date: formDataFromDb.date ? new Date(formDataFromDb.date) : new Date(),
      });
      setAttachments(data.attachments || []);
      setDocumentId(data.id);
    }
  };

  const handleInputChange = (field: keyof MoneyFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { id: Date.now().toString(), purpose: "", amount: "", remarks: "" }],
    }));
  };

  const removeLineItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.id !== id),
    }));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const calculateTotal = () => {
    return formData.lineItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " " + numberToWords(num % 100) : "");
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "");
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "");
    return numberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? " " + numberToWords(num % 10000000) : "");
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to save documents", variant: "destructive" });
      setSaving(false);
      return;
    }

    const docData = {
      user_id: user.id,
      document_type: "money_requisition",
      title: `Money Requisition - ${formData.projectName || "Untitled"}`,
      form_data: formData,
      status: "draft",
      attachments: attachments,
    };

    let result;
    if (documentId) {
      result = await (supabase.from("documents" as any).update(docData).eq("id", documentId) as any);
    } else {
      result = await (supabase.from("documents" as any).insert(docData).select() as any);
      if (result.data && result.data[0]) {
        setDocumentId(result.data[0].id);
      }
    }

    setSaving(false);
    if (result.error) {
      toast({ title: "Error saving document", description: result.error.message, variant: "destructive" });
    } else {
      toast({ title: "Document saved!", description: documentId ? "Your changes have been saved." : "Your money requisition has been saved as draft." });
    }
  };

  const handlePrint = () => {
    try {
      printDocument("printable-document");
    } catch (error) {
      toast({ title: "Print failed", description: "Failed to print. Please try again.", variant: "destructive" });
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportToPdf("printable-document", `Money_Requisition_${formData.projectName || "Document"}`, attachments);
      toast({ title: "PDF exported!", description: "Your document has been downloaded as PDF." });
    } catch (error) {
      toast({ title: "Export failed", description: "Failed to export PDF. Please try again.", variant: "destructive" });
    }
    setExporting(false);
  };

  const displayName = formData.fillForAnother ? formData.otherName : formData.name;
  const displayDesignation = formData.fillForAnother ? formData.otherDesignation : formData.designation;
  const displayMobile = formData.fillForAnother ? formData.otherMobileNumber : formData.mobileNumber;
  const displayId = formData.fillForAnother ? formData.otherEmployeeId : formData.employeeId;
  const total = calculateTotal();

  const PreviewContent = () => (
    <div id="printable-document" className="bg-card rounded-lg overflow-hidden shadow-lg print:shadow-none">
      <FormHeader title="Requisition Form" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" value={displayName} inline />
          <FormField label="Date" value={formData.date ? format(formData.date, "dd/MM/yyyy") : ""} inline />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Designation" value={displayDesignation} inline />
          <FormField label="Mobile No" value={displayMobile} inline />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Employee ID" value={displayId} inline />
          <FormField label="Project Name" value={formData.projectName} inline />
        </div>

        <table className="w-full text-sm border border-border mt-4">
          <thead className="bg-secondary">
            <tr>
              <th className="border p-2 text-left">S.No</th>
              <th className="border p-2 text-left">Purpose of Requisition</th>
              <th className="border p-2 text-right">Amount (Tk.)</th>
              <th className="border p-2 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {formData.lineItems.map((item, index) => (
              <tr key={item.id}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{item.purpose}</td>
                <td className="border p-2 text-right">{item.amount}</td>
                <td className="border p-2">{item.remarks}</td>
              </tr>
            ))}
            <tr className="font-bold bg-secondary">
              <td className="border p-2" colSpan={2}>Total</td>
              <td className="border p-2 text-right">{total.toFixed(2)}</td>
              <td className="border p-2"></td>
            </tr>
          </tbody>
        </table>

        <FormField label="Total Amount (in words)" value={numberToWords(Math.floor(total)) + " Taka Only"} />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="font-medium">Nature of this Estimate/Actual:</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <div className={`w-4 h-4 border border-border ${formData.nature === "estimated" ? "bg-tiller-green" : ""}`} />
                <span>Estimated</span>
              </label>
              <label className="flex items-center gap-2">
                <div className={`w-4 h-4 border border-border ${formData.nature === "actual" ? "bg-tiller-green" : ""}`} />
                <span>Actual</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <span className="font-medium">Payment Mode:</span>
            <div className="flex gap-4">
              {[{ key: "account_payee", label: "A/C Payee" }, { key: "bearer", label: "Bearer" }, { key: "cash", label: "Cash" }].map((mode) => (
                <label key={mode.key} className="flex items-center gap-2">
                  <div className={`w-4 h-4 border border-border ${formData.paymentMode === mode.key ? "bg-tiller-green" : ""}`} />
                  <span>{mode.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <FormField label="Requested By" value="" inline />
          <FormField label="Recommended By" value="" inline />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date" value="" inline />
          <FormField label="Date" value="" inline />
        </div>

        <div className="mt-4 border border-border p-4">
          <p className="font-bold mb-2">For Accounts Use</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Cheque/Cash No" value="" inline />
            <FormField label="Amount" value="" inline />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <FormField label="Approved By" value="" inline />
            <FormField label="Prepared By" value="" inline />
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
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="text-tiller-green">{editId ? "Edit Money Requisition" : "Money Requisition Form"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Checkbox id="fillForAnother" checked={formData.fillForAnother} onCheckedChange={(checked) => handleInputChange("fillForAnother", checked)} />
                <Label htmlFor="fillForAnother">Fill for another person</Label>
              </div>

              {formData.fillForAnother && (
                <div className="space-y-4 p-4 border border-border rounded-lg bg-secondary/50">
                  <h4 className="font-medium">Other Person's Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Full Name</Label><Input value={formData.otherName} onChange={(e) => handleInputChange("otherName", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Designation</Label><Input value={formData.otherDesignation} onChange={(e) => handleInputChange("otherDesignation", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Mobile Number</Label><Input value={formData.otherMobileNumber} onChange={(e) => handleInputChange("otherMobileNumber", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Employee ID</Label><Input value={formData.otherEmployeeId} onChange={(e) => handleInputChange("otherEmployeeId", e.target.value)} /></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Project Name</Label><Input value={formData.projectName} onChange={(e) => handleInputChange("projectName", e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.date} onSelect={(date) => handleInputChange("date", date)} className="pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg">Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
                </div>
                {formData.lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted rounded-lg">
                    <div className="col-span-1 text-center font-medium">{index + 1}</div>
                    <div className="col-span-4 space-y-1"><Label className="text-xs">Purpose</Label><Input value={item.purpose} onChange={(e) => updateLineItem(item.id, "purpose", e.target.value)} /></div>
                    <div className="col-span-3 space-y-1"><Label className="text-xs">Amount (Tk.)</Label><Input type="number" value={item.amount} onChange={(e) => updateLineItem(item.id, "amount", e.target.value)} /></div>
                    <div className="col-span-3 space-y-1"><Label className="text-xs">Remarks</Label><Input value={item.remarks} onChange={(e) => updateLineItem(item.id, "remarks", e.target.value)} /></div>
                    <div className="col-span-1">
                      {formData.lineItems.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLineItem(item.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="text-right font-bold">Total: Tk. {total.toFixed(2)}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nature</Label>
                  <RadioGroup value={formData.nature} onValueChange={(value) => handleInputChange("nature", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="estimated" id="estimated" /><Label htmlFor="estimated">Estimated</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="actual" id="actual" /><Label htmlFor="actual">Actual</Label></div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={formData.paymentMode} onValueChange={(value: any) => handleInputChange("paymentMode", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account_payee">A/C Payee</SelectItem>
                      <SelectItem value="bearer">Bearer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <FileAttachments attachments={attachments} onAttachmentsChange={setAttachments} />

              <div className="flex flex-wrap gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving} className="bg-tiller-green hover:bg-tiller-green/90">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {saving ? "Saving..." : "Save Draft"}
                </Button>
                <Dialog>
                  <DialogTrigger asChild><Button variant="outline"><Eye className="h-4 w-4 mr-2" />Preview</Button></DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Document Preview</DialogTitle></DialogHeader><PreviewContent /></DialogContent>
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
