import React, { useEffect, useMemo, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "@/lib/auth";
import DesktopLayout from "@/components/DesktopLayout";
import NotFound from "@/pages/NotFound";
import LandingGate from "@/components/LandingGate";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { USER_ROLES, UserRole } from "@/lib/sitecommand-types";

import loginLanding from "@/assets/login-landing.jpg";

export default function AppGate() {
  const { user, loading, profile, updateProfile, signOut } = useAuth();

  const [busy, setBusy] = useState(false);

  // server / unexpected errors
  const [err, setErr] = useState<string | null>(null);

  // inline validation errors
  const [companyErr, setCompanyErr] = useState<string | null>(null);
  const [roleErr, setRoleErr] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [role, setRole] = useState<UserRole | undefined>(undefined);

  const needsOnboarding = useMemo(() => {
    return !!(profile && profile.onboarded === false);
  }, [profile]);

  useEffect(() => {
    if (!needsOnboarding) return;

    setCompanyName((prev) => (prev ? prev : (profile?.company_name ?? "")));
    setSiteName((prev) => (prev ? prev : (profile?.site_name ?? "")));
    setRole((prev) => (prev ? prev : (profile?.role as UserRole | undefined)));
  }, [needsOnboarding, profile?.company_name, profile?.site_name, profile?.role]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center text-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <LandingGate />;
  }

  if (needsOnboarding) {
    const selectedRoleMeta = USER_ROLES.find((r) => r.value === role);

    return (
      <div
        className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(" + loginLanding + ")" }}
      >
        <div className="min-h-screen w-full flex items-center justify-center bg-black/40 p-6">
          <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-background/95">
            <CardHeader className="relative">
              <div className="absolute right-6 top-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      setErr(null);
                      await signOut();
                    } catch (e: any) {
                      setErr(e?.message || "Failed to sign out.");
                    }
                  }}
                >
                  Sign out
                </Button>
              </div>

              <CardTitle>Welcome to Long Line Diary</CardTitle>
              <CardDescription>Set up your company profile to continue.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {err && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {err}
                </div>
              )}

              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (companyErr) setCompanyErr(null);
                    if (err) setErr(null);
                  }}
                  placeholder="Enter company name"
                  autoFocus
                />
                {companyErr && <div className="text-xs text-red-600">{companyErr}</div>}
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => {
                    setRole(v as UserRole);
                    if (roleErr) setRoleErr(null);
                    if (err) setErr(null);
                  }}
                >
                  <SelectTrigger className="h-auto min-h-10 items-start">
                    <SelectValue
                      placeholder="Select your role"
                      className="whitespace-normal break-words text-left"
                    />
                  </SelectTrigger>

                  <SelectContent className="max-w-[var(--radix-select-trigger-width)]">
                    {USER_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <div className="flex flex-col text-left whitespace-normal break-words">
                          <div className="text-sm leading-snug whitespace-normal break-words">{r.label}</div>
                          <div className="text-xs opacity-70 leading-snug whitespace-normal break-words">{r.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedRoleMeta?.description ? (
                  <div className="text-xs opacity-70 whitespace-normal break-words">{selectedRoleMeta.description}</div>
                ) : null}

                {roleErr && <div className="text-xs text-red-600">{roleErr}</div>}
              </div>

              <div className="space-y-2">
                <Label>Primary Site (Optional)</Label>
                <Input
                  value={siteName}
                  onChange={(e) => {
                    setSiteName(e.target.value);
                    if (err) setErr(null);
                  }}
                  placeholder="e.g. Bethlehem Medical Centre"
                />
              </div>

              <Button
                className="w-full mt-4"
                disabled={busy}
                onClick={async () => {
                  const cn = companyName.trim();
                  const sn = siteName.trim();

                  let ok = true;

                  if (!cn) {
                    setCompanyErr("Company name is required.");
                    ok = false;
                  } else {
                    setCompanyErr(null);
                  }

                  if (!role) {
                    setRoleErr("Please select a role.");
                    ok = false;
                  } else {
                    setRoleErr(null);
                  }

                  if (!ok) return;

                  try {
                    setBusy(true);
                    setErr(null);

                    const result = await updateProfile({
                      company_name: cn,
                      site_name: sn || null,
                      role,
                      onboarded: true,
                    });

                    if (result?.error) setErr(result.error);
                  } catch (e: any) {
                    setErr(e?.message || "Failed to complete onboarding.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Saving..." : "Continue to Dashboard"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <HashRouter basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/*" element={<DesktopLayout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}


