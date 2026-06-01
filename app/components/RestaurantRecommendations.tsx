"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const searchProviders = [
  {
    id: "naver",
    name: "네이버 지도 맛집 리스트",
    icon: "🟢",
    tone: "bg-[#e9f8ef]",
    badge: "리뷰 많은 곳 찾기",
    description: "방문자 리뷰, 사진, 영업시간을 같이 보면서 고르기 좋아요.",
    buildUrl: (query: string) =>
      `https://map.naver.com/p/search/${encodeURIComponent(query)}`,
  },
  {
    id: "kakao",
    name: "카카오맵 맛집 리스트",
    icon: "🟡",
    tone: "bg-[#fff7d6]",
    badge: "친구에게 공유하기 편함",
    description: "카카오톡으로 장소를 공유하기 쉬워서 약속 장소 정할 때 편해요.",
    buildUrl: (query: string) =>
      `https://map.kakao.com/link/search/${encodeURIComponent(query)}`,
  },
  {
    id: "google",
    name: "구글 지도 맛집 리스트",
    icon: "🔵",
    tone: "bg-[#eaf3ff]",
    badge: "주변 후보 넓게 보기",
    description: "지도에서 주변 후보를 넓게 훑어보고 이동 경로를 보기 좋아요.",
    buildUrl: (query: string) =>
      `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
  },
];

export default function RestaurantRecommendations() {
  const searchParams = useSearchParams();
  const menu = searchParams.get("menu") || "메뉴";
  const location = searchParams.get("location") || "선택한 위치";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const query = `${location} ${menu} 맛집`;
  const places = useMemo(
    () =>
      searchProviders.map((provider) => ({
        ...provider,
        url: provider.buildUrl(query),
      })),
    [query],
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
            지도 서비스에서 바로 확인할 수 있는 맛집 리스트를 준비했어요.
            마음에 드는 곳을 골라 최종 장소를 정해보세요.
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
                현재 위치 좌표도 함께 전달할 수 있게 준비되어 있어요
              </p>
            ) : null}
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-extrabold text-[#4e5968]">
              맛집 리스트
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
                        {place.icon}
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

          <a
            href={selectedPlace?.url || "#"}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!selectedPlace}
            onClick={(event) => {
              if (!selectedPlace) {
                event.preventDefault();
              }
            }}
            className={[
              "mt-5 flex h-[52px] w-full items-center justify-center rounded-[26px] text-sm font-extrabold text-white transition-all hover:scale-[1.01] active:scale-[0.99]",
              selectedPlace
                ? "bg-[#3182f6]"
                : "pointer-events-none bg-[#d8dde3]",
            ].join(" ")}
          >
            지도에서 맛집 리스트 보기
          </a>
          <button
            type="button"
            disabled={!selectedPlace}
            className="mt-3 h-[52px] w-full rounded-[26px] border border-[#dbe5f0] bg-white text-sm font-extrabold text-[#3182f6] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:text-[#b0b8c1]"
          >
            최종 장소 결정
          </button>
          {!selectedPlace ? (
            <p className="mt-3 text-center text-xs font-bold text-[#8b95a1]">
              먼저 확인할 지도 리스트를 골라주세요
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
