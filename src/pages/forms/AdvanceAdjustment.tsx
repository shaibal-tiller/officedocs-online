import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormHeader } from "@/components/forms/FormHeader";
import { FormFooter } from "@/components/forms/FormFooter";
import { FormField } from "@/components/forms/FormField";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Printer, Eye, Save, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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

    const { error } = await (supabase.from("documents" as any).insert({
      user_id: user.id,
      document_type: "advance_adjustment",
      title: `Advance Adjustment - ${formData.projectName || "Untitled"}`,
      form_data: formData,
      status: "draft",
    }) as any);

    setSaving(false);
    if (error) {
      toast({
        title: "Error saving document",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Document saved!",
        description: "Your advance adjustment has been saved as draft.",
      });
    }
  };

  const handlePrint = () => {
    window.print();
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
          <FormField 
            label="Advance Date" 
            value={formData.advanceDate ? format(formData.advanceDate, "dd/MM/yyyy") : ""} 
            inline 
          />
        </div>
        <FormField label="Advance Amount" value={`${formData.advanceAmount} Tk`} inline />

        {/* Expense Items Table */}
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Expense Details</h4>
          <table className="w-full text-sm border border-border">
            <thead className="bg-secondary">
              <tr>
                <th className="border p-2 w-12">Sl.</th>
                <th className="border p-2 w-24">Date</th>
                <th className="border p-2">Particulars</th>
                <th className="border p-2 w-16">Qty</th>
                <th className="border p-2 w-20">Unit Cost</th>
                <th className="border p-2 w-24">Total Cost</th>
                <th className="border p-2 w-28">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2 text-center bg-tiller-field">
                    {item.date ? format(item.date, "dd/MM/yy") : ""}
                  </td>
                  <td className="border p-2 bg-tiller-field">{item.particulars}</td>
                  <td className="border p-2 text-center bg-tiller-field">{item.quantity}</td>
                  <td className="border p-2 text-right bg-tiller-field">{item.unitCost}</td>
                  <td className="border p-2 text-right bg-tiller-field">{item.totalCost}</td>
                  <td className="border p-2 bg-tiller-field">{item.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="border border-border p-4 space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Total Advance:</span>
            <span>{parseFloat(formData.advanceAmount || "0").toLocaleString()} Tk</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Total Expense:</span>
            <span>{totalExpense.toLocaleString()} Tk</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2">
            <span>{balance >= 0 ? "Balance to Return:" : "Amount Due:"}</span>
            <span className={balance < 0 ? "text-destructive" : ""}>{Math.abs(balance).toLocaleString()} Tk</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 pt-8">
          <div className="text-center">
            <div className="border-b border-border h-12 mb-2"></div>
            <p className="font-medium">Submitted by</p>
          </div>
          <div className="text-center">
            <div className="border-b border-border h-12 mb-2"></div>
            <p className="font-medium">Checked by</p>
          </div>
          <div className="text-center">
            <div className="border-b border-border h-12 mb-2"></div>
            <p className="font-medium">Approved by</p>
          </div>
        </div>
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
              <CardTitle className="text-tiller-green">Advance Adjustment Form</CardTitle>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => handleInputChange("projectName", e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Advance Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.advanceDate ? format(formData.advanceDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.advanceDate}
                        onSelect={(date) => handleInputChange("advanceDate", date)}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advanceAmount">Advance Amount (Tk)</Label>
                <Input
                  id="advanceAmount"
                  value={formData.advanceAmount}
                  onChange={(e) => handleInputChange("advanceAmount", e.target.value)}
                  placeholder="Enter advance amount"
                  type="number"
                />
              </div>

              {/* Expense Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Expense Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={item.id} className="space-y-2 p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal text-sm">
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {item.date ? format(item.date, "PP") : "Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={item.date}
                            onSelect={(date) => updateItem(item.id, "date", date)}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        value={item.particulars}
                        onChange={(e) => updateItem(item.id, "particulars", e.target.value)}
                        placeholder="Particulars"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                        placeholder="Qty"
                        type="number"
                      />
                      <Input
                        value={item.unitCost}
                        onChange={(e) => updateItem(item.id, "unitCost", e.target.value)}
                        placeholder="Unit Cost"
                        type="number"
                      />
                      <Input
                        value={item.totalCost}
                        readOnly
                        placeholder="Total"
                        className="bg-muted"
                      />
                      <Input
                        value={item.remarks}
                        onChange={(e) => updateItem(item.id, "remarks", e.target.value)}
                        placeholder="Remarks"
                      />
                    </div>
                  </div>
                ))}

                {/* Summary */}
                <div className="space-y-1 text-right">
                  <p>Total Expense: <span className="font-semibold">{totalExpense.toLocaleString()} Tk</span></p>
                  <p className={balance < 0 ? "text-destructive" : ""}>
                    {balance >= 0 ? "Balance to Return:" : "Amount Due:"} 
                    <span className="font-semibold ml-1">{Math.abs(balance).toLocaleString()} Tk</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving} className="bg-tiller-green hover:bg-tiller-green/90">
                  <Save className="h-4 w-4 mr-2" />
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
