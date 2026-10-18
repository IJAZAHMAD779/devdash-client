import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Layers } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Mobile-only brand header (visible on < lg) */}
      <div className="flex lg:hidden flex-col items-center mb-4 text-center">
        <div className="w-9 h-9 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-primary shadow-md shadow-primary/10 mb-2">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-lg font-bold tracking-[-0.6px] text-ink">DevDash</h1>
        <p className="text-[11px] text-ink-muted">Personal Developer Workspace</p>
      </div>

      {/* Bespoke Styled Clerk Sign Up (Optimized for zero-scroll) */}
      <div className="w-full">
        <SignUp
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#5e6ad2",
              colorBackground: "#0f1011",
              colorInputBackground: "#141516",
              colorInputText: "#f7f8f8",
              colorText: "#f7f8f8",
              colorTextSecondary: "#8a8f98",
              borderRadius: "0.5rem",
            },
            elements: {
              rootBox: "w-full",
              card: "!bg-surface-1 !border !border-hairline !shadow-2xl !rounded-xl !p-5 sm:!p-6 !w-full",
              headerTitle: "!text-ink !font-semibold !tracking-[-0.6px] !text-base !text-center",
              headerSubtitle: "!text-ink-muted !text-xs !text-center !mt-0.5",
              socialButtonsBlockButton:
                "!bg-surface-2 !border !border-hairline hover:!bg-surface-3 !text-ink !text-xs !font-medium !transition-colors !h-9 !rounded-lg",
              socialButtonsBlockButtonText: "!text-ink !font-medium !text-xs",
              dividerLine: "!bg-hairline",
              dividerText: "!text-ink-subtle !text-[10px] !uppercase !tracking-wider !font-mono",
              formFieldLabel: "!text-ink-muted !text-xs !font-medium",
              formFieldInput:
                "!bg-surface-2 !border !border-hairline !text-ink !text-xs !rounded-lg focus:!border-primary focus:!ring-1 focus:!ring-primary !h-9 !transition-colors",
              formButtonPrimary:
                "!bg-primary hover:!bg-primary-hover !text-white !text-xs !font-medium !h-9 !tracking-tight !shadow-sm !shadow-primary/25 !transition-all !rounded-lg",
              footer: "hidden",
              footerAction: "hidden",
              footerPages: "hidden",
              badge: "hidden",
              developmentBadge: "hidden",
            },
          }}
        />
      </div>

      {/* Clean, Non-Branded Auth Switch Link */}
      <div className="mt-3.5 text-center text-xs text-ink-muted">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-primary hover:text-primary-hover font-medium hover:underline transition-colors ml-0.5"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
