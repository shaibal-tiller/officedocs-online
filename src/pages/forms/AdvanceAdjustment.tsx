import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { exportToPdf, printDocument } from "@/lib/pdfExport";
import { AttachmentPreview } from "@/components/forms/AttachmentPreview";
import { useDrafts, useProfile } from "@/hooks/useLocalStorage";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ExpenseItem {
  id: string;
  date: Date | undefined;
  particulars: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  remarks: string;
}

interface AdvanceFormData {
  name: string;
  designation: string;
  mobileNumber: string;
  employeeId: string;
  projectName: string;
  advanceDate: Date | undefined;
  advanceAmount: string;
  items: ExpenseItem[];
  fillForAnother: boolean;
  otherName: string;
  otherDesignation: string;
  otherMobileNumber: string;
  otherEmployeeId: string;
}

export default function AdvanceAdjustment() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { saveDraft, getDraft } = useDrafts();
  const { profile } = useProfile();

  const [formData, setFormData] = useState<AdvanceFormData>({
    name: "",
    designation: "",
    mobileNumber: "",
    employeeId: "",
    projectName: "",
    advanceDate: new Date(),
    advanceAmount: "",
    items: [{ id: "1", date: new Date(), particulars: "", quantity: "", unitCost: "", totalCost: "", remarks: "" }],
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
    if (!editId) {
      setFormData((prev) => ({
        ...prev,
        name: profile.full_name || "",
        designation: profile.designation || "",
        mobileNumber: profile.mobile_number || "",
        employeeId: profile.employee_id || "",
      }));
    }

    if (editId) {
      const draft = getDraft(editId);
      if (draft) {
        const formDataFromDraft = draft.form_data;
        setFormData({
          ...formDataFromDraft,
          advanceDate: formDataFromDraft.advanceDate ? new Date(formDataFromDraft.advanceDate) : new Date(),
          items: formDataFromDraft.items?.map((item: any) => ({
            ...item,
            date: item.date ? new Date(item.date) : new Date(),
          })) || [],
        });
        setAttachments(draft.attachments || []);
        setDocumentId(draft.id);
      }
    }
  }, [editId, profile, getDraft]);

  const handleInputChange = (field: keyof AdvanceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), date: new Date(), particulars: "", quantity: "", unitCost: "", totalCost: "", remarks: "" }],
    }));
  };

  const removeItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const updateItem = (id: string, field: keyof ExpenseItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unitCost") {
            const qty = parseFloat(updated.quantity) || 0;
            const cost = parseFloat(updated.unitCost) || 0;
            updated.totalCost = (qty * cost).toString();
          }
          return updated;
        }
        return item;
      }),
    }));
  };

  const calculateTotalExpense = () => {
    return formData.items.reduce((sum, item) => {
      const cost = parseFloat(item.totalCost) || 0;
      return sum + cost;
    }, 0);
  };

  const calculateBalance = () => {
    const advance = parseFloat(formData.advanceAmount) || 0;
    const expense = calculateTotalExpense();
    return advance - expense;
  };

  const handleSave = () => {
    setSaving(true);
    
    const newId = saveDraft({
      document_type: "advance_adjustment",
      title: `Advance Adjustment - ${formData.projectName || "Untitled"}`,
      form_data: formData,
      attachments: attachments,
    }, documentId || undefined);

    if (newId && !documentId) {
      setDocumentId(newId);
    }

    setSaving(false);
    toast({ title: "Draft saved!", description: "Your advance adjustment has been saved locally." });
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
      await exportToPdf("printable-document", `Advance_Adjustment_${formData.projectName || "Document"}`, attachments);
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
  const totalExpense = calculateTotalExpense();
  const balance = calculateBalance();

  const PreviewContent = () => (
    <div id="printable-document" className="bg-card rounded-lg overflow-hidden shadow-lg print:shadow-none">
      <FormHeader title="Advance Adjustment Form" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" value={displayName} inline />
          <FormField label="Employee ID" value={displayId} inline />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Designation" value={displayDesignation} inline />
          <FormField label="Mobile No" value={displayMobile} inline />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Project Name" value={formData.projectName} inline />
          <FormField label="Date of Advance" value={formData.advanceDate ? format(formData.advanceDate, "dd/MM/yyyy") : ""} inline />
        </div>
        <FormField label="Advance Amount (Tk.)" value={formData.advanceAmount} inline />

        <table className="w-full text-sm border border-border mt-4">
          <thead className="bg-secondary">
            <tr>
              <th className="border p-2 text-left">S.No</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Particulars</th>
              <th className="border p-2 text-center">Qty</th>
              <th className="border p-2 text-right">Unit Cost</th>
              <th className="border p-2 text-right">Total Cost</th>
              <th className="border p-2 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={item.id}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{item.date ? format(item.date, "dd/MM/yy") : ""}</td>
                <td className="border p-2">{item.particulars}</td>
                <td className="border p-2 text-center">{item.quantity}</td>
                <td className="border p-2 text-right">{item.unitCost}</td>
                <td className="border p-2 text-right">{item.totalCost}</td>
                <td className="border p-2">{item.remarks}</td>
              </tr>
            ))}
            <tr className="font-bold bg-secondary">
              <td className="border p-2" colSpan={5}>Total Expense</td>
              <td className="border p-2 text-right">{totalExpense.toFixed(2)}</td>
              <td className="border p-2"></td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-secondary rounded-lg">
          <FormField label="Advance Amount" value={`Tk. ${formData.advanceAmount || "0"}`} inline />
          <FormField label="Total Expense" value={`Tk. ${totalExpense.toFixed(2)}`} inline />
          <FormField label={balance >= 0 ? "Balance Due" : "Amount Payable"} value={`Tk. ${Math.abs(balance).toFixed(2)}`} inline />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <FormField label="Submitted By" value="" inline />
          <FormField label="Verified By" value="" inline />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date" value="" inline />
          <FormField label="Date" value="" inline />
        </div>

        <div className="mt-4 border border-border p-4">
          <p className="font-bold mb-2">For Accounts Use</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Checked By" value="" inline />
            <FormField label="Approved By" value="" inline />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <FormField label="Date" value="" inline />
            <FormField label="Date" value="" inline />
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
              <CardTitle className="text-tiller-green">{editId ? "Edit Advance Adjustment" : "Advance Adjustment Form"}</CardTitle>
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
                  <Label>Date of Advance</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.advanceDate ? format(formData.advanceDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.advanceDate} onSelect={(date) => handleInputChange("advanceDate", date)} className="pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Advance Amount (Tk.)</Label>
                <Input type="number" value={formData.advanceAmount} onChange={(e) => handleInputChange("advanceAmount", e.target.value)} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg">Expense Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
                </div>
                {formData.items.map((item, index) => (
                  <div key={item.id} className="space-y-2 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Item {index + 1}</span>
                      {formData.items.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-1 h-3 w-3" />
                              {item.date ? format(item.date, "dd/MM/yy") : "Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={item.date} onSelect={(date) => updateItem(item.id, "date", date)} className="pointer-events-auto" /></PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1 col-span-2"><Label className="text-xs">Particulars</Label><Input value={item.particulars} onChange={(e) => updateItem(item.id, "particulars", e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">Quantity</Label><Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">Unit Cost</Label><Input type="number" value={item.unitCost} onChange={(e) => updateItem(item.id, "unitCost", e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">Total</Label><Input value={item.totalCost} readOnly className="bg-muted" /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Remarks</Label><Input value={item.remarks} onChange={(e) => updateItem(item.id, "remarks", e.target.value)} /></div>
                  </div>
                ))}
                <div className="text-right space-y-1">
                  <p className="font-bold">Total Expense: Tk. {totalExpense.toFixed(2)}</p>
                  <p className={`font-bold ${balance >= 0 ? "text-tiller-green" : "text-destructive"}`}>
                    {balance >= 0 ? "Balance Due" : "Amount Payable"}: Tk. {Math.abs(balance).toFixed(2)}
                  </p>
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
                <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
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
