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
import { CalendarIcon, Printer, Download, Eye, Save, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

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
      toast({
        title: "Error",
        description: "You must be logged in to save documents",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("documents").insert({
      user_id: user.id,
      form_type: "money_requisition",
      form_data: formData,
      status: "draft",
    });

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
        description: "Your money requisition has been saved as draft.",
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
  const total = calculateTotal();

  const PreviewContent = () => (
    <div className="bg-card rounded-lg overflow-hidden shadow-lg print:shadow-none">
      <FormHeader title="Requisition Form" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" value={displayName} inline />
          <FormField 
            label="Date" 
            value={formData.date ? format(formData.date, "dd/MM/yyyy") : ""} 
            inline 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Designation" value={displayDesignation} inline />
          <FormField label="Mobile No" value={displayMobile} inline />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Employee ID" value={displayId} inline />
          <FormField label="Project Name" value={formData.projectName} inline />
        </div>

        {/* Line Items Table */}
        <table className="w-full text-sm border border-border mt-4">
          <thead className="bg-secondary">
            <tr>
              <th className="border p-2 w-12">Sl. No</th>
              <th className="border p-2">Purpose</th>
              <th className="border p-2 w-32">Amount</th>
              <th className="border p-2 w-40">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {formData.lineItems.map((item, index) => (
              <tr key={item.id}>
                <td className="border p-2 text-center">{index + 1}</td>
                <td className="border p-2 bg-tiller-field">{item.purpose}</td>
                <td className="border p-2 text-right bg-tiller-field">{item.amount}</td>
                <td className="border p-2 bg-tiller-field">{item.remarks}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="border p-2 text-center" colSpan={2}>Total</td>
              <td className="border p-2 text-right bg-tiller-field">{total.toLocaleString()}</td>
              <td className="border p-2"></td>
            </tr>
          </tbody>
        </table>

        <FormField label="In Words" value={total > 0 ? `${numberToWords(total)} Taka Only` : ""} inline />

        <div className="flex items-center gap-8">
          <span className="font-medium">Nature:</span>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <div className={cn(
                "w-4 h-4 border border-border",
                formData.nature === "estimated" && "bg-tiller-green"
              )} />
              <span>Estimated</span>
            </label>
            <label className="flex items-center gap-2">
              <div className={cn(
                "w-4 h-4 border border-border",
                formData.nature === "actual" && "bg-tiller-green"
              )} />
              <span>Actual</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <span className="font-medium">Preferred mode of payment:</span>
          <div className="flex items-center gap-4">
            {[
              { value: "account_payee", label: "A/C Payee Cheque" },
              { value: "bearer", label: "Bearer Cheque" },
              { value: "cash", label: "Cash" },
            ].map((mode) => (
              <label key={mode.value} className="flex items-center gap-2">
                <div className={cn(
                  "w-4 h-4 border border-border",
                  formData.paymentMode === mode.value && "bg-tiller-green"
                )} />
                <span>{mode.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 pt-8">
          <div className="text-center">
            <div className="border-b border-border h-12 mb-2"></div>
            <p className="font-medium">Prepared by</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-tiller-green">Money Requisition Form</CardTitle>
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
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => handleInputChange("date", date)}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {formData.lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-1 text-center text-sm text-muted-foreground pt-6">
                      {index + 1}
                    </div>
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs">Purpose</Label>
                      <Input
                        value={item.purpose}
                        onChange={(e) => updateLineItem(item.id, "purpose", e.target.value)}
                        placeholder="Purpose"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Amount</Label>
                      <Input
                        value={item.amount}
                        onChange={(e) => updateLineItem(item.id, "amount", e.target.value)}
                        placeholder="0"
                        type="number"
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Remarks</Label>
                      <Input
                        value={item.remarks}
                        onChange={(e) => updateLineItem(item.id, "remarks", e.target.value)}
                        placeholder="Remarks"
                      />
                    </div>
                    <div className="col-span-1">
                      {formData.lineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end text-lg font-semibold">
                  Total: {total.toLocaleString()} Tk
                </div>
              </div>

              {/* Nature */}
              <div className="space-y-3">
                <Label>Nature</Label>
                <RadioGroup
                  value={formData.nature}
                  onValueChange={(value) => handleInputChange("nature", value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="estimated" id="estimated" />
                    <Label htmlFor="estimated">Estimated</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="actual" id="actual" />
                    <Label htmlFor="actual">Actual</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Payment Mode */}
              <div className="space-y-3">
                <Label>Preferred Mode of Payment</Label>
                <Select
                  value={formData.paymentMode}
                  onValueChange={(value) => handleInputChange("paymentMode", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account_payee">A/C Payee Cheque</SelectItem>
                    <SelectItem value="bearer">Bearer Cheque</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving} className="bg-tiller-green hover:bg-tiller-green/90">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Draft"}
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
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
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview Section */}
          <div className="hidden xl:block">
            <div className="sticky top-24">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Live Preview</h3>
              <div className="transform scale-75 origin-top-left w-[133%]">
                <PreviewContent />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
