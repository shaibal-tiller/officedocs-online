import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="h-16 bg-card border-b border-border">
          <Skeleton className="h-full w-full" />
        </div>
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
