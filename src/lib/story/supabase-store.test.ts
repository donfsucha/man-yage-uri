import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StoryChapter } from "./schema";

type Row = Record<string, unknown>;
type Database = Record<string, Row[]>;
type FakeError = { message: string };

const db: Database = {
  story_inputs: [],
  stories: [],
  story_chapters: [],
  story_scenes: [],
  story_choices: [],
  payments: []
};
const tableErrors = new Map<string, FakeError[]>();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceClient: () => createFakeSupabaseClient()
}));

function seedCompletedPaymentStory() {
  db.story_inputs = [
    {
      id: "input-1",
      breakup_moment: "마지막 통화",
      breakup_reason: "서로의 오해",
      alternative_choice: "미안하다는 말을 먼저 꺼내고 싶었어.",
      emotion: "regret",
      desired_ending: "growth",
      protagonist_alias: "하린",
      partner_alias: "그 사람",
      sanitized_input: {
        lastScenePlace: "비 오는 정류장",
        rememberedDetail: "젖은 운동화 끈",
        partnerBehavior: "침묵이 먼저 길어지는 편"
      }
    }
  ];
  db.stories = [
    {
      id: "story-1",
      input_id: "input-1",
      title: "다시 열린 장면",
      genre: "성장",
      summary: "서로의 오해를 다시 바라보는 이야기",
      tone: "차분한 긴장",
      status: "payment_pending",
      is_paid: false,
      selected_choice_id: "A",
      created_at: "2026-05-22T00:00:00.000Z",
      updated_at: "2026-05-22T00:00:00.000Z"
    }
  ];
  db.story_chapters = [
    {
      story_id: "story-1",
      chapter_no: 1,
      title: "다시 열린 장면",
      body: "1화 본문",
      ending_hook: "첫 번째 선택을 부르는 문장"
    }
  ];
  db.story_scenes = [
    {
      story_id: "story-1",
      scene_no: 1,
      title: "정류장",
      setting: "비 오는 정류장",
      body: "장면 본문",
      dialogue: "이번에는 말할게",
      visual_prompt: "Korean emotional web novel scene",
      emotion: "후회"
    }
  ];
  db.story_choices = [
    {
      story_id: "story-1",
      chapter_no: 1,
      choice_id: "A",
      label: "오해를 하나씩 풀어본다",
      is_selected: true
    },
    {
      story_id: "story-1",
      chapter_no: 1,
      choice_id: "B",
      label: "마지막 하루를 함께 보낸다",
      is_selected: false
    },
    {
      story_id: "story-1",
      chapter_no: 1,
      choice_id: "C",
      label: "각자의 진심을 편지로 남긴다",
      is_selected: false
    }
  ];
  db.payments = [
    {
      story_id: "story-1",
      product_type: "five_episode_complete",
      amount: 7900,
      order_id: "order-story-1",
      status: "pending",
      created_at: "2026-05-22T00:00:00.000Z",
      updated_at: "2026-05-22T00:00:00.000Z"
    }
  ];
}

function createFakeSupabaseClient() {
  return {
    from(table: string) {
      return new FakeQuery(table);
    }
  };
}

class FakeQuery implements PromiseLike<{ data: unknown; error: FakeError | null }> {
  private filters: Array<[string, unknown]> = [];
  private operation: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private singleMode: "single" | "maybeSingle" | null = null;
  private orderBy: string[] = [];
  private limitCount: number | null = null;
  private conflictColumns: string[] = [];

  constructor(private readonly table: string) {}

  select() {
    this.operation = "select";
    return this;
  }

