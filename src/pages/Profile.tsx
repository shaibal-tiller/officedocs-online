import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save, User } from "lucide-react";
import { useProfile } from "@/hooks/useLocalStorage";

export default function Profile() {
  const { profile, saveProfile } = useProfile();

  const handleChange = (field: keyof typeof profile, value: string) => {
    saveProfile({ ...profile, [field]: value });
  };

  const handleSave = () => {
    saveProfile(profile);
    toast({
      title: "Profile saved!",
      description: "Your information will be auto-filled in forms.",
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-tiller-green flex items-center justify-center">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>
                  Update your profile information. This will be auto-filled in forms.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={profile.employee_id}
                onChange={(e) => handleChange("employee_id", e.target.value)}
                placeholder="e.g., 057"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={profile.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
                placeholder="e.g., Junior Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                value={profile.mobile_number}
                onChange={(e) => handleChange("mobile_number", e.target.value)}
                placeholder="e.g., 01XXXXXXXXX"
              />
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full bg-tiller-green hover:bg-tiller-green/90"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
