export const dynamic = "force-dynamic";

const KAKAO_ADDRESS_SEARCH_URL =
  "https://dapi.kakao.com/v2/local/search/address.json";
const KAKAO_KEYWORD_SEARCH_URL =
  "https://dapi.kakao.com/v2/local/search/keyword.json";

type LocationCandidate = {
  id: string;
  label: string;
  detail: string;
  lat: string;
  lng: string;
  source: "address" | "keyword";
};

export async function GET(request: Request) {
  const restApiKey = process.env.KAKAO_REST_API_KEY;

  if (!restApiKey) {
    return Response.json(
      { error: "KAKAO_REST_API_KEY is not configured", documents: [] },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return Response.json(
      { error: "query is required", documents: [] },
      { status: 400 },
    );
  }

  const headers = {
    Authorization: `KakaoAK ${restApiKey}`,
  };
  const addressParams = new URLSearchParams({
    query,
    size: "10",
  });
  const keywordParams = new URLSearchParams({
    query,
    size: "10",
    sort: "accuracy",
  });
  const [addressResponse, keywordResponse] = await Promise.all([
    fetch(`${KAKAO_ADDRESS_SEARCH_URL}?${addressParams}`, {
      headers,
      cache: "no-store",
    }),
    fetch(`${KAKAO_KEYWORD_SEARCH_URL}?${keywordParams}`, {
      headers,
      cache: "no-store",
    }),
  ]);
  const [addressPayload, keywordPayload] = await Promise.all([
    addressResponse.json(),
    keywordResponse.json(),
  ]);
  const candidates = new Map<string, LocationCandidate>();

  for (const document of addressPayload.documents || []) {
    const addressName =
      document.road_address?.address_name || document.address?.address_name;
    const regionName = [
      document.address?.region_1depth_name,
      document.address?.region_2depth_name,
      document.address?.region_3depth_name,
    ]
      .filter(Boolean)
      .join(" ");
    const lng = document.x;
    const lat = document.y;

    if (!addressName || !lat || !lng) {
      continue;
    }

    candidates.set(`${lat}:${lng}:${addressName}`, {
      id: `${lat}:${lng}:${addressName}`,
      label: addressName,
      detail: regionName || "주소 검색 결과",
      lat,
      lng,
      source: "address",
    });
  }

  for (const document of keywordPayload.documents || []) {
    const addressName =
      document.road_address_name || document.address_name || document.place_name;
    const lng = document.x;
    const lat = document.y;

    if (!addressName || !lat || !lng) {
      continue;
    }

    candidates.set(`${lat}:${lng}:${addressName}`, {
      id: `${lat}:${lng}:${addressName}`,
      label: addressName,
      detail: document.place_name || document.category_name || "장소 검색 결과",
      lat,
      lng,
      source: "keyword",
    });
  }

  return Response.json({
    documents: [...candidates.values()].slice(0, 8),
    meta: {
      addressStatus: addressResponse.status,
      keywordStatus: keywordResponse.status,
    },
  });
}
