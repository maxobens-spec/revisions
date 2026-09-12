import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { MODELS } from "../ai/models";
import { recordAiCall, type AiCallRecord } from "../ai/usage";
import { gradingSystemPrompt, gradingUserMessage, type GradingPromptInput } from "./prompt";

/** Une réponse de collégien tient largement dedans ; au-delà, on refuse plutôt que de tronquer. */
export const MAX_ANSWER_CHARS = 2000;

export const EMPTY_ANSWER_EXPLANATION = "Tu n'as pas répondu. Relis le passage du cours et réessaie.";

const CorrectionSchema = z.object({
  verdict: z.enum(["su", "approximatif", "non_su"]),
  explication: z.string(),
});

export type Verdict = z.infer<typeof CorrectionSchema>["verdict"];

export type GradeInput = GradingPromptInput;

export interface GradeResult {
  readonly verdict: Verdict;
  readonly explanation: string;
  /** 2 quand la réponse complète une première tentative : à conserver pour FSRS et le suivi parent. */
  readonly attempt: 1 | 2;
  /** L'appel à enregistrer dans ai_calls ; null quand aucune IA n'a été appelée. */
  readonly call: AiCallRecord | null;
}

export class GradingError extends Error {
  constructor(
    message: string,
    /** Présent si l'appel a eu lieu : son coût doit être enregistré même en cas d'échec. */
    readonly call: AiCallRecord | null = null,
  ) {
    super(message);
    this.name = "GradingError";
  }
}

export async function gradeOpenAnswer(client: Anthropic, input: GradeInput): Promise<GradeResult> {
  const attempt = input.previousAttempt?.trim() ? 2 : 1;

  if (input.question.trim() === "" || input.expectedAnswer.trim() === "") {
    throw new GradingError("question ou réponse attendue manquante");
  }
  // Réponse vide : inutile d'appeler l'IA.
  if (input.studentAnswer.trim() === "") {
    return { verdict: "non_su", explanation: EMPTY_ANSWER_EXPLANATION, attempt, call: null };
  }
  if (input.studentAnswer.length > MAX_ANSWER_CHARS || (input.previousAttempt?.length ?? 0) > MAX_ANSWER_CHARS) {
    throw new GradingError(`réponse trop longue (maximum ${MAX_ANSWER_CHARS} caractères)`);
  }

  const startedAt = Date.now();
  const response = await client.messages.parse({
    model: MODELS.grading,
    max_tokens: 512,
    temperature: 0.2,
    system: gradingSystemPrompt(input.level, attempt === 2),
    messages: [{ role: "user", content: gradingUserMessage(input) }],
    output_config: { format: zodOutputFormat(CorrectionSchema) },
  });
  const call = recordAiCall("grading", response.model, response.usage, Date.now() - startedAt);

  if (response.stop_reason === "refusal") throw new GradingError("correction refusée par le modèle", call);
  const correction = response.parsed_output;
  if (correction == null) throw new GradingError(`sortie illisible (stop_reason : ${response.stop_reason})`, call);

  return { verdict: correction.verdict, explanation: correction.explication, attempt, call };
}
