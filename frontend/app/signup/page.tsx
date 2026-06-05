"use client";

import { useState } from "react";
import Link from "next/link";
import { Rocket } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  const { signup } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(username, email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <Card className="relative w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-secondary/90">
            <Rocket className="h-3 w-3" />
            <span>new transmission</span>
          </div>
          <CardTitle>Forge a callsign</CardTitle>
          <CardDescription>
            Claim a unique handle so the cosmos knows where to ring you.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-widest text-muted-foreground">
                Callsign
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                pattern="[a-zA-Z0-9_]+"
                minLength={3}
                required
                autoFocus
                placeholder="commander_42"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">
                Beacon (email)
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">
                Passphrase
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Launching..." : "Launch"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already aboard?{" "}
              <Link className="text-primary underline-offset-4 hover:underline" href="/login">
                Resume orbit
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
