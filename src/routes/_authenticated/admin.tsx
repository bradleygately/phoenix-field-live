import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminQr } from "@/components/admin/AdminQr";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isCurrentUserAdmin } from "@/lib/release-supabase";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Release Console | PSI Games Crew" },
      {
        name: "description",
        content:
          "Production console for PSI Games 2026 signed media releases: search, restrictions, signed PDFs and CSV export.",
      },
      { property: "og:title", content: "Release Console | PSI Games Crew" },
      {
        property: "og:description",
        content: "Search, review and export PSI Games 2026 signed media releases.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"records" | "qr">("records");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
      setIsAdmin(await isCurrentUserAdmin());
    })();
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div>
      <BrandHeader subtitle="Release console" />
      <main className="mx-auto max-w-4xl px-4 pb-16">
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Release console</h1>
            <p className="mt-1 truncate text-xs text-muted-foreground">Signed in as {email}</p>
          </div>
          <Button variant="outline" onClick={() => void signOut()} className="min-h-11 shrink-0">
            Sign out
          </Button>
        </div>

        {isAdmin === false ? (
          <p className="mt-8 rounded-lg border-2 border-destructive bg-destructive/10 p-4 text-sm font-semibold">
            This account does not have production admin access. Ask an existing admin to grant your
            account the admin role.
          </p>
        ) : (
          <>
            <div className="mt-6 flex gap-2">
              {(
                [
                  ["records", "Records"],
                  ["qr", "QR signage"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  variant={tab === value ? "default" : "outline"}
                  onClick={() => setTab(value)}
                  aria-pressed={tab === value}
                  className="min-h-11"
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="mt-6">{tab === "records" ? <AdminDashboard /> : <AdminQr />}</div>
          </>
        )}
      </main>
    </div>
  );
}