  insert(payload: Row | Row[]) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Row) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: Row | Row[], options?: { onConflict?: string }) {
    this.operation = "upsert";
    this.payload = payload;
    this.conflictColumns = options?.onConflict?.split(",") ?? [];
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  order(column: string) {
    this.orderBy.push(column);
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleMode = "single";
    return this.execute();
  }

  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this.execute();
  }

  then<TResult1 = { data: unknown; error: FakeError | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: FakeError | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    const tableRows = db[this.table];

    if (!tableRows) {
      throw new Error(`Unknown fake table ${this.table}`);
    }

    const queuedErrors = tableErrors.get(this.table);
    const tableError = queuedErrors?.shift();

    if (tableError) {
      if (queuedErrors?.length === 0) {
        tableErrors.delete(this.table);
      }

      return { data: null, error: tableError };
    }

    if (this.operation === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      tableRows.push(...rows);
      return this.formatResult(rows);
    }

    if (this.operation === "upsert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload as Row];

      for (const row of rows) {
        const existingIndex = tableRows.findIndex((candidate) =>
          this.conflictColumns.every((column) => candidate[column] === row[column])
        );

        if (existingIndex >= 0) {
          tableRows[existingIndex] = { ...tableRows[existingIndex], ...row };
        } else {
          tableRows.push(row);
        }
      }

      return this.formatResult(rows);
    }

    if (this.operation === "update") {
      const matches = this.filteredRows();

      for (const row of matches) {
        Object.assign(row, this.payload);
      }

      return this.formatResult(matches);
    }

    if (this.operation === "delete") {
      const kept = tableRows.filter((row) => !this.matches(row));
      db[this.table] = kept;
      return this.formatResult([]);
    }

    return this.formatResult(this.filteredRows());
  }

  private filteredRows() {
    let rows = db[this.table].filter((row) => this.matches(row));

    for (const column of this.orderBy) {
      rows = [...rows].sort((a, b) =>
        String(a[column] ?? "").localeCompare(String(b[column] ?? ""))
      );
    }

    if (typeof this.limitCount === "number") {
      rows = rows.slice(0, this.limitCount);
    }

    return rows;
  }

  private matches(row: Row) {
    return this.filters.every(([column, value]) => row[column] === value);
  }

  private formatResult(rows: Row[]) {
    const data =
      this.singleMode === "single" || this.singleMode === "maybeSingle"
        ? rows[0] ?? null
        : rows;

    return Promise.resolve({ data, error: null });
  }
}

describe("supabase story store", () => {
  beforeEach(() => {
    tableErrors.clear();
    seedCompletedPaymentStory();
  });

  it("hydrates stories when the story_scenes table is not available yet", async () => {
    tableErrors.set("story_scenes", [
      {
        message: "Could not find the table 'public.story_scenes' in the schema cache"
      }
    ]);

    const { getStoryFromSupabase } = await import("./supabase-store");

    const story = await getStoryFromSupabase("story-1");

    expect(story?.story.scenes).toEqual([]);
    expect(story?.story.chapters).toHaveLength(1);
  });

  it("hydrates stories from legacy choices when chapter_no is not available yet", async () => {
    tableErrors.set("story_scenes", [
      {
        message: "Could not find the table 'public.story_scenes' in the schema cache"
      }
    ]);
    tableErrors.set("story_choices", [
      {
        message: "column story_choices.chapter_no does not exist"
      }
    ]);

    const { getStoryFromSupabase } = await import("./supabase-store");

    const story = await getStoryFromSupabase("story-1");

    expect(story?.story.next_choices.map((choice) => choice.choice_id)).toEqual([
      "A",
      "B",
      "C"
    ]);
    expect(story?.story.chapters[0].next_choices?.map((choice) => choice.choice_id)).toEqual([
      "A",
      "B",
      "C"
    ]);
  });

  it("hydrates paid chapter choices from saved Supabase rows", async () => {
    const { completePaymentInSupabase } = await import("./supabase-store");
    const paidChapters: StoryChapter[] = [
      {
        chapter_no: 2,
        chapter_title: "오해의 사실들",
        body: "2화 본문",
        ending_hook: "두 번째 선택을 부르는 문장",
        next_choices: [
          { choice_id: "A", label: "영수증 시간을 다시 맞춰본다" },
          { choice_id: "B", label: "말하지 못한 이름을 꺼낸다" },
          { choice_id: "C", label: "서로의 침묵을 나란히 적는다" }
        ]
      },
      {
        chapter_no: 3,
        chapter_title: "비밀의 모서리",
        body: "3화 본문",
        ending_hook: "세 번째 선택을 부르는 문장"
      },
      {
        chapter_no: 4,
        chapter_title: "사과의 순서",
        body: "4화 본문",
        ending_hook: "네 번째 선택을 부르는 문장"
      },
      {
        chapter_no: 5,
        chapter_title: "정확히 기억하는 법",
        body: "5화 본문",
        ending_hook: "마지막 문장"
      }
    ];

    const completed = await completePaymentInSupabase("story-1", paidChapters);

    expect(completed?.story.chapters[1].next_choices?.map((choice) => choice.label)).toEqual([
      "영수증 시간을 다시 맞춰본다",
      "말하지 못한 이름을 꺼낸다",
      "서로의 침묵을 나란히 적는다"
    ]);
    expect(
      db.story_choices.filter((choice) => choice.chapter_no === 2)
    ).toHaveLength(3);
  });
});
