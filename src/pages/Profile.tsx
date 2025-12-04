import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
  full_name: string;
  employee_id: string;
  designation: string;
  mobile_number: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    employee_id: "",
    designation: "",
    mobile_number: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error } = await (supabase
      .from("profiles" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle() as any);

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        employee_id: data.employee_id || "",
        designation: data.designation || "",
        mobile_number: data.mobile_number || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);

    const { data: existing } = await (supabase
      .from("profiles" as any)
      .select("id")
      .eq("user_id", userId)
      .maybeSingle() as any);

    let error;
    if (existing) {
      const result = await (supabase
        .from("profiles" as any)
        .update(profile)
        .eq("user_id", userId) as any);
      error = result.error;
    } else {
      const result = await (supabase
        .from("profiles" as any)
        .insert({ ...profile, user_id: userId }) as any);
      error = result.error;
    }

    setSaving(false);
    if (error) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated!",
        description: "Your information will be auto-filled in forms.",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

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
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={profile.employee_id}
                onChange={(e) => setProfile({ ...profile, employee_id: e.target.value })}
                placeholder="e.g., 057"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={profile.designation}
                onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                placeholder="e.g., Junior Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                value={profile.mobile_number}
                onChange={(e) => setProfile({ ...profile, mobile_number: e.target.value })}
                placeholder="e.g., 01XXXXXXXXX"
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full bg-tiller-green hover:bg-tiller-green/90"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
