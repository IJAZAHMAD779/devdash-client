"use client";

import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useDigestPreview, useSendDigest } from "@/hooks/use-digest";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DigestModal({ isOpen, onClose }: Props) {
  const { user } = useUser();
  const { data: digestData, isLoading, refetch } = useDigestPreview(isOpen);
  const sendDigest = useSendDigest();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sentSuccessMessage, setSentSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const email =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        "";
      setRecipientEmail(email);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSendEmail = async () => {
    sound.playClick(900);
    setSentSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await sendDigest.mutateAsync({
        recipientEmail: recipientEmail.trim() || undefined,
      });
      setSentSuccessMessage(
        `Digest successfully dispatched to ${res.recipient} (${
          res.mode === "live"
            ? "Live via Resend"
            : "Simulated - configure RESEND_API_KEY in server env"
        })`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to dispatch email via Resend");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-surface-1 border border-hairline rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-1/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-[-0.3px] text-ink">
                Weekly Developer Digest
              </h2>
              <p className="text-[11px] text-ink-muted">
                Personalized summary of tasks shipped, active repos, and saved assets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="developer@example.com"
              title="Recipient email address"
              className="px-2.5 py-1 text-xs rounded-md bg-surface-2 border border-hairline text-ink focus:outline-none focus:border-primary w-48 sm:w-56 font-mono"
            />
            <button
              onClick={handleSendEmail}
              disabled={sendDigest.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
            >
              {sendDigest.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sent Success Banner */}
        {sentSuccessMessage && (
          <div className="px-6 py-2.5 bg-semantic-success/10 border-b border-semantic-success/20 flex items-center gap-2 text-xs text-semantic-success animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{sentSuccessMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-2 text-xs text-rose-400 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Digest Preview Area */}
        <div className="flex-1 overflow-hidden bg-black flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-ink-muted">
              <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
              <span className="ml-2">Generating weekly digest preview...</span>
            </div>
          ) : digestData?.html ? (
            <iframe
              srcDoc={digestData.html}
              title="Weekly Digest Email Preview"
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-ink-muted">
              No preview available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-hairline bg-surface-1/90 flex items-center justify-between text-[11px] text-ink-muted">
          <span>Automated dispatch triggered weekly via lightweight cron</span>
          <span className="font-mono text-[10px] text-ink-subtle">
            Powered by Resend
          </span>
        </div>
      </div>
    </div>
  );
}
