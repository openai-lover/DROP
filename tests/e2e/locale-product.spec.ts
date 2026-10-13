import { mkdir } from "node:fs/promises";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

// This file deliberately has no Korean init script. Every case starts in a
// fresh browser context, so it exercises the real English default and selector.
// Expected consumer copy is explicit; it is not imported from the implementation.
const main = (page: Page) => page.getByRole("main");
const language = (page: Page) => page.locator("select.language-select");
const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
});
test.afterEach(({ page }) => { expect(runtimeErrors.get(page)).toEqual([]); });

const locales = [
  {
    id: "en", selectorLabel: "Language", hero: ["GOOD VIBES.", "GREAT DROPS."], play: "Let’s play",
    practiceTitle: "Try your first drop.", quiz: "Quiz", noPayout: "Practice · No payout",
    questions: ["What does practice mode give you?", "Who verifies a reward attempt?", "Does testnet USDC have monetary value?"],
    correctAnswers: ["A game with no payout", "The server", "No"], submit: "Check practice answers",
    completed: "Practice complete! Join a published event and sign in to qualify for a reward.", back: "Back to DROP",
  },
  {
    id: "ko", selectorLabel: "언어", hero: ["좋은 바이브.", "짜릿한 드롭."], play: "플레이 시작",
    practiceTitle: "먼저, 한번 즐겨봐요.", quiz: "나 얼마나 알아?", noPayout: "연습 · 보상 없음",
    questions: ["DROP에서 연습 모드로 받을 수 있는 것은?", "보상 참여 결과는 어디에서 확인하나요?", "테스트넷 USDC에는 금전적 가치가 있나요?"],
    correctAnswers: ["보상 없는 게임 체험", "서버의 검증으로", "없습니다"], submit: "연습 결과 확인",
    completed: "연습 성공! 실제 이벤트에서 로그인 후 보상 참여를 할 수 있어요.", back: "DROP으로 돌아가기",
  },
  {
    id: "ja", selectorLabel: "言語", hero: ["いい雰囲気。", "最高のDROP。"], play: "遊ぼう",
    practiceTitle: "初めてのDROPを体験しよう。", quiz: "クイズ", noPayout: "練習 · 報酬なし",
    questions: ["練習モードで得られるものは？", "報酬への挑戦を確認するのは？", "テストネットUSDCに金銭的な価値はありますか？"],
    correctAnswers: ["報酬なしのゲーム体験", "サーバー", "ありません"], submit: "練習の回答を確認",
    completed: "練習クリア！公開イベントに参加し、ログインして報酬に挑戦しましょう。", back: "DROPに戻る",
  },
  {
    id: "zh-CN", selectorLabel: "语言", hero: ["好氛围。", "精彩DROP。"], play: "开始玩吧",
    practiceTitle: "体验你的第一个DROP。", quiz: "知识问答", noPayout: "练习 · 无奖励",
    questions: ["练习模式会给你什么？", "谁来验证奖励挑战？", "测试网USDC有货币价值吗？"],
    correctAnswers: ["无奖励的游戏体验", "服务器", "没有"], submit: "查看练习答案",
    completed: "练习完成！加入已发布的活动并登录，即可挑战奖励。", back: "返回DROP",
  },
  {
    id: "es", selectorLabel: "Idioma", hero: ["BUENA ONDA.", "GRANDES DROPS."], play: "Vamos a jugar",
    practiceTitle: "Prueba tu primer DROP.", quiz: "Cuestionario", noPayout: "Práctica · Sin recompensa",
    questions: ["¿Qué ofrece el modo de práctica?", "¿Quién verifica un intento con recompensa?", "¿Tiene valor monetario el USDC de prueba?"],
    correctAnswers: ["Un juego sin recompensa", "El servidor", "No"], submit: "Comprobar respuestas",
    completed: "¡Práctica completada! Inicia sesión y participa en un evento publicado para optar a una recompensa.", back: "Volver a DROP",
  },
] as const;

test("a fresh visitor starts in English with all five explicit language choices", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(language(page)).toHaveValue("en");
  await expect(language(page)).toHaveAccessibleName("Language");
  await expect(language(page).locator("option")).toHaveText(["English", "한국어", "日本語", "简体中文", "Español"]);
  expect(await language(page).locator("option").evaluateAll(options => options.map(option => (option as HTMLOptionElement).value)))
    .toEqual(["en", "ko", "ja", "zh-CN", "es"]);
  await expect(main(page).getByRole("heading", { level: 1 })).toContainText("GOOD VIBES.");
  await expect(main(page).getByRole("heading", { level: 1 })).toContainText("GREAT DROPS.");
  await expect(main(page).getByRole("link", { name: /^Let’s play/ })).toBeVisible();
  const disclosure = main(page).locator(".hero-footnote");
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toContainText("No signup to try · Practice has no payout");
  await expect(page.locator(".header").getByRole("button", { name: "Sign in", exact: true })).toBeDisabled();
});

