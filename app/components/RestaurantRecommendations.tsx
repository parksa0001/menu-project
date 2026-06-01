"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const recommendationTypes = [
  {
    id: "nearby",
    title: "가까운 맛집",
    icon: "📍",
    tone: "bg-[#eaf3ff]",
    badge: "이동 편함",
    description: "지금 위치나 약속 장소에서 가볍게 이동하기 좋은 후보예요.",
    keyword: "가까운",
  },
  {
    id: "review",
    title: "리뷰 좋은 맛집",
    icon: "⭐",
    tone: "bg-[#fff7d6]",
    badge: "평점 확인",
    description: "리뷰와 사진을 같이 보고 실패 확률을 줄이기 좋은 후보예요.",
    keyword: "리뷰 좋은",
  },
  {
    id: "group",
    title: "단체 가능 맛집",
    icon: "👥",
    tone: "bg-[#f1f8f4]",
    badge: "친구 모임",
    description: "여러 명이 같이 앉기 편한 곳을 우선으로 볼 때 좋아요.",
    keyword: "단체",
  },
  {
    id: "late",
    title: "늦게까지 하는 맛집",
    icon: "🌙",
    tone: "bg-[#f5f0ff]",
    badge: "저녁 약속",
    description: "술약속이나 늦은 저녁에도 여유 있게 갈 수 있는 후보예요.",
    keyword: "늦게까지",
  },
  {
    id: "value",
    title: "가성비 맛집",
    icon: "💙",
    tone: "bg-[#eef6ff]",
    badge: "부담 적음",
    description: "친구들과 부담 없이 고르기 좋은 캐주얼한 후보예요.",
    keyword: "가성비",
  },
];

const buildMapUrl = (query: string) =>
  `https://map.naver.com/p/search/${encodeURIComponent(query)}`;

export default function RestaurantRecommendations() {
  const searchParams = useSearchParams();
  const menu = searchParams.get("menu") || "메뉴";
  const location = searchParams.get("location") || "선택한 위치";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const places = useMemo(
    () =>
      recommendationTypes.map((type) => {
        const query = `${location} ${type.keyword} ${menu} 맛집`;

        return {
          ...type,
          name: `${location} ${type.title}`,
          query,
          url: buildMapUrl(query),
        };
      }),
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
            우리 앱 안에서 먼저 후보를 정리해봤어요. 마음에 드는 후보를 고르고,
            필요하면 지도에서 실제 가게를 확인해보세요.
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
              맛집 추천 리스트
            </p>
            <div className="space-y-3">
              {places.map((place) => {
                const isSelected = selectedPlaceId === place.id;

                return (
                  <div
                    key={place.id}
                    className={[
                      "rounded-[26px] border p-4 transition-all",
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
                    <a
                      href={place.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex h-9 items-center rounded-full bg-white px-4 text-xs font-extrabold text-[#3182f6] shadow-[0_4px_12px_rgba(25,31,40,0.04)]"
                    >
                      지도에서 실제 가게 보기
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={!selectedPlace}
            className="mt-5 h-[52px] w-full rounded-[26px] bg-[#3182f6] text-sm font-extrabold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-[#d8dde3]"
          >
            {selectedPlace ? `${selectedPlace.title}로 정하기` : "후보를 골라주세요"}
          </button>
          {!selectedPlace ? (
            <p className="mt-3 text-center text-xs font-bold text-[#8b95a1]">
              리스트에서 마음에 드는 후보를 먼저 골라주세요
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
