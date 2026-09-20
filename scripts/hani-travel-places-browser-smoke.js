const { chromium } = require("playwright");

const baseUrl = process.env.HANI_QA_URL || "http://127.0.0.1:8773/";
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.HANI_BROWSER_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("dialog", dialog => dialog.accept());
  await page.route("https://cdn.jsdelivr.net/**", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};"
  }));

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof renderTravel === "function" && typeof unlockLoginGate === "function");
  await page.evaluate(() => {
    state = freshState();
    state.travelTrips = [normalizeTravelTrip({
      id: "qa-trip",
      name: "QA 부산 여행",
      destination: "부산",
      startDate: "2026-09-01",
      endDate: "2026-09-03",
      reviews: [normalizeTravelReview({
        id: "qa-legacy",
        type: "관광/장소",
        name: "기존 해변 기록",
        visitDate: "2026-09-02",
        location: "부산 해운대",
        rating: 4,
        review: "기존 여행 후기도 통합 목록에서 보여야 함"
      })]
    })];
    state.ui.travelTab = "archive";
    unlockLoginGate();
    showView("travel");
    renderAll();
  });

  await page.locator("#travelArchiveGrid").getByText("기존 해변 기록").waitFor();
  await page.locator("#travelPlaceAdd").click();
  await page.locator("#travelPlaceType").selectOption({ label: "카페" });
  await page.locator("#travelPlaceName").fill("독립 등록 카페");
  await page.locator("#travelPlaceDate").fill("2026-09-10");
  await page.locator("#travelPlaceLocation").fill("서울 성수동");
  await page.locator("#travelPlaceRating").fill("4.5");
  await page.locator("#travelPlaceHighlight").fill("시그니처 라떼");
  await page.locator("#travelPlacePriceRange").fill("1인 1~2만원");
  await page.locator("#travelPlaceReview").fill("여행 없이도 저장되는 장소");
  await page.locator("#travelPlaceSave").click();

  const afterDirect = await page.evaluate(() => JSON.parse(localStorage.getItem("hani_os_life_v23")));
  assert(afterDirect.version === "2.9.15-safe-baseline-bootstrap", "internal data version changed");
  assert(afterDirect.travelPlaces.length === 1, "independent place was not saved");
  assert(afterDirect.travelPlaces[0].tripId === "", "independent place unexpectedly linked to a trip");
  assert(afterDirect.travelPlaces[0].rating === 4.5, "rating was not preserved");
  await page.locator("#travelArchiveGrid").getByText("독립 등록 카페").waitFor();
  await page.locator("#travelArchiveGrid").getByText("시그니처 라떼").waitFor();
  await page.locator("#travelArchiveGrid").getByText("1인 1~2만원").waitFor();

  await page.evaluate(() => openTravelTripDetail("qa-trip"));
  await page.locator("#travelItineraryBulk").fill("시간\t구분\t장소\t비고\t예상 비용\n12:00\t식사\t연동 식당\t갈비탕\t15,000원");
  await page.locator("#travelItineraryParse").click();
  await page.locator(".travel-preview-place").check();
  await page.locator("#travelItineraryImport").click();

  const afterImport = await page.evaluate(() => JSON.parse(localStorage.getItem("hani_os_life_v23")));
  const linked = afterImport.travelPlaces.find(place => place.name === "연동 식당");
  assert(linked && linked.tripId === "qa-trip", "itinerary place was not linked to its trip");
  assert(linked.type === "식당", "itinerary category classification failed");
  assert(afterImport.travelTrips[0].itinerary.length === 1, "itinerary row was not saved");

  await page.evaluate(() => {
    closeModal("travelTripDetailModal");
    state.ui.travelTab = "archive";
    renderTravel();
  });
  await page.locator("#travelArchiveTrip").selectOption("independent");
  assert(await page.locator(".travel-place-row").count() === 1, "independent filter returned an unexpected row count");
  await page.locator("#travelArchiveTrip").selectOption("all");
  await page.locator("#travelArchiveSearch").fill("갈비탕");
  assert(await page.locator(".travel-place-row").count() === 1, "place search did not narrow the list");
  await page.locator("#travelArchiveSearch").fill("");
  assert(await page.locator(".travel-place-row").count() === 3, "unified place list did not include all records");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof renderTravel === "function");
  await page.evaluate(() => {
    unlockLoginGate();
    showView("travel");
    state.ui.travelTab = "archive";
    renderTravel();
  });
  assert(await page.locator(".travel-place-row").count() === 3, "saved places did not survive reload");

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await page.locator(".travel-place-row").first().evaluate(element => ({
    width: element.getBoundingClientRect().width,
    overflow: element.scrollWidth - element.clientWidth,
    columns: getComputedStyle(element).gridTemplateColumns
  }));
  assert(mobileLayout.width > 0 && mobileLayout.overflow <= 1, "mobile place card overflows horizontally");

  assert(pageErrors.length === 0, `runtime errors: ${pageErrors.join(" | ")}`);
  console.log("Travel places browser smoke: independent save + legacy list + itinerary link + filters + reload + mobile PASS");
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
