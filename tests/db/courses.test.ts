import { describe, expect, it } from "vitest";
import { saveCourse, type CourseInput } from "../../lib/db/courses";

// Client Supabase simulé : on vérifie la forme des requêtes, sans réseau ni coût.
function fakeClient(courseId: string) {
  const calls: { table: string; payload: unknown }[] = [];

  const client = {
    from(table: string) {
      return {
        insert(payload: unknown) {
          calls.push({ table, payload });
          if (table === "courses") {
            return {
              select() {
                return { single: async () => ({ data: { id: courseId }, error: null }) };
              },
            };
          }
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  return { client: client as any, calls };
}

const BASE: CourseInput = {
  sessionId: "s1",
  matiere: "histoire",
  niveau: "4e",
  texteOriginal: "brut",
  texteFige: "fige",
  questions: [
    {
      question: "Pourquoi ?",
      reponseAttendue: "Parce que",
      source: "passage",
      sourceStart: 0,
      sourceEnd: 7,
      difficulte: "facile",
      type: "ouverte",
      natureContenu: "notion",
    },
  ],
};

describe("saveCourse", () => {
  it("enregistre le cours puis ses questions liées à son id", async () => {
    const { client, calls } = fakeClient("course-1");
    const id = await saveCourse(client, BASE);

    expect(id).toBe("course-1");
    expect(calls[0].table).toBe("courses");
    expect(calls[1].table).toBe("questions");
    expect((calls[1].payload as any[])[0].course_id).toBe("course-1");
  });

  it("n'insère pas de questions si la liste est vide", async () => {
    const { client, calls } = fakeClient("course-2");
    await saveCourse(client, { ...BASE, questions: [] });

    expect(calls).toHaveLength(1);
  });

  it("lève une erreur si l'enregistrement du cours échoue", async () => {
    const client = {
      from() {
        return {
          insert() {
            return { select: () => ({ single: async () => ({ data: null, error: { message: "boom" } }) }) };
          },
        };
      },
    } as any;

    await expect(saveCourse(client, BASE)).rejects.toThrow("boom");
  });
});
