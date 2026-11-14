const places = {
  origin: { input: document.querySelector("#origin-input") },
  destination: { input: document.querySelector("#destination-input") },
};

const calculateButton = document.querySelector("#calculate-button");
const formMessage = document.querySelector("#form-message");
const distanceCard = document.querySelector("#distance-card");
let lastGeocodingRequest = 0;
let requestInProgress = false;

function updateCalculateButton() {
  calculateButton.disabled = !places.origin.selected || !places.destination.selected;
}

function setMessage(message) {
  formMessage.textContent = message;
}

function getPlaceLabel(place) {
  return place.name || place.display_name;
}

function clearSelection(key) {
  const place = places[key];
  place.selected = null;
  document.querySelector(`#${key}-selection`).textContent = "";
  document.querySelector(`#${key}-results`).replaceChildren();
  updateCalculateButton();
  distanceCard.hidden = true;
}

for (const [key, place] of Object.entries(places)) {
  place.input.addEventListener("input", () => {
    clearSelection(key);
    setMessage("");
  });
}

async function waitForGeocodingLimit() {
  const wait = Math.max(0, 1100 - (Date.now() - lastGeocodingRequest));
  if (wait > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, wait));
  }
  lastGeocodingRequest = Date.now();
}

function renderPlaceResults(key, results) {
  const resultContainer = document.querySelector(`#${key}-results`);
  resultContainer.replaceChildren();

  if (results.length === 0) {
    setMessage("장소를 찾지 못했어요. 도시나 주소를 더 자세히 입력해 주세요.");
    return;
  }

  for (const result of results) {
    const option = document.createElement("button");
    const name = document.createElement("strong");
    const address = document.createElement("span");
    option.type = "button";
    option.className = "result-option";
    name.textContent = getPlaceLabel(result);
    address.textContent = result.display_name;
    option.append(name, address);
    option.addEventListener("click", () => {
      places[key].selected = result;
      places[key].input.value = getPlaceLabel(result);
      document.querySelector(`#${key}-selection`).textContent = `선택됨 · ${result.type || "장소"}`;
      resultContainer.replaceChildren();
      setMessage("");
      updateCalculateButton();
    });
    resultContainer.append(option);
  }
}

async function searchPlace(key) {
  const query = places[key].input.value.trim();
  if (!query) {
    setMessage("검색할 장소를 입력해 주세요.");
    places[key].input.focus();
    return;
  }
  if (requestInProgress) {
    setMessage("검색을 마친 뒤 다시 시도해 주세요.");
    return;
  }

  requestInProgress = true;
  setMessage("실제 장소를 찾고 있어요…");
  const searchButton = document.querySelector(`[data-place="${key}"]`);
  searchButton.disabled = true;

  try {
    await waitForGeocodingLimit();
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      limit: "5",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    if (!response.ok) {
      throw new Error(`장소 검색 요청 실패 (${response.status})`);
    }

    const results = await response.json();
    renderPlaceResults(key, results);
    if (results.length > 0) {
      setMessage("검색 결과에서 정확한 장소를 선택해 주세요.");
    }
  } catch (error) {
    console.error(error);
    setMessage("장소를 검색하지 못했어요. 잠시 후 다시 시도해 주세요.");
  } finally {
    requestInProgress = false;
    searchButton.disabled = false;
  }
}

for (const button of document.querySelectorAll(".search-button")) {
  button.addEventListener("click", () => searchPlace(button.dataset.place));
}

async function calculateDistance() {
  const origin = places.origin.selected;
  const destination = places.destination.selected;
  if (!origin || !destination) {
    setMessage("출발지와 도착지를 검색한 뒤 결과에서 선택해 주세요.");
    return;
  }

  calculateButton.disabled = true;
  calculateButton.querySelector("span").textContent = "경로를 찾고 있어요…";
  setMessage("");
  distanceCard.hidden = true;

  try {
    const coordinates = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
    const params = new URLSearchParams({ overview: "false", alternatives: "false" });
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?${params}`);
    if (!response.ok) {
      throw new Error(`경로 요청 실패 (${response.status})`);
    }

    const data = await response.json();
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error(`경로 계산 실패 (${data.code || "경로 없음"})`);
    }

    const distance = data.routes[0].distance / 1000;
    document.querySelector("#distance-value").textContent = new Intl.NumberFormat("ko-KR", {
      maximumFractionDigits: 1,
    }).format(distance);
    document.querySelector("#result-origin").textContent = getPlaceLabel(origin);
    document.querySelector("#result-destination").textContent = getPlaceLabel(destination);

    const mapParams = new URLSearchParams({
      engine: "fossgis_osrm_car",
      route: `${origin.lat},${origin.lon};${destination.lat},${destination.lon}`,
    });
    document.querySelector("#map-link").href = `https://www.openstreetmap.org/directions?${mapParams}`;
    distanceCard.hidden = false;
    distanceCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    console.error(error);
    setMessage("경로를 계산하지 못했어요. 두 장소가 자동차 경로로 연결되는지 확인하고 다시 시도해 주세요.");
  } finally {
    calculateButton.querySelector("span").textContent = "거리 계산하기";
    updateCalculateButton();
  }
}

calculateButton.addEventListener("click", calculateDistance);
