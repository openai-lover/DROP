import { mkdir } from "node:fs/promises";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

// Scope: actual rendered anonymous/unconfigured product. These tests neither
// fabricate Privy users nor claim that a testnet settlement has been exercised.
const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, context }) => {
  // Existing behavior cases intentionally use Korean. Preserve a user selection
  // across every navigation/reload rather than forcing Korean on each document.
  await context.addInitScript(() => {
    try {
      if (window.localStorage.getItem("drop-language") === null) {
        window.localStorage.setItem("drop-language", "ko");
      }
    } catch { /* Non-origin documents may not expose localStorage. */ }
  });
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
});
test.afterEach(({ page }) => { expect(runtimeErrors.get(page)).toEqual([]); });
const main = (page: Page) => page.getByRole("main");
const next = (page: Page) => main(page).getByRole("button", { name: /^다음/ });
const language = (page: Page) => page.locator("select.language-select");

async function validStory(page: Page) {
  await page.getByLabel("이벤트 제목", { exact: true }).fill("AMA 후 함께 커피 잡기");
  await page.getByLabel("운영자 이름", { exact: true }).fill("QA 운영자");
  await page.getByLabel("공유 주소", { exact: true }).fill("qa-coffee-after-ama");
  await page.getByLabel("참여자에게 전할 설명", { exact: true }).fill("커뮤니티 AMA를 마치고 함께 참여하는 커피 잡기 이벤트입니다.");
}
function localDate(minutes: number) { const value = new Date(Date.now() + minutes * 60_000); return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
async function choosePracticeAnswers(page: Page, correct: boolean) {
  await page.getByLabel(correct ? "보상 없는 게임 체험" : "실제 커피 쿠폰", { exact: true }).check();
  await page.getByLabel(correct ? "서버의 검증으로" : "클라이언트 점수만으로", { exact: true }).check();
  await page.getByLabel(correct ? "없습니다" : "항상 1달러입니다", { exact: true }).check();
}

test("the homepage leads to explicitly unpaid anonymous practice", async ({ page }) => {
  const rewardRequests: string[] = [];
  page.on("request", request => { if (request.method() === "POST" && /\/api\/(sessions|campaigns|creator)/.test(request.url())) rewardRequests.push(request.url()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("좋은 바이브.");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("짜릿한 드롭.");
  await expect(page.getByText("Monad Testnet · 테스트 보상에는 금전적 가치가 없습니다.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: /^플레이 시작/ }).click();
  await expect(page).toHaveURL(/\/practice$/);
  await expect(main(page).getByText("로그인 없는 연습입니다. 실제 보상·자격·지급 기록은 생성되지 않습니다.", { exact: true })).toBeVisible();
  await expect(main(page).getByText("연습 · 보상 없음", { exact: true })).toBeVisible();
  expect(rewardRequests).toEqual([]);
});

test("catching coffee is keyboard accessible and ends without inventing a reward", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium", "Keyboard interaction is checked on the desktop browser.");
  const rewardRequests: string[] = [];
  page.on("request", request => { if (request.method() === "POST" && request.url().includes("/api/")) rewardRequests.push(request.url()); });
  await page.goto("/practice");
  const start = main(page).getByRole("button", { name: /^시작하기/ });
  await start.focus(); await page.keyboard.press("Enter");
  const target = page.getByRole("button", { name: "커피 잡기", exact: true });
  for (let index = 0; index < 12 && !await target.evaluate(element => element === document.activeElement); index++) await page.keyboard.press("Tab");
  await expect(target).toBeFocused();
  for (let index = 1; index <= 3; index++) {
    await page.waitForTimeout(420);
    await page.keyboard.press(index === 2 ? "Space" : "Enter");
    await expect(page.locator(".game-bar strong")).toHaveText(`${index} / 3`);
  }
  await expect(main(page).getByRole("heading", { name: "잡았다! 연습 성공" })).toBeVisible();
  await expect(main(page).getByText("이 연습에서는 보상을 지급하지 않습니다.", { exact: true })).toBeVisible();
  await expect(main(page).getByRole("status")).toContainText("연습 성공");
  expect(rewardRequests).toEqual([]);
  await main(page).getByRole("button", { name: /^다시 연습/ }).click();
  await expect(main(page).getByRole("button", { name: /^시작하기/ })).toBeVisible();
  await expect(page.locator(".game-bar strong")).toHaveText("0 / 3");
});

test("the moving target can be caught by touch without scrolling the play surface", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Touch is checked in the mobile Chromium project.");
  await page.goto("/practice");
  await page.locator(".game-area").scrollIntoViewIfNeeded();
  await main(page).getByRole("button", { name: /^시작하기/ }).tap();
  const target = page.getByRole("button", { name: "커피 잡기", exact: true });
  const startingScroll = await page.evaluate(() => window.scrollY);
  for (let index = 1; index <= 3; index++) {
    await page.waitForTimeout(450);
    const bounds = await target.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    await page.touchscreen.tap(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
    await expect(page.locator(".game-bar strong")).toHaveText(`${index} / 3`);
  }
  await expect(main(page).getByRole("heading", { name: "잡았다! 연습 성공" })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(startingScroll);
});

test("the real 18-second practice timer expires and a fresh attempt can start", async ({ page }) => {
  await page.goto("/practice");
  await main(page).getByRole("button", { name: /^시작하기/ }).click();
  await expect(main(page).getByRole("status")).toContainText("다시 해볼까요", { timeout: 23_000 });
  await expect(page.locator(".game-bar strong")).toHaveText("0 / 3");
  await expect(main(page).getByRole("heading", { name: "잡았다! 연습 성공" })).toHaveCount(0);
  await main(page).getByRole("button", { name: /^다시 연습/ }).click();
  await expect(main(page).getByRole("button", { name: /^시작하기/ })).toBeVisible();
});

test("the practice quiz requires three answers, permits a retry and discloses no payout", async ({ page }) => {
  await page.goto("/practice");
  await main(page).getByRole("button", { name: "나 얼마나 알아?", exact: true }).click();
  const submit = main(page).getByRole("button", { name: "연습 결과 확인", exact: true });
  await expect(submit).toBeDisabled();
  await choosePracticeAnswers(page, false);
  await expect(submit).toBeEnabled(); await submit.click();
  await expect(main(page).getByRole("status")).toContainText("다시 해볼까요");
  await main(page).getByRole("button", { name: /^다시 연습/ }).click();
  await expect(submit).toBeDisabled();
  await choosePracticeAnswers(page, true); await submit.click();
  await expect(main(page).getByRole("status")).toContainText("연습 성공");
  await expect(main(page).getByText("연습 · 보상 없음", { exact: true })).toBeVisible();
  await expect(main(page).getByText("지급 완료", { exact: true })).toHaveCount(0);
});

test("the creator wizard validates its promise and prevents unconfigured creation", async ({ page }) => {
  const creationRequests: string[] = [];
  page.on("request", request => { if (request.method() === "POST" && request.url().endsWith("/api/creator/campaigns")) creationRequests.push(request.url()); });
  await page.goto("/dashboard/new");
  await next(page).click();
  await expect(main(page).getByRole("alert")).toContainText("제목·운영자·설명");
  await validStory(page); await next(page).click();
  await page.getByLabel("선착순 수량", { exact: true }).fill("0"); await next(page).click();
  await expect(main(page).getByRole("alert")).toContainText("1~500");
  await page.getByLabel("선착순 수량", { exact: true }).fill("2");
  await page.getByLabel("1인당 테스트 USDC", { exact: true }).fill("1.0000001"); await next(page).click();
  await expect(main(page).getByRole("alert")).toContainText("테스트 USDC 금액");
  await page.getByLabel("1인당 테스트 USDC", { exact: true }).fill("1.25");
  await expect(main(page).getByText(/필요 예산: 2.5 USDC/)).toBeVisible();
  await next(page).click();
  await page.getByLabel("참여 시작", { exact: true }).fill(localDate(-60)); await next(page).click();
  await expect(main(page).getByRole("alert")).toContainText("시작은 현재보다 1분 이후");
  await page.getByLabel("참여 시작", { exact: true }).fill(localDate(20));
  await page.getByLabel("참여 종료", { exact: true }).fill(localDate(80));
  await page.getByLabel("수령 기한", { exact: true }).fill(localDate(180));
  await expect(main(page).getByText(/정책: 서버 검증 완료 선착순 N명/)).toBeVisible();
  await next(page).click();
  await expect(main(page).getByRole("heading", { name: "AMA 후 함께 커피 잡기", exact: true })).toBeVisible();
  await expect(main(page).getByText("/d/qa-coffee-after-ama", { exact: true })).toBeVisible();
  await expect(main(page).getByText("1.25 USDC × 2", { exact: true })).toBeVisible();
  await expect(main(page).getByText(/이 단계에서는 초안만 생성합니다/)).toBeVisible();
  await expect(main(page).getByRole("button", { name: /^로그인하고 초안 만들기/ })).toBeDisabled();
  await expect(main(page).getByText(/로그인·서버 연결 전에는 실제 캠페인 생성이 비활성화됩니다/)).toBeVisible();
  for (let index = 0; index < 3; index++) await main(page).getByRole("button", { name: /이전$/ }).click();
  await expect(page.getByLabel("이벤트 제목", { exact: true })).toHaveValue("AMA 후 함께 커피 잡기");
  expect(creationRequests).toEqual([]);
});

test("a creator quiz cannot advance until all three custom questions are written", async ({ page }) => {
  await page.goto("/dashboard/new"); await validStory(page);
  await main(page).getByRole("button", { name: "나 얼마나 알아?", exact: true }).click();
  await next(page).click(); await expect(main(page).getByRole("alert")).toContainText("3문제와 각 보기");
  for (let index = 0; index < 3; index++) {
    await page.getByLabel(`문제 ${index + 1}`, { exact: true }).fill(`커뮤니티 문제 ${index + 1}`);
    for (let choice = 0; choice < 3; choice++) await page.getByLabel(`보기 ${choice + 1}`, { exact: true }).nth(index).fill(`보기 내용 ${choice + 1}`);
    await page.getByRole("combobox", { name: "정답", exact: true }).nth(index).selectOption("1");
  }
  await next(page).click(); await expect(page.getByRole("combobox", { name: "보상 종류", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "보상 종류", exact: true }).selectOption("COUPON_DEMO");
  await expect(main(page).getByText(/실제 쿠폰을 구매하거나 자동 발급하지 않습니다/)).toBeVisible();
});

test("English selection persists across navigation and reload", async ({ page }) => {
  await page.goto("/judges");
  // The server renders English before restoring the explicit Korean fixture.
  // Wait for that initialized state before dispatching the user's change.
  await expect(language(page)).toHaveValue("ko");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await language(page).selectOption("en");
  await expect(language(page)).toHaveValue("en");
  await expect(main(page).getByRole("heading", { name: "Experience DROP", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await main(page).getByRole("link", { name: /^Open practice/ }).click();
  await expect(main(page).getByRole("heading", { name: "Try your first drop.", exact: true })).toBeVisible();
  await page.reload(); await expect(main(page).getByText("Practice · No payout", { exact: true })).toBeVisible();
  await language(page).selectOption("ko");
  await expect(main(page).getByRole("heading", { name: "먼저, 한번 즐겨봐요.", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
});

test("English creator validation explains required fields and unsupported images", async ({ page }) => {
  await page.goto("/dashboard/new");
  await expect(language(page)).toHaveValue("ko");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await language(page).selectOption("en");
  await expect(language(page)).toHaveValue("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(main(page).getByRole("heading", { name: "Create a drop", exact: true })).toBeVisible();
  await main(page).getByRole("button", { name: /^Next/ }).click();
  await expect(main(page).getByRole("alert")).toContainText("Check the title, organizer, description");
  expect(await main(page).getByRole("alert").innerText()).not.toMatch(/[가-힣]/);
  await page.getByLabel("Target image (optional)", { exact: true }).setInputFiles({ name: "unsupported.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') });
  await expect(main(page).getByRole("alert")).toContainText("Choose a PNG, JPEG or WEBP image under 200 KB.");
  expect(await main(page).getByRole("alert").innerText()).not.toMatch(/[가-힣]/);
});

test("anonymous rewards never show a fabricated balance or completed payout", async ({ page }) => {
  await page.goto("/me/rewards");
  await expect(main(page).getByRole("heading", { name: "로그인하면 보상이 이어져요.", exact: true })).toBeVisible();
  await expect(main(page).getByRole("button", { name: "로그인", exact: true })).toBeDisabled();
  await expect(main(page).getByText("로그인 연결 설정이 아직 완료되지 않았습니다.", { exact: true })).toBeVisible();
  await expect(main(page).getByText("실제 지갑 잔액", { exact: true })).toHaveCount(0);
  await expect(main(page).getByText("지급 완료", { exact: true })).toHaveCount(0);
  await page.reload(); await expect(main(page).getByRole("button", { name: "로그인", exact: true })).toBeDisabled();
});

test("the judge guide distinguishes configuration from verified integrations", async ({ page, request }) => {
  const response = await request.get("/api/status"); expect(response.status()).toBe(200);
  const { data } = await response.json(); expect(data.authentication).toBe(false); expect(data.demoFallback).toBe(false); expect(data.chainId).toBe(10143);
  await page.goto("/judges");
  await expect(main(page).getByText(/실제 로그인·체인 거래·배포가 검증됐다는 뜻은 아닙니다/)).toBeVisible();
  await expect(main(page).getByText(/테스트 쿠폰은 실제 매장에서 사용할 수 없습니다/)).toBeVisible();
  await expect(main(page).getByRole("row").filter({ hasText: "Privy 로그인·사용자 지갑" })).toContainText("설정 필요");
});

test("private APIs reject anonymous identity spoofing and prohibit coupon caching", async ({ request }) => {
  for (const endpoint of ["/api/rewards", "/api/wallet", "/api/rewards/not-owned/coupon", "/api/rewards/not-owned/proof", "/api/creator/campaigns", "/api/creator/campaigns/not-owned"]) {
    const response = await request.get(endpoint); expect(response.status(), endpoint).toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store"); expect(response.headers()["cache-control"]).toContain("private");
    const value = await response.json(); expect(value.error.code).toBe("UNAUTHENTICATED"); expect(value.data).toBeUndefined();
  }
  for (const endpoint of ["/api/creator/campaigns", "/api/campaigns/not-owned/sessions", "/api/sessions/not-owned/submit", "/api/rewards/not-owned/retry"]) {
    const response = await request.post(endpoint, { data: { userId: "victim", telegramId: "victim", wallet: "0x0000000000000000000000000000000000000001", success: true, score: 999 } });
    expect(response.status(), endpoint).toBe(401); expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
  }
});

test("an unavailable event offers unpaid practice without fabricated event details", async ({ page }) => {
  await page.goto("/d/not-published-qa");
  await expect(main(page).getByRole("alert")).toBeVisible();
  await expect(main(page).getByRole("button", { name: /로그인하고 참여하기/ })).toHaveCount(0);
  await main(page).getByRole("link", { name: /^보상 없는 연습하기/ }).click();
  await expect(page).toHaveURL(/\/practice$/); await expect(main(page).getByText("연습 · 보상 없음", { exact: true })).toBeVisible();
});

for (const width of [360, 390, 768, 1440]) test(`core screens fit a ${width}px viewport`, async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The desktop context checks each explicit CSS width; mobile has a separate touch flow.");
  await page.setViewportSize({ width, height: 900 });
  for (const url of ["/", "/practice", "/dashboard/new", "/me/rewards", "/judges"]) {
    await page.goto(url); await expect(main(page)).toBeVisible();
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document, `${url} at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
    await expect(language(page)).toBeVisible();
    await expect(language(page)).toHaveAccessibleName("언어");
  }
});

test("captures the actual homepage for desktop and mobile review", async ({ page }, testInfo) => {
  await page.goto("/"); await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const folder = path.resolve(".local", "qa"); await mkdir(folder, { recursive: true });
  await page.screenshot({ path: path.join(folder, testInfo.project.name === "mobile-chromium" ? "mobile.png" : "desktop.png"), fullPage: true, animations: "disabled" });
});
