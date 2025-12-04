import { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Printer, Download, Eye, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type LeaveCategory = "casual" | "earned" | "sick" | "lwp";

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

    const { error } = await supabase.from("documents").insert({
      user_id: user.id,
      form_type: "leave_application",
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
        description: "Your leave application has been saved as draft.",
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

  const PreviewContent = () => (
    <div className="bg-card rounded-lg overflow-hidden shadow-lg print:shadow-none">
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
              <CardTitle className="text-tiller-green">Leave Application Form</CardTitle>
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
                  placeholder="Enter your reason for leave..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delegateName">Delegate's Name (Colleague covering for you)</Label>
                <Input
                  id="delegateName"
                  value={formData.delegateName}
                  onChange={(e) => handleInputChange("delegateName", e.target.value)}
                  placeholder="Name of colleague"
                />
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

          {/* Live Preview Section - Hidden on mobile */}
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
