export const dynamic = "force-dynamic";

const KAKAO_COORD_TO_ADDRESS_URL =
  "https://dapi.kakao.com/v2/local/geo/coord2address.json";

export async function GET(request: Request) {
  const restApiKey = process.env.KAKAO_REST_API_KEY;

  if (!restApiKey) {
    return Response.json(
      { error: "KAKAO_REST_API_KEY is not configured", documents: [] },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");

  if (!latitude || !longitude) {
    return Response.json(
      { error: "lat and lng are required", documents: [] },
      { status: 400 },
    );
  }

  const kakaoParams = new URLSearchParams({
    x: longitude,
    y: latitude,
  });

  const response = await fetch(`${KAKAO_COORD_TO_ADDRESS_URL}?${kakaoParams}`, {
    headers: {
      Authorization: `KakaoAK ${restApiKey}`,
    },
    cache: "no-store",
  });
  const payload = await response.json();

  return Response.json(payload, { status: response.status });
}
