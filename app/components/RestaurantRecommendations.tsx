"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type KakaoPlace = {
  id: string;
  place_name: string;
  category_name: string;
  road_address_name: string;
  address_name: string;
  phone: string;
  place_url: string;
  x: string;
  y: string;
  distance?: string;
};

type FinalPlace = {
  name: string;
  address: string;
  phone: string;
  distance?: string;
  placeUrl?: string;
};

const fallbackTypes = [
  {
    id: "nearby",
    title: "가까운 맛집",
    category: "이동 편한 후보",
    keyword: "가까운",
    description: "약속 장소에서 이동하기 편한 후보를 먼저 확인해보세요.",
  },
  {
    id: "review",
    title: "리뷰 좋은 맛집",
    category: "리뷰 확인 후보",
    keyword: "리뷰 좋은",
    description: "사진과 방문자 리뷰를 보고 고르기 좋은 후보예요.",
  },
  {
    id: "group",
    title: "단체 가능 맛집",
    category: "친구 모임 후보",
    keyword: "단체",
    description: "여러 명이 같이 앉기 편한 곳을 찾을 때 좋아요.",
  },
  {
    id: "late",
    title: "늦게까지 하는 맛집",
    category: "저녁 약속 후보",
    keyword: "늦게까지",
    description: "늦은 저녁이나 술자리 이후에도 여유 있는 후보예요.",
  },
  {
    id: "value",
    title: "가성비 맛집",
    category: "부담 적은 후보",
    keyword: "가성비",
    description: "친구들과 부담 없이 고르기 좋은 캐주얼한 후보예요.",
  },
];

const getFinalPlaceKey = (projectId: string) => `project_final_place_${projectId}`;

const buildFallbackPlaces = (location: string, menu: string): KakaoPlace[] =>
  fallbackTypes.map((type) => {
    const query = `${location} ${type.keyword} ${menu} 맛집`.trim();

    return {
      id: `fallback-${type.id}`,
      place_name: `${location || "근처"} ${type.title}`,
      category_name: type.category,
      road_address_name: type.description,
      address_name: type.description,
      phone: "",
      place_url: `https://map.kakao.com/link/search/${encodeURIComponent(query)}`,
      x: "",
      y: "",
    };
  });

const formatDistance = (distance?: string) => {
  const meters = Number(distance);

  if (!distance || !Number.isFinite(meters)) {
    return "";
  }

  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
};

const toFinalPlace = (place: KakaoPlace): FinalPlace => ({
  name: place.place_name,
  address: place.road_address_name || place.address_name,
  phone: place.phone,
  distance: formatDistance(place.distance),
  placeUrl: place.place_url,
});

