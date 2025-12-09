import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, FileText, Menu } from "lucide-react";
import tillerLogo from "@/assets/tiller-logo.jpg";
import headerbg from "@/assets/header-bg.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);

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
        Drafts
      </Link>
    </>
  );

  return (
    <header className="border-b border-border sticky top-0 z-50"
      style={{ backgroundImage: `url(${headerbg})` }}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={tillerLogo} alt="Tiller Logo" className="h-12 w-auto" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-tiller-green">Tiller</h1>
            <p className="text-xs text-muted-foreground">easing spatial solution</p>
          </div>
        </Link>

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
                  My Drafts
                </Link>
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
      </div>
    </header>
  );
}
