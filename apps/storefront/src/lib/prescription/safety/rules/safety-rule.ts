import { SafetyContext, SafetyRuleExecutionResult } from "../safety-types";

/**
 * H4CARE Pharmacy - Safety Rule Interface
 * Phase 5: Deterministic Safety Engine
 */

export interface SafetyRule {
  readonly id: string;
  readonly name: string;
  readonly version: string;

  evaluate(context: SafetyContext): Promise<SafetyRuleExecutionResult>;
}
