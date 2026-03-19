"use client";

import { useState } from "react";
import { insforge } from "@/utils/insforge/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await insforge.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) throw signUpError;
        
        if (data?.requireEmailVerification) {
          setVerificationRequired(true);
        } else if (data?.accessToken) {
          router.push("/");
        }
      } else {
        const { data, error: signInError } = await insforge.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        
        if (data?.user) {
          router.push("/");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await insforge.auth.verifyEmail({
        email,
        otp,
      });

      if (verifyError) throw verifyError;

      if (data?.user) {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 dot-grid">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center dark:text-white">
          Spaceup.ai
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {verificationRequired ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm border border-blue-200 bg-blue-50 text-blue-700 p-3 rounded-lg dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
              Please enter the 6-digit verification code sent to {email}.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-zinc-300">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white"
                required
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-zinc-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-zinc-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white p-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
