"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const fallbackPlaces = [
  {
    id: "place-1",
    tone: "bg-[#eaf3ff]",
    badge: "가까운 후보",
    description: "친구들이 모이기 편한 위치의 캐주얼한 맛집 후보예요.",
  },
  {
    id: "place-2",
    tone: "bg-[#fff4d8]",
    badge: "인기 후보",
    description: "리뷰와 분위기를 함께 보고 고르기 좋은 후보예요.",
  },
  {
    id: "place-3",
    tone: "bg-[#f1f8f4]",
    badge: "편한 후보",
    description: "대화하기 편하고 부담 없이 가기 좋은 후보예요.",
  },
];

export default function RestaurantRecommendations() {
  const searchParams = useSearchParams();
  const menu = searchParams.get("menu") || "메뉴";
  const location = searchParams.get("location") || "선택한 위치";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const places = useMemo(
    () =>
      fallbackPlaces.map((place, index) => ({
        ...place,
        name: `${location} ${menu} 맛집 후보 ${index + 1}`,
      })),
    [location, menu],
  );
  const selectedPlace = places.find((place) => place.id === selectedPlaceId);

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 pb-8 pt-10 text-[#191f28]">
      <section className="mx-auto flex w-full max-w-md flex-col">
        <header className="mb-6">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[32px] bg-[#eaf3ff] text-4xl shadow-[0_8px_20px_rgba(49,130,246,0.07)]">
            🧭
          </div>
          <p className="text-sm font-extrabold text-[#3182f6]">
            맛집 추천 단계
          </p>
          <h1 className="mt-2 text-[28px] font-black leading-tight">
            {location} 근처 {menu} 맛집 추천
          </h1>
          <p className="mt-3 text-sm font-bold leading-relaxed text-[#6b7684]">
            지금은 추천 화면으로 이동하는 구조를 준비했어요. 이후 지도/리뷰
            API를 연결하면 실제 주변 맛집을 불러올 수 있어요.
          </p>
        </header>

        <div className="rounded-[34px] border border-[#edf1f5] bg-white p-5 shadow-[0_4px_14px_rgba(25,31,40,0.035)]">
          <div className="rounded-[28px] bg-[#f7fbff] px-4 py-4">
            <p className="text-xs font-extrabold text-[#8b95a1]">
              선택된 조건
            </p>
            <p className="mt-1 text-lg font-black">
              {location} · {menu}
            </p>
            {lat && lng ? (
              <p className="mt-1 text-xs font-bold text-[#6b7684]">
                현재 위치 좌표 기준으로 추천할 준비가 됐어요
              </p>
            ) : null}
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-extrabold text-[#4e5968]">
              맛집 후보
            </p>
            <div className="space-y-3">
              {places.map((place) => {
                const isSelected = selectedPlaceId === place.id;

                return (
                  <button
                    type="button"
                    key={place.id}
                    onClick={() => setSelectedPlaceId(place.id)}
                    className={[
                      "w-full rounded-[26px] border p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]",
                      isSelected
                        ? "border-[#3182f6] bg-[#eaf3ff]"
                        : "border-transparent bg-[#f7f8fa]",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          "flex h-12 w-12 items-center justify-center rounded-[20px] text-2xl",
                          place.tone,
                        ].join(" ")}
                      >
                        🍽️
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-black">
                          {place.name}
                        </p>
                        <p className="mt-1 text-xs font-extrabold text-[#3182f6]">
                          {place.badge}
                        </p>
                      </div>
                      {isSelected ? (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3182f6] text-sm font-black text-white">
                          ✓
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm font-bold leading-relaxed text-[#6b7684]">
                      {place.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={!selectedPlace}
            className="mt-5 h-[52px] w-full rounded-[26px] bg-[#3182f6] text-sm font-extrabold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-[#d8dde3]"
          >
            최종 장소 결정
          </button>
          {!selectedPlace ? (
            <p className="mt-3 text-center text-xs font-bold text-[#8b95a1]">
              마음에 드는 맛집 후보를 고르면 최종 장소를 정할 수 있어요
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
