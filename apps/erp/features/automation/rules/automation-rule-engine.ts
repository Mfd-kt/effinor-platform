import type { CockpitAlert } from "@/features/dashboard/domain/cockpit";
import { getAutomationConfig } from "@/features/automation/domain/config";
import type { AutomationRuleDecision } from "@/features/automation/domain/types";

/**
 * Couche règles explicites avant envoi Slack / relances.
 * Les garde-fous évitent le bruit : sévérité, priorité, enjeu €, catégories.
 */

function isImmediateCashSignal(a: CockpitAlert): boolean {
  return (
    a.priorityLevel === "urgent" &&
    (a.estimatedImpactEuro ?? 0) >= getAutomationConfig().slackMinImpactEuroForWarning * 2
  );
}

/**
 * Décide si une alerte cockpit doit déclencher une notification Slack « intelligente ».
 */
export function evaluateAutomationRuleForSlack(alert: CockpitAlert): AutomationRuleDecision {
  const cfg = getAutomationConfig();
  const impact = alert.estimatedImpactEuro ?? 0;
  const cash = isImmediateCashSignal(alert);

  if (alert.severity === "critical") {
    return {
      ruleId: "slack:critical:any",
      slack: true,
      slackReason: "Alerte cockpit critique.",
      immediateCashSignal: cash,
    };
  }

  if (alert.severity === "warning") {
    if (alert.priorityLevel === "urgent") {
      return {
        ruleId: "slack:warning:urgent",
        slack: true,
        slackReason: "Warning avec priorité urgente.",
        immediateCashSignal: cash,
      };
    }
    if (impact >= cfg.slackMinImpactEuroForWarning) {
      return {
        ruleId: "slack:warning:impact",
        slack: true,
        slackReason: `Warning avec enjeu estimé ≥ ${cfg.slackMinImpactEuroForWarning} €.`,
        immediateCashSignal: cash,
      };
    }
    if (alert.category === "staffing" || alert.category === "configuration") {
      return {
        ruleId: "slack:warning:structural",
        slack: true,
        slackReason: "Risque structurel (staffing ou configuration).",
        immediateCashSignal: false,
      };
    }
  }

  if (alert.severity === "info" && alert.category === "activity" && alert.priorityLevel === "urgent") {
    return {
      ruleId: "slack:info:activity_urgent",
      slack: true,
      slackReason: "Activité / funnel : signal urgent.",
      immediateCashSignal: false,
    };
  }

  return {
    ruleId: "slack:skip:default",
    slack: false,
    slackReason: "Sous les seuils ou non prioritaire pour Slack.",
    immediateCashSignal: false,
  };
}

export function shouldSendSlackSmartAlert(alert: CockpitAlert): boolean {
  const cfg = getAutomationConfig();
  if (!cfg.slackSmartEnabled) return false;
  return evaluateAutomationRuleForSlack(alert).slack;
}