export default function RestaurantRecommendations() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "default";
  const menu = searchParams.get("menu") || "메뉴";
  const initialLocation = searchParams.get("location") || "";
  const lat = searchParams.get("lat") || "";
  const lng = searchParams.get("lng") || "";
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [places, setPlaces] = useState<KakaoPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [finalPlace, setFinalPlace] = useState<FinalPlace | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingFinalPlace, setIsSavingFinalPlace] = useState(false);
  const [message, setMessage] = useState("");
  const hasCoordinates = Boolean(lat && lng);
  const isCurrentLocationLabel =
    hasCoordinates && locationInput.trim().includes("현재 위치");
  const searchLocation = isCurrentLocationLabel ? "" : locationInput.trim();
  const keyword = useMemo(
    () =>
      searchLocation
        ? `${searchLocation} ${menu}`.trim()
        : `${menu} 음식점`.trim(),
    [searchLocation, menu],
  );
  const fallbackPlaces = useMemo(
    () => buildFallbackPlaces(searchLocation || "현재 위치", menu),
    [searchLocation, menu],
  );
  const visiblePlaces = places.length > 0 ? places : fallbackPlaces;
  const selectedPlace = visiblePlaces.find((place) => place.id === selectedPlaceId);

  const searchRestaurants = async () => {
    if (!keyword || finalPlace) {
      return;
    }

    setIsSearching(true);
    setMessage("");
    setSelectedPlaceId("");

    const params = new URLSearchParams({ query: keyword, size: "10" });

    if (hasCoordinates) {
      params.set("lat", lat);
      params.set("lng", lng);
    }

    try {
      const response = await fetch(`/api/kakao/places?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Kakao search failed");
      }

      const documents = Array.isArray(payload.documents)
        ? (payload.documents as KakaoPlace[])
        : [];

      setPlaces(documents);
      setMessage(
        documents.length > 0
          ? ""
          : "검색 결과가 없어요. 기본 추천 리스트를 보여드릴게요.",
      );
    } catch {
      setPlaces([]);
      setMessage(
        "카카오 REST API 연결이 아직 준비되지 않아 기본 추천 리스트를 보여드려요. KAKAO_REST_API_KEY를 설정하면 실제 가게명이 바로 표시돼요.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const decideFinalPlace = async () => {
    if (!selectedPlace) {
      return;
    }

    const nextFinalPlace = toFinalPlace(selectedPlace);

    setIsSavingFinalPlace(true);
    setMessage("");

    try {
      if (supabase) {
        const { error } = await supabase
          .from("projects")
          .update({
            final_place_name: nextFinalPlace.name,
            final_place_address: nextFinalPlace.address,
            final_place_phone: nextFinalPlace.phone,
          })
          .eq("id", projectId);

        if (error) {
          setMessage(
            "장소는 이 브라우저에 저장했어요. Supabase projects 테이블에 final_place_name, final_place_address, final_place_phone 컬럼을 추가하면 DB에도 저장돼요.",
          );
        }
      }
    } catch {
      setMessage(
        "장소는 이 브라우저에 저장했어요. DB 컬럼 준비 후에는 프로젝트에도 저장돼요.",
      );
    }

    localStorage.setItem(getFinalPlaceKey(projectId), JSON.stringify(nextFinalPlace));
    setFinalPlace(nextFinalPlace);
    setIsConfirmOpen(false);
    setIsSavingFinalPlace(false);
  };

  useEffect(() => {
    const localFinalPlace = localStorage.getItem(getFinalPlaceKey(projectId));

    if (localFinalPlace) {
      try {
        const parsedFinalPlace = JSON.parse(localFinalPlace) as FinalPlace;
        const timeoutId = window.setTimeout(() => {
          setFinalPlace(parsedFinalPlace);
        }, 0);

        return () => window.clearTimeout(timeoutId);
      } catch {
        localStorage.removeItem(getFinalPlaceKey(projectId));
      }
    }

    const client = supabase;

    if (!client) {
      return;
    }

    let isMounted = true;

    const loadFinalPlace = async () => {
      const { data, error } = await client
        .from("projects")
        .select("final_place_name, final_place_address, final_place_phone")
        .eq("id", projectId)
        .maybeSingle();

      if (
        !error &&
        isMounted &&
        data?.final_place_name &&
        data?.final_place_address
      ) {
        setFinalPlace({
          name: data.final_place_name,
          address: data.final_place_address,
          phone: data.final_place_phone || "",
        });
      }
    };

    loadFinalPlace();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(searchRestaurants, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (finalPlace) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] px-5 pb-8 pt-12 text-[#191f28]">
        <section className="mx-auto flex w-full max-w-md flex-col text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[36px] bg-[#fff4d8] text-5xl shadow-[0_8px_20px_rgba(255,190,40,0.12)]">
            🎉
          </div>
          <h1 className="text-[30px] font-black leading-tight">
            장소가 결정됐어요!
          </h1>
          <p className="mt-3 text-sm font-bold text-[#6b7684]">
            친구들과 오늘 갈 곳이 정해졌어요
          </p>

          <div className="mt-6 rounded-[34px] border border-[#edf1f5] bg-white p-5 text-left shadow-[0_4px_14px_rgba(25,31,40,0.035)]">
            <div className="rounded-[28px] bg-[#f7fbff] px-4 py-5">
              <p className="text-xs font-extrabold text-[#3182f6]">
                오늘의 최종 장소
              </p>
              <p className="mt-2 text-2xl font-black">🍕 {finalPlace.name}</p>
              <p className="mt-3 text-sm font-bold leading-relaxed text-[#6b7684]">
                📍 {finalPlace.address}
              </p>
              {finalPlace.distance ? (
                <p className="mt-2 text-sm font-extrabold text-[#3182f6]">
                  현재 위치 기준 {finalPlace.distance}
                </p>
              ) : null}
              {finalPlace.phone ? (
                <p className="mt-2 text-sm font-bold text-[#6b7684]">
                  {finalPlace.phone}
                </p>
              ) : null}
            </div>

            {finalPlace.placeUrl ? (
              <a
                href={finalPlace.placeUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[26px] bg-[#3182f6] text-sm font-extrabold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                카카오맵 열기
              </a>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 pb-28 pt-10 text-[#191f28]">
      <section className="mx-auto flex w-full max-w-md flex-col">
        <header className="mb-6">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[32px] bg-[#eaf3ff] text-4xl shadow-[0_8px_20px_rgba(49,130,246,0.07)]">
            🧭
          </div>
          <p className="text-sm font-extrabold text-[#3182f6]">
            카카오맵 맛집 추천
          </p>
          <h1 className="mt-2 text-[28px] font-black leading-tight">
            {locationInput || "선택한 위치"} 근처 {menu} 맛집
          </h1>
          <p className="mt-3 text-sm font-bold leading-relaxed text-[#6b7684]">
            후보 중 마음에 드는 곳을 고르고 친구들과 최종 장소를 확정해보세요.
          </p>
        </header>

        <div className="rounded-[34px] border border-[#edf1f5] bg-white p-5 shadow-[0_4px_14px_rgba(25,31,40,0.035)]">
          <div className="rounded-[28px] bg-[#f7fbff] px-4 py-4">
            <p className="text-xs font-extrabold text-[#8b95a1]">검색 조건</p>
            <p className="mt-1 text-lg font-black">{keyword || `${menu} 맛집`}</p>
            {hasCoordinates ? (
              <p className="mt-1 text-xs font-bold text-[#6b7684]">
                현재 위치 기준으로 가까운 순서도 반영해요
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  searchRestaurants();
                }
              }}
              placeholder="예: 강남역, 홍대입구, 성수동"
              className="h-12 min-w-0 flex-1 rounded-[24px] border border-[#e8eef6] bg-white px-4 text-sm font-bold text-[#191f28] outline-none transition-all placeholder:text-[#b0b8c1] focus:border-[#3182f6] focus:bg-[#f7fbff]"
            />
            <button
              type="button"
              onClick={searchRestaurants}
              disabled={isSearching || !locationInput.trim()}
              className="h-12 rounded-[24px] bg-[#3182f6] px-5 text-sm font-extrabold text-white transition-all hover:scale-[1.02] active:scale-[0.99] disabled:bg-[#d8dde3]"
            >
              검색
            </button>
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-extrabold text-[#4e5968]">
                맛집 리스트
              </p>
              <span className="text-xs font-extrabold text-[#3182f6]">
                {isSearching ? "검색 중..." : `${visiblePlaces.length}곳`}
              </span>
            </div>

            {message ? (
              <div className="mb-3 rounded-[24px] bg-[#f7f8fa] px-4 py-4 text-sm font-bold leading-relaxed text-[#6b7684]">
                {message}
              </div>
            ) : null}

            <div className="space-y-3">
              {visiblePlaces.map((place, index) => {
                const isSelected = selectedPlaceId === place.id;
                const address = place.road_address_name || place.address_name;
                const distance = formatDistance(place.distance);

                return (
                  <div
                    key={place.id}
                    className={[
                      "w-full rounded-[26px] border p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]",
                      isSelected
                        ? "border-[#3182f6] bg-[#eaf3ff]"
                        : "border-transparent bg-[#f7f8fa]",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedPlaceId(place.id)}
                      className="w-full text-left"
                    >
                      <div className="flex gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-white text-sm font-black text-[#3182f6] shadow-[0_4px_12px_rgba(25,31,40,0.04)]">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <p className="min-w-0 flex-1 text-base font-black">
                              {place.place_name}
                            </p>
                            {isSelected ? (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3182f6] text-sm font-black text-white">
                                ✓
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs font-extrabold text-[#3182f6]">
                            {place.category_name || `${menu} 맛집`}
                          </p>
                          {address ? (
                            <p className="mt-2 text-sm font-bold leading-relaxed text-[#6b7684]">
                              {address}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2 pl-[60px]">
                      {distance ? (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#4e5968]">
                          {distance}
                        </span>
                      ) : null}
                      {place.phone ? (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#4e5968]">
                          {place.phone}
                        </span>
                      ) : null}
                      <a
                        href={place.place_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#3182f6]"
                      >
                        카카오맵 보기
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-[#f7f8fa]/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={!selectedPlace}
            className="h-[54px] w-full rounded-[27px] bg-[#3182f6] text-base font-extrabold text-white shadow-[0_8px_18px_rgba(49,130,246,0.16)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-[#d8dde3] disabled:shadow-none"
          >
            {selectedPlace ? "최종 장소 결정" : "장소를 선택해주세요"}
          </button>
        </div>
      </div>

      {isConfirmOpen && selectedPlace ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 px-5 pb-5 sm:items-center sm:pb-0">
          <div className="w-full max-w-md rounded-[34px] bg-white p-5 shadow-[0_20px_50px_rgba(25,31,40,0.18)]">
            <h2 className="text-xl font-black">이 장소로 결정할까요?</h2>
            <div className="mt-4 rounded-[26px] bg-[#f7f8fa] px-4 py-4">
              <p className="text-lg font-black">{selectedPlace.place_name}</p>
              <p className="mt-2 text-sm font-bold leading-relaxed text-[#6b7684]">
                {selectedPlace.road_address_name || selectedPlace.address_name}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSavingFinalPlace}
                className="h-12 rounded-[24px] border border-[#dbe5f0] bg-white text-sm font-extrabold text-[#4e5968] transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={decideFinalPlace}
                disabled={isSavingFinalPlace}
                className="h-12 rounded-[24px] bg-[#3182f6] text-sm font-extrabold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-[#d8dde3]"
              >
                {isSavingFinalPlace ? "저장 중..." : "결정하기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
