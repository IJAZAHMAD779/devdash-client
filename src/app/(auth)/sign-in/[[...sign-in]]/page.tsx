import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-surface-1 border border-hairline shadow-2xl rounded-xl",
            headerTitle: "text-ink font-semibold tracking-[-0.6px]",
            headerSubtitle: "text-ink-muted",
            formButtonPrimary: "bg-primary hover:bg-primary-hover text-white text-xs",
            socialButtonsBlockButton: "bg-surface-2 border border-hairline text-ink hover:bg-surface-3",
            formFieldInput: "bg-surface-2 border border-hairline text-ink focus:border-primary",
            footerActionLink: "text-primary hover:text-primary-hover",
          },
        }}
      />
    </div>
  );
}
