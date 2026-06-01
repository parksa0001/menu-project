export const dynamic = "force-dynamic";

const KAKAO_LOCAL_SEARCH_URL =
  "https://dapi.kakao.com/v2/local/search/keyword.json";

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

  const kakaoParams = new URLSearchParams({
    query,
    size: searchParams.get("size") || "10",
    sort: searchParams.get("sort") || "accuracy",
  });
  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");

  if (latitude && longitude) {
    kakaoParams.set("y", latitude);
    kakaoParams.set("x", longitude);
    kakaoParams.set("radius", searchParams.get("radius") || "5000");
    kakaoParams.set("sort", "distance");
  }

  const response = await fetch(`${KAKAO_LOCAL_SEARCH_URL}?${kakaoParams}`, {
    headers: {
      Authorization: `KakaoAK ${restApiKey}`,
    },
    cache: "no-store",
  });
  const payload = await response.json();

  return Response.json(payload, { status: response.status });
}
