/**
 * Enhanced AI Mission Advisor — adds natural language processing,
 * conversation history, and proactive suggestions to the base advisor.
 */

import { type DesignInput } from "@/lib/design-link";
import { designMission } from "@/lib/mission";
import { scoreMission, type Scorecard } from "@/lib/score";
import { opsBudget } from "@/lib/life";
import { type Scenario } from "@/lib/scenarios";
import { type MissionDesign } from "@/lib/mission";
import launchVehicles from "@/data/launch-vehicles.json";
import { answerQuestion } from "@/lib/advisor";

const VEHICLES = launchVehicles as unknown as {
  id: string;
  name: string;
  operator: string;
  payloadLEOKg: number;
  costPerLaunchUsd: number;
}[];

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    designSnapshot?: DesignInput;
    action?: "design_created" | "design_modified" | "analysis" | "general";
  };
}

export interface ParsedDesignIntent {
  destination?: "moon" | "mars" | "exoplanet";
  vehicleId?: string;
  crew?: number;
  surfaceDays?: number;
  constraints?: {
    maxRadiationMsv?: number;
    maxDurationDays?: number;
    maxCostUsd?: number;
  };
  confidence: number;
  originalText: string;
}

export interface ProactiveSuggestion {
  id: string;
  type: "slider" | "vehicle" | "tradeoff" | "warning" | "info";
  target: string;
  message: string;
  action?: {
    label: string;
    apply: () => void;
  };
  priority: "high" | "medium" | "low";
}

export interface EnhancedAdvisorContext {
  design?: MissionDesign;
  scorecard?: any;
  scenario?: Scenario;
  conversationHistory: ConversationMessage[];
  currentDesignInput: DesignInput;
}

/**
 * Parse natural language into a design intent
 */
export function parseDesignIntent(text: string): ParsedDesignIntent {
  const lower = text.toLowerCase();
  const intent: ParsedDesignIntent = {
    confidence: 0,
    originalText: text,
  };

  // Destination
  if (lower.includes("moon") || lower.includes("lunar") || lower.includes("artemis")) {
    intent.destination = "moon";
    intent.confidence += 0.3;
  } else if (lower.includes("mars") || lower.includes("red planet")) {
    intent.destination = "mars";
    intent.confidence += 0.3;
  } else if (lower.includes("exoplanet") || lower.includes("proxima") || lower.includes("trappist") || lower.includes("interstellar")) {
    intent.destination = "exoplanet";
    intent.confidence += 0.3;
  }

  // Vehicle
  const vehicleKeywords = {
    "sls": "sls-block-1",
    "saturn": "saturn-v",
    "falcon heavy": "falcon-heavy",
    "falcon 9": "falcon-9",
    "starship": "starship",
  };
  for (const [keyword, id] of Object.entries(vehicleKeywords)) {
    if (lower.includes(keyword)) {
      intent.vehicleId = id;
      intent.confidence += 0.2;
      break;
    }
  }

  // Crew
  const crewMatch = lower.match(/(\d+)\s*(crew|astronaut|people|person)/);
  if (crewMatch) {
    intent.crew = Math.min(6, Math.max(1, parseInt(crewMatch[1])));
    intent.confidence += 0.2;
  }

  // Surface days
  const surfaceMatch = lower.match(/(\d+)\s*(day|sol|surface|stay)/);
  if (surfaceMatch && !lower.includes("total") && !lower.includes("mission") && !lower.includes("transit")) {
    intent.surfaceDays = Math.min(365, Math.max(0, parseInt(surfaceMatch[1])));
    intent.confidence += 0.2;
  }

  // Duration constraint
  const durationMatch = lower.match(/(under|within|less than|max|maximum)\s*(\d+)\s*(day|year)/);
  if (durationMatch) {
    const value = parseInt(durationMatch[2]);
    const unit = durationMatch[3];
    if (unit.startsWith("year")) {
      intent.constraints = { ...intent.constraints, maxDurationDays: value * 365 };
    } else {
      intent.constraints = { ...intent.constraints, maxDurationDays: value };
    }
    intent.confidence += 0.1;
  }

  // Radiation constraint
  const radMatch = lower.match(/(under|within|less than|max|maximum)\s*(\d+)\s*msv/);
  if (radMatch) {
    intent.constraints = { ...intent.constraints, maxRadiationMsv: parseInt(radMatch[2]) };
    intent.confidence += 0.1;
  }

  // Cost constraint
  const costMatch = lower.match(/(under|within|less than|max|maximum)\s*\$?(\d+(?:\.\d+)?)\s*([mb])/);
  if (costMatch) {
    const value = parseFloat(costMatch[2]);
    const unit = costMatch[3];
    if (unit === "b") {
      intent.constraints = { ...intent.constraints, maxCostUsd: value * 1e9 };
    } else {
      intent.constraints = { ...intent.constraints, maxCostUsd: value * 1e6 };
    }
    intent.confidence += 0.1;
  }

  return intent;
}

/**
 * Apply parsed intent to create/update a design input
 */
export function applyDesignIntent(
  currentDesign: DesignInput,
  intent: ParsedDesignIntent
): DesignInput {
  return {
    destination: intent.destination ?? currentDesign.destination,
    vehicleId: intent.vehicleId ?? currentDesign.vehicleId,
    crew: intent.crew ?? currentDesign.crew,
    surfaceDays: intent.surfaceDays ?? currentDesign.surfaceDays,
  };
}

