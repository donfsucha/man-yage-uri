import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  AnalyticsEventName,
  ChoiceId,
  MockPayment,
  NextChoice,
  PreviewStory,
  StoryChapter,
  StoryEvent,
  StoredPreviewStory,
  StoryInput,
  StoryScene,
  StoryStatus
} from "./schema";
import { getChapterChoices } from "./story-choices";

type StoryInputRow = {
  id: string;
  breakup_moment: string;
  breakup_reason: string;
  alternative_choice: string;
  emotion: StoryInput["emotion"];
  desired_ending: StoryInput["desiredEnding"];
  protagonist_alias: string;
  partner_alias: string;
  raw_input?: Partial<StoryInput> | null;
  sanitized_input?: Partial<StoryInput> | null;
};

type StoryRow = {
  id: string;
  input_id: string;
  title: string;
  genre: string;
  summary: string;
  tone: string;
  status: StoryStatus;
  is_paid: boolean;
  selected_choice_id: ChoiceId | null;
  created_at: string;
  updated_at: string;
};

type ChapterRow = {
  chapter_no: number;
  title: string;
  body: string;
  ending_hook: string;
};

type SceneRow = {
  scene_no: number;
  title: string;
  setting: string;
  body: string;
  dialogue: string;
  visual_prompt: string;
  emotion: string;
};

type ChoiceRow = {
  chapter_no: number;
  choice_id: ChoiceId;
  label: string;
  is_selected: boolean;
};

type PaymentRow = {
  product_type: "five_episode_complete";
  amount: number;
  order_id: string;
  status: MockPayment["status"];
  created_at: string;
  updated_at: string;
};

