import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Production Sign In | PSI Games Crew" },
      {
        name: "description",
        content:
          "Secure sign in for Mojo Phoenix Productions crew to review PSI Games 2026 signed media releases.",
      },
      { property: "og:title", content: "Production Sign In | PSI Games Crew" },
      {
        property: "og:description",
        content: "Crew-only access to the PSI Games 2026 media release archive.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"in" | "up">("in");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div>
      <BrandHeader subtitle="Production sign in" />
      <main className="mx-auto max-w-md px-4 py-12">
        <Lock className="h-10 w-10 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-black tracking-tight">Production sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Crew access only. Participants do not need an account to sign a release.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-12"
            />
          </div>
          <Button type="submit" disabled={busy} className="min-h-12 w-full">
            {busy ? "Working…" : mode === "in" ? "Sign in" : "Create crew account"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full"
            onClick={() => setMode((m) => (m === "in" ? "up" : "in"))}
          >
            {mode === "in" ? "Need a crew account? Sign up" : "Already have an account? Sign in"}
          </Button>
        </form>
      </main>
    </div>
  );
}
