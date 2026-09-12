import type { SupabaseClient } from "@supabase/supabase-js";

export interface QuestionInput {
  readonly question: string;
  readonly reponseAttendue: string;
  readonly source: string;
  readonly sourceStart: number;
  readonly sourceEnd: number;
  readonly difficulte: string;
  readonly type: "ouverte" | "qcm" | "vrai_faux";
  readonly natureContenu: "vocabulaire" | "date" | "notion";
}

export interface CourseInput {
  readonly sessionId: string;
  readonly matiere: string;
  readonly niveau: string;
  readonly texteOriginal: string;
  readonly texteFige: string;
  readonly questions: readonly QuestionInput[];
}

/** Enregistre un cours et ses questions. Retourne l'id du cours créé. */
export async function saveCourse(client: SupabaseClient, input: CourseInput): Promise<string> {
  const { data: course, error: courseError } = await client
    .from("courses")
    .insert({
      session_id: input.sessionId,
      matiere: input.matiere,
      niveau: input.niveau,
      texte_original: input.texteOriginal,
      texte_fige: input.texteFige,
    })
    .select("id")
    .single();

  if (courseError || !course) {
    throw new Error(`échec de l'enregistrement du cours : ${courseError?.message}`);
  }

  if (input.questions.length > 0) {
    const { error: questionsError } = await client.from("questions").insert(
      input.questions.map((q) => ({
        course_id: course.id,
        question: q.question,
        reponse_attendue: q.reponseAttendue,
        source: q.source,
        source_start: q.sourceStart,
        source_end: q.sourceEnd,
        difficulte: q.difficulte,
        type: q.type,
        nature_contenu: q.natureContenu,
      })),
    );

    if (questionsError) {
      throw new Error(`échec de l'enregistrement des questions : ${questionsError.message}`);
    }
  }

  return course.id as string;
}
