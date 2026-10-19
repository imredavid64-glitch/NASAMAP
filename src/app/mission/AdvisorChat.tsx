"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, Sparkles, Loader2, Copy, Check, Mic, MicOff, Bell, Zap, Shield, ArrowUpRight } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format as formatDate } from "date-fns";

import { 
  answerQuestionEnhanced, 
  type ConversationMessage, 
  type ProactiveSuggestion,
  formatConversationHistory,
  createMessage,
  saveConversation,
  loadConversation,
  generateProactiveSuggestions
} from "@/lib/advisor-enhanced";
import { designMission, type MissionDesign } from "@/lib/mission";
import { scoreMission, type Scorecard } from "@/lib/score";

// Type for SpeechRecognition
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface AdvisorChatProps {
  design: MissionDesign | null;
  scorecard: Scorecard | null;
  currentDesignInput: any;
  onApplyDesignChange?: (updates: Partial<any>) => void;
}

export function AdvisorChat({ design, scorecard, currentDesignInput, onApplyDesignChange }: AdvisorChatProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>(() => loadConversation());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate proactive suggestions when design/scorecard changes
  useEffect(() => {
    if (design && scorecard) {
      const suggestions = generateProactiveSuggestions(design, scorecard, (apply) => {
        // Apply the suggestion by calling onApplyDesignChange
        apply();
      });
      setProactiveSuggestions(suggestions);
    }
  }, [design, scorecard, onApplyDesignChange]);

  // Speech recognition setup. `speechSupported` starts false so the server render
  // never touches `window` (SSR has no window) and hydration stays consistent.
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setSpeechSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = createMessage("user", input);
    setMessages((prev) => {
      const updated = [...prev, userMessage];
      saveConversation(updated);
      return updated;
    });

    const currentInput = input;
    setInput("");
    setShowWelcome(false);
    setIsLoading(true);

    try {
      if (design && scorecard) {
        const answer = answerQuestionEnhanced(currentInput, {
          design,
          scorecard,
          conversationHistory: messages,
          currentDesignInput,
        });

        const assistantMessage = createMessage("assistant", answer);
        setMessages((prev) => {
          const updated = [...prev, assistantMessage];
          saveConversation(updated);
          return updated;
        });

        // If the response contains a design change proposal, offer to apply it
        if (answer.includes("Would you like me to apply these changes?")) {
          // We'll handle this via a special metadata flag
        }
      } else {
        const assistantMessage = createMessage("assistant", 
          "I need a mission design to analyze. Please build a mission in the Mission Lab first, then I can help you optimize it!"
        );
        setMessages((prev) => {
          const updated = [...prev, assistantMessage];
          saveConversation(updated);
          return updated;
        });
      }
    } catch (error) {
      const assistantMessage = createMessage("assistant", 
        "I encountered an error analyzing your question. Please try again."
      );
      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        saveConversation(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [design, scorecard, messages, currentDesignInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    } else if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    handleSend();
  };

  const handleApplySuggestion = (suggestion: ProactiveSuggestion) => {
    if (suggestion.action && onApplyDesignChange) {
      suggestion.action.apply();
    }
    // Dismiss this suggestion
    setProactiveSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleDismissSuggestion = (id: string) => {
    setProactiveSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const quickQuestions = [
    "How do I reduce radiation exposure?",
    "Why is my Δv so high?",
    "How can I improve my mass margin?",
    "What's the best way to close the ECLSS loop?",
    "Is my mission within radiation limits?",
    "How do I lower mission cost?",
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardBody className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-space-cyan" /> Mission Advisor
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">AI-powered analysis</span>
          </div>
        </div>

        {/* Proactive Suggestions Banner */}
        {proactiveSuggestions.length > 0 && showSuggestions && (
          <div className="mb-4 space-y-2" role="region" aria-label="Proactive suggestions">
            {proactiveSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`flex items-start gap-3 p-3 rounded-xl border ${
                  suggestion.priority === "high" 
                    ? "border-red-500/30 bg-red-500/10"
                    : suggestion.priority === "medium"
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-space-cyan/30 bg-space-cyan/10"
                }`}
                role="alert"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {suggestion.priority === "high" && <Shield className="h-3.5 w-3.5 text-red-400" />}
                    {suggestion.priority === "medium" && <Zap className="h-3.5 w-3.5 text-amber-400" />}
                    {suggestion.priority === "low" && <Sparkles className="h-3.5 w-3.5 text-space-cyan" />}
                    <span className="text-xs font-medium text-slate-300 capitalize">{suggestion.priority} priority</span>
                  </div>
                  <p className="text-xs text-slate-300">{suggestion.message}</p>
                  {suggestion.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => handleApplySuggestion(suggestion)}
                    >
                      {suggestion.action.label}
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 p-1"
                  onClick={() => handleDismissSuggestion(suggestion.id)}
                  aria-label="Dismiss suggestion"
                >
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 pr-2 overflow-y-auto">
          <div className="space-y-4">
            {showWelcome && messages.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-space-cyan/50" />
                <p className="text-sm mb-2">Ask me anything about your mission design</p>
                <p className="text-xs text-slate-400">I can analyze radiation, Δv, mass, ECLSS, cost, and more</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {quickQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleQuickQuestion(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-space-cyan/20 text-white"
                    : "bg-white/5 border border-white/10 text-slate-300"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-500">
                      {formatDate(message.timestamp, "HH:mm")}
                    </span>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-5 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                        }}
                        aria-label="Copy response"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-space-cyan" />
                  <span className="text-sm text-slate-400">Analyzing your mission...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="mt-4 border-t border-white/10 pt-4">
          {/* Voice input button */}
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant={isListening ? "default" : "outline"}
              size="sm"
              onClick={handleVoiceInput}
              disabled={isLoading || !speechSupported}
              className={isListening ? "bg-red-500/20 border-red-500/40 text-red-400" : ""}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
            >
              {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isListening ? "Listening..." : "Voice"}</span>
            </Button>
            <span className="text-[10px] text-slate-500">Click to speak your question</span>
          </div>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about radiation, Δv, mass, ECLSS, cost, or timeline... or say 'Design a Mars mission for 4 crew'..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="whitespace-nowrap"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 text-center">
            Powered by NASAMAP's physics engine • All advice grounded in NASA references
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

function format(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}