type AnalyticsEventRow = {
  id: string;
  event_name: AnalyticsEventName;
  story_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type SupabaseError = { message?: string } | null | undefined;
type SupabaseResult = { data: unknown; error: SupabaseError };

function isMissingStoryScenesTableError(error: SupabaseError) {
  const message = error?.message ?? "";

  return (
    message.includes("story_scenes") &&
    (message.includes("schema cache") ||
      message.includes("Could not find the table") ||
      message.includes("relation") ||
      message.includes("does not exist"))
  );
}

function isMissingStoryChoiceChapterNoError(error: SupabaseError) {
  const message = error?.message ?? "";

  return (
    message.includes("story_choices") &&
    message.includes("chapter_no") &&
    (message.includes("schema cache") ||
      message.includes("column") ||
      message.includes("does not exist"))
  );
}

function toStoryInput(row: StoryInputRow): StoryInput {
  const savedInput = row.sanitized_input ?? row.raw_input ?? {};

  return {
    breakupMoment: row.breakup_moment,
    breakupReason: row.breakup_reason,
    alternativeChoice: row.alternative_choice,
    lastScenePlace:
      typeof savedInput.lastScenePlace === "string"
        ? savedInput.lastScenePlace
        : row.breakup_moment,
    rememberedDetail:
      typeof savedInput.rememberedDetail === "string"
        ? savedInput.rememberedDetail
        : "그날의 공기와 표정",
    partnerBehavior:
      typeof savedInput.partnerBehavior === "string"
        ? savedInput.partnerBehavior
        : "대답보다 침묵이 먼저 길어지는 편",
    emotion: row.emotion,
    desiredEnding: row.desired_ending,
    protagonistAlias: row.protagonist_alias,
    partnerAlias: row.partner_alias,
    agreedToFictionNotice: true,
    agreedToPrivacyNotice: true
  };
}

function toChapter(
  row: ChapterRow,
  selectedChoiceId: ChoiceId | null,
  choicesByChapterNo: Map<number, NextChoice[]>
): StoryChapter {
  const storedChoices = choicesByChapterNo.get(row.chapter_no) ?? [];
  const nextChoices =
    storedChoices.length > 0
      ? storedChoices
      : getChapterChoices(selectedChoiceId, row.chapter_no);

  return {
    chapter_no: row.chapter_no,
    chapter_title: row.title,
    body: row.body,
    ending_hook: row.ending_hook,
    ...(nextChoices.length > 0 ? { next_choices: nextChoices } : {})
  };
}

function toScene(row: SceneRow): StoryScene {
  return {
    scene_no: row.scene_no,
    scene_title: row.title,
    setting: row.setting,
    body: row.body,
    dialogue: row.dialogue,
    visual_prompt: row.visual_prompt,
    emotion: row.emotion
  };
}

function toChoice(row: ChoiceRow): NextChoice {
  return {
    choice_id: row.choice_id,
    label: row.label
  };
}

function groupChoicesByChapterNo(rows: ChoiceRow[]) {
  const choicesByChapterNo = new Map<number, NextChoice[]>();

  for (const row of rows) {
    const choices = choicesByChapterNo.get(row.chapter_no) ?? [];
    choices.push(toChoice(row));
    choicesByChapterNo.set(row.chapter_no, choices);
  }

  return choicesByChapterNo;
}

function toPayment(row: PaymentRow | null): MockPayment | null {
  if (!row) {
    return null;
  }

  return {
    productType: row.product_type,
    amount: row.amount,
    orderId: row.order_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toStoryEvent(row: AnalyticsEventRow): StoryEvent {
  return {
    id: row.id,
    eventName: row.event_name,
    storyId: row.story_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at
  };
}

async function hydrateStory(row: StoryRow): Promise<StoredPreviewStory | null> {
  const supabase = createSupabaseServiceClient();
  const [
    inputResult,
    chapterResult,
    sceneResult,
    initialChoiceResult,
    paymentResult
  ] =
    await Promise.all([
    supabase.from("story_inputs").select("*").eq("id", row.input_id).single(),
    supabase
      .from("story_chapters")
      .select("chapter_no,title,body,ending_hook")
      .eq("story_id", row.id)
      .order("chapter_no", { ascending: true }),
    supabase
      .from("story_scenes")
      .select("scene_no,title,setting,body,dialogue,visual_prompt,emotion")
      .eq("story_id", row.id)
      .order("scene_no", { ascending: true }),
    supabase
      .from("story_choices")
      .select("chapter_no,choice_id,label,is_selected")
      .eq("story_id", row.id)
      .order("chapter_no", { ascending: true })
      .order("choice_id", { ascending: true }),
    supabase
      .from("payments")
      .select("product_type,amount,order_id,status,created_at,updated_at")
      .eq("story_id", row.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const sceneTableMissing = isMissingStoryScenesTableError(sceneResult.error);
  let choiceResult: SupabaseResult = initialChoiceResult;
  const choiceChapterNoMissing = isMissingStoryChoiceChapterNoError(choiceResult.error);

  if (choiceChapterNoMissing) {
    choiceResult = await supabase
      .from("story_choices")
      .select("choice_id,label,is_selected")
      .eq("story_id", row.id)
      .order("choice_id", { ascending: true });

    if (!choiceResult.error && Array.isArray(choiceResult.data)) {
      choiceResult = {
        ...choiceResult,
        data: choiceResult.data.map((choice) => ({
          ...(choice as ChoiceRow),
          chapter_no: 1
        }))
      };
    }
  }

  if (
    inputResult.error ||
    chapterResult.error ||
    (sceneResult.error && !sceneTableMissing) ||
    choiceResult.error
  ) {
    throw new Error(
      inputResult.error?.message ??
        chapterResult.error?.message ??
        (!sceneTableMissing ? sceneResult.error?.message : undefined) ??
        choiceResult.error?.message
    );
  }

  if (
    !inputResult.data ||
    !chapterResult.data ||
    (!sceneTableMissing && !sceneResult.data) ||
    !choiceResult.data
  ) {
    return null;
  }

  const input = toStoryInput(inputResult.data as StoryInputRow);
  const choicesByChapterNo = groupChoicesByChapterNo(choiceResult.data as ChoiceRow[]);
  const choices = choicesByChapterNo.get(1) ?? [];
  const chapters = (chapterResult.data as ChapterRow[]).map((chapter) =>
    toChapter(chapter, row.selected_choice_id, choicesByChapterNo)
  );
  const scenes = sceneTableMissing ? [] : (sceneResult.data as SceneRow[]).map(toScene);
  const status =
    row.is_paid && chapters.some((chapter) => chapter.chapter_no === 5)
      ? "completed"
      : row.status;
  const previewStory: PreviewStory = {
    title: row.title,
    genre: row.genre,
    emotional_tone: row.tone,
    summary: row.summary,
    chapters,
    scenes,
    next_choices: choices,
    safety_flags: {
      contains_self_harm_risk: false,
      contains_stalking_risk: false,
      requires_manual_review: false
    }
  };

  return {
    id: row.id,
    input,
    story: previewStory,
    status,
    selectedChoiceId: row.selected_choice_id,
    payment: toPayment((paymentResult.data as PaymentRow | null) ?? null),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function savePreviewStoryToSupabase(
  input: StoryInput,
  story: PreviewStory
) {
  const supabase = createSupabaseServiceClient();
  const inputResult = await supabase
    .from("story_inputs")
    .insert({
      breakup_moment: input.breakupMoment,
      breakup_reason: input.breakupReason,
      alternative_choice: input.alternativeChoice,
      emotion: input.emotion,
      desired_ending: input.desiredEnding,
      protagonist_alias: input.protagonistAlias,
      partner_alias: input.partnerAlias,
      raw_input: input,
      sanitized_input: input,
      status: "preview_ready"
    })
    .select("id")
    .single();

  if (inputResult.error) {
    throw new Error(inputResult.error.message);
  }

  const storyResult = await supabase
    .from("stories")
    .insert({
      input_id: inputResult.data.id,
      title: story.title,
      genre: story.genre,
      summary: story.summary,
      tone: story.emotional_tone,
      status: "preview_ready"
    })
    .select("*")
    .single();

  if (storyResult.error) {
    throw new Error(storyResult.error.message);
  }

  const chapterRows = story.chapters.map((chapter) => ({
    story_id: storyResult.data.id,
    chapter_no: chapter.chapter_no,
    title: chapter.chapter_title,
    body: chapter.body,
    ending_hook: chapter.ending_hook,
    is_free: chapter.chapter_no === 1
  }));
  const choiceRows = story.next_choices.map((choice) => ({
    story_id: storyResult.data.id,
    chapter_no: 1,
    choice_id: choice.choice_id,
    label: choice.label
  }));
  const sceneRows = story.scenes.map((scene) => ({
    story_id: storyResult.data.id,
    scene_no: scene.scene_no,
    title: scene.scene_title,
    setting: scene.setting,
    body: scene.body,
    dialogue: scene.dialogue,
    visual_prompt: scene.visual_prompt,
    emotion: scene.emotion
  }));
  const [chapterResult, sceneResult, initialChoiceResult] = await Promise.all([
    supabase.from("story_chapters").insert(chapterRows),
    supabase.from("story_scenes").insert(sceneRows),
    supabase.from("story_choices").insert(choiceRows)
  ]);
  let choiceResult = initialChoiceResult;
  const choiceChapterNoMissing = isMissingStoryChoiceChapterNoError(choiceResult.error);

  if (choiceChapterNoMissing) {
    const legacyChoiceRows = story.next_choices.map((choice) => ({
      story_id: storyResult.data.id,
      choice_id: choice.choice_id,
      label: choice.label
    }));
    choiceResult = await supabase.from("story_choices").insert(legacyChoiceRows);
  }

  const sceneTableMissing = isMissingStoryScenesTableError(sceneResult.error);
  const finalChoiceChapterNoMissing = isMissingStoryChoiceChapterNoError(
    choiceResult.error
  );

  if (
    chapterResult.error ||
    (sceneResult.error && !sceneTableMissing) ||
    (choiceResult.error && !finalChoiceChapterNoMissing)
  ) {
    throw new Error(
      chapterResult.error?.message ??
        (!sceneTableMissing ? sceneResult.error?.message : undefined) ??
        (!finalChoiceChapterNoMissing ? choiceResult.error?.message : undefined)
    );
  }

  return hydrateStory(storyResult.data as StoryRow);
}

export async function getStoryFromSupabase(id: string) {
  const supabase = createSupabaseServiceClient();
  const result = await supabase.from("stories").select("*").eq("id", id).maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (!result.data) {
    return null;
  }

  return hydrateStory(result.data as StoryRow);
}

export async function listStoriesFromSupabase() {
  const supabase = createSupabaseServiceClient();
  const result = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return Promise.all((result.data as StoryRow[]).map(hydrateStory)).then((stories) =>
    stories.filter((story): story is StoredPreviewStory => Boolean(story))
  );
}

export async function selectStoryChoiceInSupabase(storyId: string, choiceId: string) {
  const existing = await getStoryFromSupabase(storyId);

  if (
    !existing ||
    !existing.story.next_choices.some((choice) => choice.choice_id === choiceId)
  ) {
    return null;
  }

  if (existing.status === "completed" || existing.payment?.status === "paid") {
    return existing;
  }

  const supabase = createSupabaseServiceClient();
  const [storyResult, initialResetResult, initialSelectedResult] = await Promise.all([
    supabase
      .from("stories")
      .update({
        status: "choice_selected",
        selected_choice_id: choiceId,
        updated_at: new Date().toISOString()
      })
      .eq("id", storyId),
    supabase
      .from("story_choices")
      .update({ is_selected: false })
      .eq("story_id", storyId)
      .eq("chapter_no", 1),
    supabase
      .from("story_choices")
      .update({ is_selected: true })
      .eq("story_id", storyId)
      .eq("chapter_no", 1)
      .eq("choice_id", choiceId)
  ]);
  let resetResult = initialResetResult;
  let selectedResult = initialSelectedResult;

  if (
    isMissingStoryChoiceChapterNoError(resetResult.error) ||
    isMissingStoryChoiceChapterNoError(selectedResult.error)
  ) {
    [resetResult, selectedResult] = await Promise.all([
      supabase
        .from("story_choices")
        .update({ is_selected: false })
        .eq("story_id", storyId),
      supabase
        .from("story_choices")
        .update({ is_selected: true })
        .eq("story_id", storyId)
        .eq("choice_id", choiceId)
    ]);
  }

  if (storyResult.error || resetResult.error || selectedResult.error) {
    throw new Error(
      storyResult.error?.message ??
        resetResult.error?.message ??
        selectedResult.error?.message
    );
  }

  return getStoryFromSupabase(storyId);
}

export async function createPaymentInSupabase(
  storyId: string,
  amount = 7900,
  orderId = `order_${storyId}`
) {
  const story = await getStoryFromSupabase(storyId);

  if (story?.status === "completed" || story?.payment?.status === "paid") {
    return story;
  }

  if (!story || story.status !== "choice_selected" || !story.selectedChoiceId) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const existingPayment = await supabase
    .from("payments")
    .select("status")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPayment.error) {
    throw new Error(existingPayment.error.message);
  }

  if (existingPayment.data) {
    if (existingPayment.data.status === "pending") {
      const updateResult = await supabase
        .from("stories")
        .update({ status: "payment_pending", updated_at: new Date().toISOString() })
        .eq("id", storyId);

      if (updateResult.error) {
        throw new Error(updateResult.error.message);
      }
    }

    return getStoryFromSupabase(storyId);
  }

  const result = await supabase.from("payments").insert({
    story_id: storyId,
    product_type: "five_episode_complete",
    amount,
    order_id: orderId,
    status: "pending"
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const updateResult = await supabase
    .from("stories")
    .update({ status: "payment_pending", updated_at: new Date().toISOString() })
    .eq("id", storyId);

  if (updateResult.error) {
    throw new Error(updateResult.error.message);
  }

  return getStoryFromSupabase(storyId);
}

export async function completePaymentInSupabase(
  storyId: string,
  chapters: StoryChapter[]
) {
  const supabase = createSupabaseServiceClient();
  const chapterRows = chapters.map((chapter) => ({
    story_id: storyId,
    chapter_no: chapter.chapter_no,
    title: chapter.chapter_title,
    body: chapter.body,
    ending_hook: chapter.ending_hook,
    is_free: false
  }));
  const choiceRows = chapters.flatMap((chapter) =>
    (chapter.next_choices ?? []).map((choice) => ({
      story_id: storyId,
      chapter_no: chapter.chapter_no,
      choice_id: choice.choice_id,
      label: choice.label,
      is_selected: false
    }))
  );
  const chapterResult = await supabase
    .from("story_chapters")
    .upsert(chapterRows, { onConflict: "story_id,chapter_no" });

  if (chapterResult.error) {
    throw new Error(chapterResult.error.message);
  }

  const now = new Date().toISOString();
  const [choiceResult, paymentResult, storyResult] = await Promise.all([
    choiceRows.length > 0
      ? supabase
          .from("story_choices")
          .upsert(choiceRows, { onConflict: "story_id,chapter_no,choice_id" })
      : Promise.resolve({ error: null }),
    supabase
      .from("payments")
      .update({ status: "paid", updated_at: now })
      .eq("story_id", storyId)
      .eq("status", "pending"),
    supabase
      .from("stories")
      .update({
        status: "completed",
        is_paid: true,
        updated_at: now
      })
      .eq("id", storyId)
  ]);

  const choiceChapterNoMissing = isMissingStoryChoiceChapterNoError(choiceResult.error);

  if (
    (choiceResult.error && !choiceChapterNoMissing) ||
    paymentResult.error ||
    storyResult.error
  ) {
    throw new Error(
      (!choiceChapterNoMissing ? choiceResult.error?.message : undefined) ??
        paymentResult.error?.message ??
        storyResult.error?.message
    );
  }

  return getStoryFromSupabase(storyId);
}

export async function deleteStoryFromSupabase(storyId: string) {
  const supabase = createSupabaseServiceClient();
  const result = await supabase.from("stories").delete().eq("id", storyId);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return true;
}

export async function recordAnalyticsEventToSupabase({
  eventName,
  storyId = null,
  metadata = {}
}: {
  eventName: AnalyticsEventName;
  storyId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceClient();
  const result = await supabase
    .from("analytics_events")
    .insert({
      event_name: eventName,
      story_id: storyId,
      metadata
    })
    .select("id,event_name,story_id,metadata,created_at")
    .single();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return toStoryEvent(result.data as AnalyticsEventRow);
}

export async function listAnalyticsEventsFromSupabase(storyId?: string) {
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from("analytics_events")
    .select("id,event_name,story_id,metadata,created_at")
    .order("created_at", { ascending: false });

  if (storyId) {
    query = query.eq("story_id", storyId);
  }

  const result = await query;

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data as AnalyticsEventRow[]).map(toStoryEvent);
}
