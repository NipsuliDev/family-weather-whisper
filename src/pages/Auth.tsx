
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const signInWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Always set the redirect URL on login/signup
    const redirectTo = `${window.location.origin}/`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({
        title: "Check your email",
        description: "We sent you a login link! Click it to sign in.",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-pink-50">
      <div className="bg-white rounded-2xl border-2 border-pink-200 shadow p-7 w-full max-w-sm flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-pink-700">Sign up / Log in</h2>
        {!sent ? (
          <form onSubmit={signInWithOtp} className="w-full flex flex-col gap-3 mt-5">
            <label htmlFor="email" className="text-sm text-pink-700 mb-1 font-medium">
              Email
            </label>
            <Input
              value={email}
              id="email"
              type="email"
              required
              placeholder="you@email.com"
              onChange={e => setEmail(e.target.value)}
              className="mb-4"
              autoFocus
            />
            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-pink-500 hover:bg-pink-600"
            >
              {loading ? "Sending..." : "Send Login Link"}
            </Button>
          </form>
        ) : (
          <div className="text-center mt-6 mb-4 text-pink-800">
            <p className="mb-2 font-medium">
              Check your inbox!
            </p>
            <p>
              We&apos;ve sent a sign-in link to <span className="font-semibold">{email}</span>.
            </p>
            <Button
              className="mt-6"
              variant="secondary"
              onClick={() => setSent(false)}
            >
              Use Different Email
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-6 max-w-xs text-center">
        You must sign in to use the app. We’ll never send marketing email or spam you.
      </p>
    </div>
  );
}
