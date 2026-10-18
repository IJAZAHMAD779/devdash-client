import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Layers } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-[420px] flex flex-col items-center">
      {/* DevDash Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-11 h-11 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-primary shadow-lg shadow-primary/10 mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-[-0.6px] text-ink">DevDash</h1>
        <p className="text-xs text-ink-muted mt-1">Create your developer workspace account</p>
      </div>

      {/* Bespoke Styled Clerk Sign Up */}
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
              card: "!bg-surface-1 !border !border-hairline !shadow-2xl !rounded-xl !p-6 sm:!p-8 !w-full",
              headerTitle: "!text-ink !font-semibold !tracking-[-0.6px] !text-lg !text-center",
              headerSubtitle: "!text-ink-muted !text-xs !text-center !mt-1",
              socialButtonsBlockButton:
                "!bg-surface-2 !border !border-hairline hover:!bg-surface-3 !text-ink !text-xs !font-medium !transition-colors !h-10 !rounded-lg",
              socialButtonsBlockButtonText: "!text-ink !font-medium !text-xs",
              dividerLine: "!bg-hairline",
              dividerText: "!text-ink-subtle !text-[11px] !uppercase !tracking-wider !font-mono",
              formFieldLabel: "!text-ink-muted !text-xs !font-medium",
              formFieldInput:
                "!bg-surface-2 !border !border-hairline !text-ink !text-xs !rounded-lg focus:!border-primary focus:!ring-1 focus:!ring-primary !h-10 !transition-colors",
              formButtonPrimary:
                "!bg-primary hover:!bg-primary-hover !text-white !text-xs !font-medium !h-10 !tracking-tight !shadow-sm !shadow-primary/25 !transition-all !rounded-lg",
              footerAction: "!bg-transparent !border-t !border-hairline !pt-4 !mt-4",
              footerAction__branding: "hidden",
              footerActionText: "!text-ink-muted !text-xs",
              footerActionLink: "!text-primary hover:!text-primary-hover !text-xs !font-medium",
              footer: "!bg-transparent",
              footerPages: "hidden",
              badge: "hidden",
              developmentBadge: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
