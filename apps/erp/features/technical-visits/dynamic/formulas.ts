import type { DynamicAnswers } from "./visibility";

type Token = { kind: "num"; value: number } | { kind: "ref"; id: string } | { kind: "op"; op: string };

const OPS: Record<string, (a: number, b: number) => number> = {
  "*": (a, b) => a * b,
  "/": (a, b) => (b === 0 ? 0 : a / b),
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
};

const PRECEDENCE: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < formula.length) {
    const ch = formula[i];
    if (ch === " ") { i++; continue; }
    if ("+-*/".includes(ch)) {
      tokens.push({ kind: "op", op: ch });
      i++;
      continue;
    }
    if (/\d/.test(ch)) {
      let num = "";
      while (i < formula.length && /[\d.]/.test(formula[i])) { num += formula[i]; i++; }
      tokens.push({ kind: "num", value: Number(num) });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let id = "";
      while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) { id += formula[i]; i++; }
      tokens.push({ kind: "ref", id });
      continue;
    }
    i++;
  }
  return tokens;
}

function resolve(token: Token, answers: DynamicAnswers): number {
  if (token.kind === "num") return token.value;
  if (token.kind === "ref") {
    const v = answers[token.id];
    if (typeof v === "number") return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Evaluate a simple arithmetic formula referencing field IDs.
 * Supports: field refs, numbers, +, -, *, /
 * No eval, no parentheses (sufficient for surface = L*W, volume = L*W*H).
 */
export function evaluateFormula(formula: string, answers: DynamicAnswers): number | null {
  if (!formula?.trim()) return null;

  const tokens = tokenize(formula);
  if (tokens.length === 0) return null;

  if (tokens.some((t) => t.kind === "op" && !(t.op in OPS))) return null;

  const values: number[] = [];
  const ops: string[] = [];

  function applyTop() {
    const b = values.pop()!;
    const a = values.pop()!;
    const op = ops.pop()!;
    values.push((OPS[op] ?? (() => 0))(a, b));
  }

  for (const token of tokens) {
    if (token.kind === "num" || token.kind === "ref") {
      values.push(resolve(token, answers));
    } else if (token.kind === "op") {
      while (ops.length > 0 && (PRECEDENCE[ops[ops.length - 1]] ?? 0) >= (PRECEDENCE[token.op] ?? 0)) {
        applyTop();
      }
      ops.push(token.op);
    }
  }

  while (ops.length > 0) {
    applyTop();
  }

  const result = values[0];
  return result !== undefined && Number.isFinite(result) ? Math.round(result * 100) / 100 : null;
}
