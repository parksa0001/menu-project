"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const KAKAO_JAVASCRIPT_KEY = "989f610781cb7f258b2028717879b287";
const KAKAO_SDK_ID = "kakao-maps-sdk";
const KAKAO_SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JAVASCRIPT_KEY}&autoload=false&libraries=services`;

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

type KakaoStatus = {
  OK: string;
  ZERO_RESULT: string;
  ERROR: string;
};

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => unknown;
        services: {
          Places: new () => {
            keywordSearch: (
              keyword: string,
              callback: (data: KakaoPlace[], status: string) => void,
              options?: Record<string, unknown>,
            ) => void;
          };
          Status: KakaoStatus;
          SortBy: {
            ACCURACY: string;
            DISTANCE: string;
          };
        };
      };
    };
  }
}

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

const loadKakaoMaps = () =>
  new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps?.services) {
      resolve();
      return;
    }

    document.getElementById(KAKAO_SDK_ID)?.remove();

    const script = document.createElement("script");
    const timeoutId = window.setTimeout(() => {
      script.remove();
      reject(new Error("Kakao Maps SDK load timeout"));
    }, 8000);

    script.id = KAKAO_SDK_ID;
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.referrerPolicy = "origin";
    script.onload = () => {
      window.clearTimeout(timeoutId);

      if (!window.kakao?.maps) {
        reject(new Error("Kakao Maps SDK is not available"));
        return;
      }

      window.kakao.maps.load(() => {
        if (window.kakao?.maps?.services) {
          resolve();
          return;
        }

        reject(new Error("Kakao Places service is not available"));
      });
    };
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      reject(new Error("Kakao Maps SDK load failed"));
    };

    document.head.appendChild(script);
  });

const formatDistance = (distance?: string) => {
  const meters = Number(distance);

  if (!distance || !Number.isFinite(meters)) {
    return "";
  }

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }

  return `${meters}m`;
};

export default function RestaurantRecommendations() {
  const searchParams = useSearchParams();
  const menu = searchParams.get("menu") || "메뉴";
  const initialLocation = searchParams.get("location") || "";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [places, setPlaces] = useState<KakaoPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState("");
  const keyword = useMemo(
    () => `${locationInput.trim()} ${menu} 맛집`.trim(),
    [locationInput, menu],
  );
  const fallbackPlaces = useMemo(
    () => buildFallbackPlaces(locationInput.trim(), menu),
    [locationInput, menu],
  );
  const visiblePlaces = places.length > 0 ? places : fallbackPlaces;
  const selectedPlace = visiblePlaces.find((place) => place.id === selectedPlaceId);

  const searchRestaurants = () => {
    if (!keyword) {
      setMessage("위치와 메뉴를 확인해주세요.");
      return;
    }

    if (!window.kakao?.maps?.services) {
      setMessage(
        "카카오맵 연결이 막혀 기본 추천 리스트를 보여드려요. 도메인 등록을 확인하면 실제 장소가 바로 표시돼요.",
      );
      return;
    }

    setIsSearching(true);
    setMessage("");
    setSelectedPlaceId("");

    const placesService = new window.kakao.maps.services.Places();
    const options: Record<string, unknown> = {
      size: 10,
      sort: window.kakao.maps.services.SortBy.ACCURACY,
    };
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      options.location = new window.kakao.maps.LatLng(latitude, longitude);
      options.radius = 5000;
      options.sort = window.kakao.maps.services.SortBy.DISTANCE;
    }

    placesService.keywordSearch(
      keyword,
      (data, status) => {
        setIsSearching(false);

        if (status === window.kakao?.maps.services.Status.OK) {
          setPlaces(data);
          setMessage("");
          return;
        }

        setPlaces([]);

        if (status === window.kakao?.maps.services.Status.ZERO_RESULT) {
          setMessage("검색 결과가 없어요. 기본 추천 리스트를 보여드릴게요.");
          return;
        }

        setMessage("맛집 검색에 실패했어요. 기본 추천 리스트를 보여드릴게요.");
      },
      options,
    );
  };

  useEffect(() => {
    let isMounted = true;

    loadKakaoMaps()
      .then(() => {
        if (isMounted) {
          setIsSdkReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMessage(
            "카카오맵 연결이 막혀 기본 추천 리스트를 보여드려요. 도메인 등록을 확인하면 실제 장소가 바로 표시돼요.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isSdkReady && keyword) {
      const timeoutId = window.setTimeout(searchRestaurants, 0);

      return () => window.clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSdkReady]);

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 pb-8 pt-10 text-[#191f28]">
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
            카카오맵 장소 검색으로 주변 맛집을 찾아봤어요. 연결이 막혀도 기본
            후보를 먼저 보여드려요.
          </p>
        </header>

        <div className="rounded-[34px] border border-[#edf1f5] bg-white p-5 shadow-[0_4px_14px_rgba(25,31,40,0.035)]">
          <div className="rounded-[28px] bg-[#f7fbff] px-4 py-4">
            <p className="text-xs font-extrabold text-[#8b95a1]">검색 조건</p>
            <p className="mt-1 text-lg font-black">{keyword || `${menu} 맛집`}</p>
            {lat && lng ? (
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

          <button
            type="button"
            disabled={!selectedPlace}
            className="mt-5 h-[52px] w-full rounded-[26px] bg-[#3182f6] text-sm font-extrabold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-[#d8dde3]"
          >
            {selectedPlace
              ? `${selectedPlace.place_name}으로 정하기`
              : "맛집을 골라주세요"}
          </button>
        </div>
      </section>
    </main>
  );
}
