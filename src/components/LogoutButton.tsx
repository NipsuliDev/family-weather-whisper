
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import React from "react";

export function LogoutButton() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="secondary"
      className="ml-2"
      disabled={loading}
    >
      {loading ? "Logging out..." : "Log out"}
    </Button>
  );
}
