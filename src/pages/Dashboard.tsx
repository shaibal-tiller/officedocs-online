import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, Package, Calculator } from "lucide-react";

const formTypes = [
  {
    id: "leave",
    title: "Leave Application",
    description: "Apply for casual, sick, earned leave or LWP",
    icon: FileText,
    href: "/forms/leave",
    color: "bg-tiller-green",
  },
  {
    id: "money",
    title: "Money Requisition",
    description: "Request funds for project expenses",
    icon: DollarSign,
    href: "/forms/money",
    color: "bg-accent",
  },
  {
    id: "material",
    title: "Material Requisition",
    description: "Request materials and supplies",
    icon: Package,
    href: "/forms/material",
    color: "bg-tiller-green",
  },
  {
    id: "advance",
    title: "Advance Adjustment",
    description: "Settle advance payments with expenses",
    icon: Calculator,
    href: "/forms/advance",
    color: "bg-accent",
  },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Tiller Office Forms</h1>
          <p className="text-muted-foreground">
            Select a form type to get started. Your documents will be saved automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {formTypes.map((form) => (
            <Link key={form.id} to={form.href}>
              <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-border hover:border-tiller-green">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${form.color} flex items-center justify-center mb-3`}>
                    <form.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{form.title}</CardTitle>
                  <CardDescription>{form.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-tiller-green font-medium">
                    Create Form →
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="mt-8 bg-tiller-header border-tiller-lime">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  Complete your profile first to auto-fill your information in forms.
                </p>
              </div>
              <Link
                to="/profile"
                className="bg-tiller-green text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-tiller-green/90 transition-colors"
              >
                Update Profile
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
