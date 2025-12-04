import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User, FileText, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import tillerLogo from "@/assets/tiller-logo.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface HeaderProps {
  user?: { email?: string } | null;
}

export function Header({ user }: HeaderProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
      });
      navigate("/auth");
    }
  };

  const NavLinks = () => (
    <>
      <Link
        to="/dashboard"
        className="text-foreground hover:text-tiller-green transition-colors font-medium"
        onClick={() => setOpen(false)}
      >
        Dashboard
      </Link>
      <Link
        to="/history"
        className="text-foreground hover:text-tiller-green transition-colors font-medium"
        onClick={() => setOpen(false)}
      >
        History
      </Link>
    </>
  );

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={tillerLogo} alt="Tiller Logo" className="h-12 w-auto" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-tiller-green">Tiller</h1>
            <p className="text-xs text-muted-foreground">easing spatial solution</p>
          </div>
        </Link>

        {user && (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLinks />
            </nav>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/history" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      My Documents
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <nav className="flex flex-col gap-4 mt-8">
                    <NavLinks />
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
