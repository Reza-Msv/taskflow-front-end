"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  KeyRound,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { organizationService } from "@/services/organization-service";
import { useAuth } from "@/modules/auth/context/auth-context";
import { ApiClientError } from "@/services/api-client";
import { toast } from "sonner";

export function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] || "en";
  const { isAuthenticated, user } = useAuth();

  const tokenParam = searchParams?.get("token") || "";
  const [token, setToken] = useState(tokenParam);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedOrgId, setAcceptedOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (tokenParam && !token) {
      setToken(tokenParam);
    }
  }, [tokenParam, token]);

  const handleAccept = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanToken = token.trim();
    if (!cleanToken) {
      setError("Please enter a valid invitation token.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const membership = await organizationService.acceptInvitation(cleanToken);
      toast.success("Invitation accepted! Welcome to the workspace.");
      setAcceptedOrgId(membership.organization_id);
      router.push(`/${currentLocale}/organizations/${membership.organization_id}`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to accept invitation");
        toast.error(err.message || "Failed to accept invitation");
      } else {
        const fallback = "Network error while accepting invitation";
        setError(fallback);
        toast.error(fallback);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-lg pt-6 sm:pt-12">
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-foreground">
              Accept Workspace Invitation
            </CardTitle>
            <CardDescription className="text-xs">
              Join your team on TaskFlow using your secure invitation token.
            </CardDescription>
          </CardHeader>

          {acceptedOrgId ? (
            <CardContent className="space-y-4 text-center">
              <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-6 text-emerald-500">
                <CheckCircle2 className="mb-2 h-10 w-10" />
                <h3 className="font-semibold text-foreground">
                  Invitation Accepted!
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  You are now an active member of the workspace.
                </p>
                <Link
                  href={`/${currentLocale}/organizations/${acceptedOrgId}`}
                  className="mt-4"
                >
                  <Button size="sm" className="gap-1.5 text-xs">
                    <span>Go to Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleAccept}>
              <CardContent className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inv-token">Invitation Token</Label>
                    <span className="text-[11px] text-muted-foreground">
                      Single-use token
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="inv-token"
                      name="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="e.g. 1a2b3c4d5e6f..."
                      disabled={isSubmitting}
                      className="pl-8 font-mono text-xs"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tokens are case-sensitive and valid until the expiration date
                    set by your workspace administrator.
                  </p>
                </div>

                {user && (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      Accepting as:
                    </span>
                    <p className="font-semibold text-foreground">
                      {user.email}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({user.name || "User"})
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Link
                  href={`/${currentLocale}/organizations`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !token.trim()}
                  className="w-full gap-1.5 text-xs sm:w-auto"
                >
                  {isSubmitting ? (
                    "Accepting..."
                  ) : (
                    <>
                      <span>Accept & Join</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