for (const locale of locales) test(`${locale.id} translates the actual home and quiz and persists across navigation/reload`, async ({ page }) => {
  const writeRequests: string[] = [];
  page.on("request", request => { if (request.method() === "POST" && request.url().includes("/api/")) writeRequests.push(request.url()); });
  await page.goto("/");
  await language(page).selectOption(locale.id);
  await expect(language(page)).toHaveValue(locale.id);
  await expect(language(page)).toHaveAccessibleName(locale.selectorLabel);
  await expect(page.locator("html")).toHaveAttribute("lang", locale.id);
  for (const phrase of locale.hero) await expect(main(page).getByRole("heading", { level: 1 })).toContainText(phrase);
  await main(page).getByRole("link", { name: locale.play, exact: true }).click();
  await expect(page).toHaveURL(/\/practice$/);
  await expect(language(page)).toHaveValue(locale.id);
  await expect(main(page).getByRole("heading", { level: 1 })).toHaveText(locale.practiceTitle);
  await page.reload();
  await expect(language(page)).toHaveValue(locale.id);
  await expect(page.locator("html")).toHaveAttribute("lang", locale.id);
  await main(page).getByRole("button", { name: locale.quiz, exact: true }).click();
  await expect(main(page).locator(".quiz fieldset")).toHaveCount(3);
  for (const [index, question] of locale.questions.entries()) {
    await expect(main(page).getByRole("group", { name: `${index + 1}. ${question}`, exact: true })).toBeVisible();
  }
  await expect(main(page).getByText(locale.noPayout, { exact: true })).toBeVisible();
  const submit = main(page).getByRole("button", { name: locale.submit, exact: true });
  await expect(submit).toBeDisabled();
  for (const answer of locale.correctAnswers) await main(page).getByRole("radio", { name: answer, exact: true }).check();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(main(page).getByRole("status")).toContainText(locale.completed);
  expect(writeRequests).toEqual([]);
  await main(page).getByRole("link", { name: `← ${locale.back}`, exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await expect(language(page)).toHaveValue(locale.id);
  await expect(language(page)).toHaveAccessibleName(locale.selectorLabel);
  for (const phrase of locale.hero) await expect(main(page).getByRole("heading", { level: 1 })).toContainText(phrase);
  await main(page).locator("a.quiz-card").click();
  await expect(page).toHaveURL(/\/practice\?game=quiz$/);
  await expect(main(page).getByRole("button", { name: locale.quiz, exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(main(page).locator(".quiz fieldset")).toHaveCount(3);
  await page.reload();
  await expect(language(page)).toHaveValue(locale.id);
  await expect(main(page).getByRole("button", { name: locale.quiz, exact: true })).toHaveAttribute("aria-pressed", "true");
  for (const [index, question] of locale.questions.entries()) {
    await expect(main(page).getByRole("group", { name: `${index + 1}. ${question}`, exact: true })).toBeVisible();
  }
});

for (const width of [360, 390]) test(`all five languages fit home and the quiz at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  for (const locale of locales) {
    await page.goto("/");
    await language(page).selectOption(locale.id);
    for (const route of ["/", "/practice?game=quiz"]) {
      await page.goto(route);
      await expect(language(page)).toHaveValue(locale.id);
      await expect(language(page)).toHaveAccessibleName(locale.selectorLabel);
      await expect(page.locator("html")).toHaveAttribute("lang", locale.id);
      if (route === "/") {
        for (const phrase of locale.hero) await expect(main(page).getByRole("heading", { level: 1 })).toContainText(phrase);
      } else {
        await expect(main(page).getByRole("group", { name: `1. ${locale.questions[0]}`, exact: true })).toBeVisible();
      }
      await page.evaluate(() => document.fonts.ready);
      const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
      expect(dimensions.document, `${locale.id} ${route} at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
      await expect(language(page)).toBeVisible();
      const selectorBox = await language(page).boundingBox();
      expect(selectorBox).not.toBeNull();
      expect(selectorBox!.x).toBeGreaterThanOrEqual(0);
      expect(selectorBox!.x + selectorBox!.width).toBeLessThanOrEqual(dimensions.viewport + 1);
    }
  }
});

test("the Monad assets load before capturing the English desktop and mobile homepage", async ({ page }, testInfo) => {
  // A continuously floating mascot cannot satisfy Playwright's stable-element
  // scroll check. Use the supported reduced-motion UI for deterministic capture.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(language(page)).toHaveValue("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  // The header logo is intentionally hidden below 900px. The footer brand,
  // stage logo and mascot are the visible assets shared by both profiles.
  const images = [page.locator(".footer-monad img"), main(page).locator(".stage-coin img"), main(page).getByRole("img", { name: "Molandak", exact: true })];
  for (const image of images) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(element => {
      const img = element as HTMLImageElement;
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    })).toBe(true);
  }
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  const folder = path.resolve(".local", "qa");
  await mkdir(folder, { recursive: true });
  await page.screenshot({ path: path.join(folder, testInfo.project.name === "mobile-chromium" ? "monad-hero-mobile.png" : "monad-hero-desktop.png"), animations: "disabled" });
  await page.screenshot({ path: path.join(folder, testInfo.project.name === "mobile-chromium" ? "monad-mobile.png" : "monad-desktop.png"), fullPage: true, animations: "disabled" });
});
