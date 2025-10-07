"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useDispatch } from "react-redux";
import { setClient } from "@/app/store/features/userSlice";
import { getClient } from "@/app/_actions/data-serves";

export function SignUpForm({ className, ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const dispatch = useDispatch();

  const handleSignUp = async (e) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const emailParts = email.split("@");
      const companyName =
        emailParts[0].charAt(0).toUpperCase() +
        emailParts[0].slice(1) +
        " Company";
      const fullName =
        emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName,
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        console.error("❌ Auth error:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("User creation failed - no user data returned");
      }

      const { setupNewAccount } = await import("@/app/_actions/auth");
      const result = await setupNewAccount({
        user_id: authData.user.id,
        email: email,
        company_name: companyName,
        full_name: fullName,
      });

      if (!result.success) {
        console.error("❌ Setup failed:", result.error);
        setError(
          "Account created, but there was an issue with company setup. Please contact support."
        );
        router.push("/company");
        return;
      }

      // ✅ بعد ما يتم إنشاء الحساب بالكامل، نحمل بيانات العميل في Redux
      try {
        const client = await getClient(authData.user.id);
        if (client) {
          dispatch(setClient(client)); // 🧠 تخزين بيانات المستخدم في Redux
          console.log("✅ Client loaded into Redux:", client.name);
        } else {
          console.warn("⚠️ No client data found after setup.");
        }
      } catch (fetchError) {
        console.error("❌ Error fetching client after signup:", fetchError);
      }

      // ✅ تحويل المستخدم بعد التسجيل الناجح
      router.push("/company");
    } catch (error) {
      console.error("🚨 Signup error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during signup. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create your company account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  You'll complete company setup after signup
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="repeatPassword">Repeat Password</Label>
                <Input
                  id="repeatPassword"
                  type="password"
                  placeholder="Repeat your password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating your account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