/**
 * Generate proactive suggestions based on current design state
 */
export function generateProactiveSuggestions(
  design: MissionDesign,
  scorecard: Scorecard,
  onApply?: (action: () => void) => void
): ProactiveSuggestion[] {
  const suggestions: ProactiveSuggestion[] = [];

  // Radiation warning
  if (design.radiationMsvTotal > 500 && design.radiationMsvTotal <= 600) {
    suggestions.push({
      id: `rad-warning-${Date.now()}`,
      type: "warning",
      target: "surfaceDays",
      message: `Radiation at ${design.radiationMsvTotal} mSv — close to 600 mSv career limit. Consider reducing surface stay or adding storm shelter.`,
      priority: "high",
    });
  }

  // Mass margin
  if (design.payloadCapacityKg) {
    const margin = (design.payloadCapacityKg - design.requiredMassKg) / design.payloadCapacityKg;
    if (margin < 0.1 && margin > 0) {
      suggestions.push({
        id: `mass-margin-${Date.now()}`,
        type: "warning",
        target: "crew",
        message: `Only ${(margin * 100).toFixed(0)}% mass margin. Reduce crew or surface days to add margin.`,
        priority: "high",
      });
    }
  }

  // Cost optimization
  const budgetObj = scorecard.objectives.find((o: any) => o.id === "budget");
  if (budgetObj && budgetObj.status === "fail") {
    const currentVehicle = design.vehicle.id;
    const cheaperOptions = VEHICLES.filter(v => 
      v.costPerLaunchUsd < design.vehicle.costPerLaunchUsd && 
      v.payloadLEOKg >= design.requiredMassKg * 0.8
    );
    if (cheaperOptions.length > 0) {
      suggestions.push({
        id: `cost-opt-${Date.now()}`,
        type: "tradeoff",
        target: "vehicleId",
        message: `Mission over budget. ${cheaperOptions[0].name} could save ~$${((design.vehicle.costPerLaunchUsd - cheaperOptions[0].costPerLaunchUsd) / 1e6).toFixed(0)}M per launch.`,
        action: {
          label: "Switch vehicle",
          apply: () => onApply?.(() => {}),
        },
        priority: "medium",
      });
    }
  }

  // Radiation + Duration coupling
  if (design.radiationMsvTotal > 400 && design.totalDays > 700) {
    suggestions.push({
      id: `rad-dur-${Date.now()}`,
      type: "tradeoff",
      target: "surfaceDays",
      message: `High radiation (${design.radiationMsvTotal} mSv) + long duration (${design.totalDays} days) = compounded risk. Reduce surface stay to cut both.`,
      priority: "medium",
    });
  }

  // Launch window timing (Mars)
  if (design.destination === "mars") {
    suggestions.push({
      id: `window-${Date.now()}`,
      type: "info",
      target: "surfaceDays",
      message: "Mars launch windows every ~26 months. Next: 2026, 2028, 2031. Surface stay affects which window you target.",
      priority: "low",
    });
  }

  return suggestions.sort((a, b) => {
    const order = { high: 3, medium: 2, low: 1, info: 0 };
    return order[b.priority] - order[a.priority];
  }).slice(0, 3);
}

/**
 * Enhanced answer function with design context awareness
 */
export function answerQuestionEnhanced(
  question: string,
  context: EnhancedAdvisorContext
): string {
  const { design, scorecard, conversationHistory, currentDesignInput } = context;
  
  if (!design || !scorecard) {
    return "I need a mission design to analyze. Build one in the Mission Lab first!";
  }

  // Check if question is asking to modify design
  const modifyKeywords = ["change", "set", "make", "use", "switch", "try", "increase", "decrease", "reduce", "lower", "raise"];
  const isModification = modifyKeywords.some(k => question.toLowerCase().includes(k));
  
  if (isModification) {
    const intent = parseDesignIntent(question);
    if (intent.confidence > 0.3) {
      const newDesign = applyDesignIntent(currentDesignInput, intent);
      return `I can update your design: ${intent.destination ? `destination → ${intent.destination}` : ""} ${intent.vehicleId ? `vehicle → ${intent.vehicleId}` : ""} ${intent.crew ? `crew → ${intent.crew}` : ""} ${intent.surfaceDays ? `surface stay → ${intent.surfaceDays} days` : ""}. 
      
      Would you like me to apply these changes? (This would update the sliders in the Mission Lab)`;
    }
  }

  // Delegate to base answerQuestion for analysis questions
  return answerQuestion(question, { design, scorecard });
}

/**
 * Format conversation history for display
 */
export function formatConversationHistory(
  history: ConversationMessage[],
  maxMessages = 10
): ConversationMessage[] {
  return history.slice(-maxMessages);
}

/**
 * Create a conversation message
 */
export function createMessage(
  role: "user" | "assistant",
  content: string,
  metadata?: ConversationMessage["metadata"]
): ConversationMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date(),
    metadata,
  };
}

/**
 * Save conversation to localStorage
 */
export function saveConversation(history: ConversationMessage[], key = "nasamap-advisor-conversation"): void {
  try {
    const serialized = history.map(m => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    }));
    localStorage.setItem(key, JSON.stringify(serialized));
  } catch {
    // Storage unavailable
  }
}

/**
 * Load conversation from localStorage
 */
export function loadConversation(key = "nasamap-advisor-conversation"): ConversationMessage[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}