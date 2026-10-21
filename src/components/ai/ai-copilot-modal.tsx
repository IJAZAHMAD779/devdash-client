"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  X,
  Trash2,
  ChevronDown,
  Bot,
  User,
  Zap,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useExecuteAiCommand, useAiStatus } from "@/hooks/use-ai-copilot";
import { AiMessage } from "@/types/ai";
import { AiActionCard } from "./ai-action-card";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  "⏰ Remind me tomorrow at 9 AM to review pending PRs",
  "📋 Create a HIGH priority task to fix database connection pooling",
  "📝 Create note: Architecture decisions for background cron jobs",
  "🔍 What tasks are currently pending in my workspace?",
];

export function AiCopilotModal({ isOpen, onClose }: AiCopilotModalProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am **DevDash Copilot** powered by **Qwen on Groq**.\n\nI can directly manage your workspace through natural language. Ask me to schedule reminders, create Kanban tasks, capture technical notes, or query your active projects.",
      timestamp: new Date().toISOString(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: status } = useAiStatus();
  const executeMutation = useExecuteAiCommand();

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen, executeMutation.isPending]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || executeMutation.isPending) return;

    sound.playClick(800);

    const userMessage: AiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const historyForApi = messages
        .filter((m) => m.id !== "welcome")
        .slice(-5)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await executeMutation.mutateAsync({
        message: prompt,
        history: historyForApi,
      });

      const assistantMessage: AiMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toISOString(),
        actions: response.actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: AiMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ ${
          err?.message ||
          "Could not reach Groq Qwen AI service. Check that GROQ_API_KEY is configured on the backend."
        }`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    sound.playClick(400);
    setMessages([
      {
        id: "welcome-cleared",
        role: "assistant",
        content: "Chat cleared. What can I help you accomplish in DevDash today?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="DevDash AI Copilot"
      className="fixed bottom-20 right-6 z-50 w-[430px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6.5rem)] bg-surface-1/95 border border-hairline-strong rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none"
    >
      {/* 1. Header */}
      <div className="h-14 px-4 border-b border-hairline flex items-center justify-between bg-surface-1 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-ink tracking-tight">
                DevDash Copilot
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-3 text-ink-muted border border-hairline">
                {status?.model ? status.model.replace(/^qwen\//, "") : "qwen3.8-27b"}
              </span>
            </div>
            <span className="text-[10px] text-ink-subtle flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Groq High-Speed Engine</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            title="Clear conversation"
            className="p-1.5 rounded-md hover:bg-surface-2 text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              sound.playClick(600);
              onClose();
            }}
            title="Close Copilot (⌘J)"
            className="p-1.5 rounded-md hover:bg-surface-2 text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Messages Thread Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs select-text">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-1.5 max-w-[88%]",
                isUser ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-tertiary px-1">
                {isUser ? (
                  <>
                    <span>You</span>
                    <User className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-primary" />
                    <span>Qwen Copilot</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  "px-3.5 py-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap break-words",
                  isUser
                    ? "bg-primary text-white rounded-br-xs font-normal"
                    : "bg-surface-2 text-ink border border-hairline rounded-bl-xs font-normal shadow-xs"
                )}
              >
                {msg.content}
              </div>

              {/* Action Cards (Rendered if actions were executed) */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="w-full space-y-2 mt-1">
                  {msg.actions.map((action, idx) => (
                    <AiActionCard key={`${action.type}-${idx}`} action={action} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking State Indicator */}
        {executeMutation.isPending && (
          <div className="flex flex-col gap-1.5 mr-auto items-start max-w-[85%]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-tertiary px-1">
              <Bot className="w-3 h-3 text-primary" />
              <span>Qwen Copilot</span>
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-xs bg-surface-2 border border-hairline flex items-center gap-2.5 text-ink-muted">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              </span>
              <span className="text-[11px] font-mono">
                Executing workspace actions...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Suggested Prompt Chips (Shown when chat has only welcome message) */}
      {messages.length <= 1 && (
        <div className="px-3 py-2 border-t border-hairline/60 bg-surface-1/40 flex flex-wrap gap-1.5 shrink-0">
          {SUGGESTED_PROMPTS.map((promptText, i) => (
            <button
              key={i}
              onClick={() => handleSend(promptText)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink transition-colors text-left cursor-pointer truncate max-w-full"
            >
              {promptText}
            </button>
          ))}
        </div>
      )}

      {/* 4. Input Toolbar */}
      <div className="p-3 border-t border-hairline bg-surface-1 shrink-0">
        <div className="relative flex items-center rounded-xl bg-surface-2 border border-hairline focus-within:border-primary/60 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Qwen to add tasks, schedule reminders..."
            disabled={executeMutation.isPending}
            className="flex-1 max-h-32 min-h-[42px] px-3.5 py-2.5 bg-transparent text-xs text-ink placeholder:text-ink-tertiary focus:outline-none resize-none no-scrollbar"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || executeMutation.isPending}
            title="Send (Enter)"
            className={cn(
              "p-2 mr-1.5 rounded-lg text-white transition-all cursor-pointer shrink-0",
              input.trim() && !executeMutation.isPending
                ? "bg-primary hover:bg-primary-hover shadow-sm shadow-primary/25"
                : "bg-surface-3 text-ink-tertiary opacity-40 cursor-not-allowed"
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1 pt-2 text-[10px] font-mono text-ink-tertiary">
          <span>Groq • Qwen 3.8 27B</span>
          <span>Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  );
}
