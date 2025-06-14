
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const [verifyLoading, setVerifyLoading] = useState(false);
  const navigate = useNavigate();

  // New: check if user is already authenticated
  const { user, loading: authLoading } = useSupabaseAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Handle Step 1: Send OTP to user's email
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: undefined, // Not needed for code-flow
      },
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setOtpSent(true);
      toast({
        title: "Check your email",
        description: "We've sent you a 6-digit code! Enter it below.",
      });
    }
  };

  // Handle Step 2: Verify OTP
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    setVerifyLoading(false);

    if (error) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "You're now signed in.",
      });
      navigate("/");
    }
  };

  // Optionally display loading spinner if auth state is being checked
  if (authLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-pink-700 font-bold text-lg animate-pulse">Checking session…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-pink-50">
      <div className="bg-white rounded-2xl border-2 border-pink-200 shadow p-7 w-full max-w-sm flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-pink-700">Sign up / Log in</h2>
        {!otpSent ? (
          <form onSubmit={sendOtp} className="w-full flex flex-col gap-3 mt-5">
            <label
              htmlFor="email"
              className="text-sm text-pink-700 mb-1 font-medium"
            >
              Email
            </label>
            <Input
              value={email}
              id="email"
              type="email"
              required
              placeholder="you@email.com"
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4"
              autoFocus
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-pink-500 hover:bg-pink-600"
            >
              {loading ? "Sending..." : "Send OTP Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="w-full flex flex-col gap-3 mt-5">
            <label
              htmlFor="otp"
              className="text-sm text-pink-700 mb-1 font-medium"
            >
              Enter the 6-digit code sent to <span className="font-semibold">{email}</span>
            </label>
            <Input
              value={otp}
              id="otp"
              type="text"
              autoComplete="one-time-code"
              pattern="\d{6}"
              inputMode="numeric"
              required
              maxLength={6}
              minLength={6}
              placeholder="123456"
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="mb-4 tracking-widest font-mono text-center text-lg"
              autoFocus
              disabled={verifyLoading}
            />
            <Button
              type="submit"
              disabled={verifyLoading || otp.length !== 6}
              className="w-full bg-pink-500 hover:bg-pink-600"
            >
              {verifyLoading ? "Verifying..." : "Verify"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full mt-1"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
              }}
              disabled={verifyLoading}
            >
              Use Different Email
            </Button>
          </form>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-6 max-w-xs text-center">
        You must sign in to use the app. We’ll never send marketing email or spam you.
      </p>
    </div>
  );
}
