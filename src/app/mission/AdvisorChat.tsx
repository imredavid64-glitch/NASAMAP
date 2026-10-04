"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Sparkles, Loader2, Copy, Check } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format as formatDate } from "date-fns";

import { adviseMission, answerQuestion, type AdvisorResponse, type Insight, type Recommendation } from "@/lib/advisor";
import { designMission, type MissionDesign } from "@/lib/mission";
import { type Scorecard } from "@/lib/score";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  insights?: Insight[];
  recommendations?: Recommendation[];
}

interface AdvisorChatProps {
  design: MissionDesign | null;
  scorecard: Scorecard | null;
}

export function AdvisorChat({ design, scorecard }: AdvisorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setShowWelcome(false);
    setIsLoading(true);

    try {
      // Check if we have a mission design to analyze
      if (design && scorecard) {
        const advice = answerQuestion(currentInput, { design, scorecard });
        
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: advice,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I need a mission design to analyze. Please build a mission in the Mission Lab first, then I can help you optimize it!",
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I encountered an error analyzing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "How do I reduce radiation exposure?",
    "Why is my Δv so high?",
    "How can I improve my mass margin?",
    "What's the best way to close the ECLSS loop?",
    "Is my mission within radiation limits?",
    "How do I lower mission cost?",
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    handleSend();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardBody className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-space-cyan" /> Mission Advisor
          </CardTitle>
          <span className="text-xs text-slate-400">AI-powered analysis</span>
        </div>

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
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
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
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about radiation, Δv, mass, ECLSS, cost, or timeline..."
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