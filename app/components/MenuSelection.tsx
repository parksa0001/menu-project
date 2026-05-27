"use client";

import { useState } from "react";

const menus = [
  { name: "치킨", icon: "🍗", tone: "bg-[#fff6df]" },
  { name: "피자", icon: "🍕", tone: "bg-[#fff4df]" },
  { name: "떡볶이", icon: "🌶️", tone: "bg-[#fff0f0]" },
  { name: "마라탕", icon: "🔥", tone: "bg-[#fff1e8]" },
  { name: "삼겹살", icon: "🥩", tone: "bg-[#fff3ed]" },
  { name: "족발보쌈", icon: "🍖", tone: "bg-[#fff1ee]" },
  { name: "중국집", icon: "🥡", tone: "bg-[#fff5e8]" },
  { name: "햄버거", icon: "🍔", tone: "bg-[#fff5e8]" },
  { name: "초밥", icon: "🍣", tone: "bg-[#eef8ff]" },
  { name: "돈까스", icon: "🍛", tone: "bg-[#f3f7ff]" },
  { name: "파스타", icon: "🍝", tone: "bg-[#fff7e6]" },
  { name: "김치찌개", icon: "🥘", tone: "bg-[#fff1ee]" },
  { name: "소고기", icon: "🥩", tone: "bg-[#fff3ed]" },
  { name: "국밥", icon: "🍚", tone: "bg-[#f7f8ff]" },
  { name: "회", icon: "🐟", tone: "bg-[#eef8ff]" },
  { name: "곱창", icon: "🔥", tone: "bg-[#fff1e8]" },
  { name: "닭갈비", icon: "🍳", tone: "bg-[#fff1ee]" },
  { name: "샤브샤브", icon: "🥘", tone: "bg-[#fff7e8]" },
  { name: "감자탕", icon: "🍖", tone: "bg-[#fff1ee]" },
  { name: "라멘", icon: "🍜", tone: "bg-[#fff8dc]" },
  { name: "양꼬치", icon: "🐑", tone: "bg-[#f6f4ff]" },
  { name: "전골", icon: "🍲", tone: "bg-[#fff6e7]" },
  { name: "닭발", icon: "🌶️", tone: "bg-[#fff0f0]" },
  { name: "꼬치", icon: "🍢", tone: "bg-[#fff7e8]" },
  { name: "육회", icon: "🥩", tone: "bg-[#fff3ed]" },
  { name: "타코야끼", icon: "🐙", tone: "bg-[#fff0f3]" },
  { name: "냉면", icon: "🥣", tone: "bg-[#eef8ff]" },
  { name: "해물탕", icon: "🦐", tone: "bg-[#eef8ff]" },
  { name: "오뎅탕", icon: "🍢", tone: "bg-[#fff7e8]" },
  { name: "닭강정", icon: "🍗", tone: "bg-[#fff6df]" },
];

const minSelections = 5;
const maxSelections = 10;
const selectedColor = "#3182f6";

export default function MenuSelection() {
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [showLimitHint, setShowLimitHint] = useState(false);

  const toggleMenu = (menu: string) => {
    if (!selectedMenus.includes(menu) && selectedMenus.length >= maxSelections) {
      setShowLimitHint(true);
      window.setTimeout(() => setShowLimitHint(false), 900);
      return;
    }

    setSelectedMenus((current) => {
      if (current.includes(menu)) {
        return current.filter((selectedMenu) => selectedMenu !== menu);
      }

      return [...current, menu];
    });
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-3 pb-28 pt-7 text-[#191f28]">
      <section className="mx-auto flex w-full max-w-md flex-col">
        <header className="mb-5">
          <div className="mb-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-[#4e5968]">
            오늘의 메뉴 선택
          </div>
          <h1 className="whitespace-nowrap text-[25px] font-extrabold leading-tight tracking-normal min-[390px]:text-[27px]">
            먹고 싶은 메뉴를 골라주세요
          </h1>
          <div className="mt-3 flex flex-col items-start gap-1.5">
            <p className="inline-flex rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-[#3182f6] shadow-[0_4px_12px_rgba(49,130,246,0.08)]">
              {selectedMenus.length}개 선택됨 (최소 {minSelections}개 / 최대{" "}
              {maxSelections}개)
            </p>
            <p
              className={[
                "text-xs font-bold text-[#ff5c2b] transition-all duration-200",
                showLimitHint
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-1 opacity-0",
              ].join(" ")}
            >
              최대 {maxSelections}개까지만 고를 수 있어요
            </p>
          </div>
        </header>

        <div className="grid grid-cols-5 gap-x-2.5 gap-y-3.5">
          {menus.map((menu) => {
            const isSelected = selectedMenus.includes(menu.name);

            return (
              <button
                key={menu.name}
                type="button"
                onClick={() => toggleMenu(menu.name)}
                aria-pressed={isSelected}
                className={[
                  "group relative flex aspect-square w-full flex-col items-center justify-center rounded-[34px] border p-1.5 text-center text-[13.5px] font-extrabold leading-tight shadow-[0_4px_12px_rgba(25,31,40,0.035)] transition-all duration-300 ease-out",
                  "hover:scale-105 hover:shadow-[0_8px_18px_rgba(49,130,246,0.1)] active:scale-[1.03]",
                  "focus:outline-none focus:ring-4 focus:ring-[#3182f6]/15",
                  showLimitHint && !isSelected
                    ? "animate-[wiggle_0.35s_ease-in-out]"
                    : "",
                  isSelected
                    ? "scale-[1.06] border-2 border-[#3182f6] bg-[#eaf3ff] text-[#1b64da] shadow-[0_8px_18px_rgba(49,130,246,0.12)]"
                    : "border-[#edf1f5] bg-white text-[#191f28]",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute right-1.5 top-1.5 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-black shadow-[0_4px_10px_rgba(25,31,40,0.12)] transition-all duration-300",
                    isSelected
                      ? "scale-100 bg-[#3182f6] text-white opacity-100"
                      : "scale-75 bg-[#3182f6] text-white opacity-0",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span
                  className={[
                    "mb-1 flex h-[60%] w-full items-center justify-center rounded-[29px] text-[32px] leading-none shadow-[inset_0_-6px_16px_rgba(25,31,40,0.035)] transition-all duration-300 ease-out",
                    isSelected ? "bg-white" : menu.tone,
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <span
                    className={[
                      "drop-shadow-[0_8px_10px_rgba(25,31,40,0.12)] transition-all duration-300 ease-out",
                      isSelected
                        ? "scale-[1.15] -translate-y-0.5"
                        : "group-hover:-translate-y-0.5 group-hover:scale-110",
                    ].join(" ")}
                  >
                    {menu.icon}
                  </span>
                </span>
                <span className="flex flex-1 items-center justify-center break-keep px-0.5 tracking-normal">
                  {menu.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 bg-[#f7f8fa]/95 px-4 pb-5 pt-3 backdrop-blur">
        <div className="mx-auto w-full max-w-md">
          <button
            type="button"
            disabled={selectedMenus.length < minSelections}
            style={{
              backgroundColor:
                selectedMenus.length >= minSelections ? selectedColor : undefined,
            }}
            className="h-14 w-full rounded-[28px] text-base font-extrabold text-white shadow-[0_6px_14px_rgba(49,130,246,0.18)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] disabled:translate-y-0 disabled:scale-100 disabled:bg-[#d8dde3] disabled:text-white disabled:shadow-none"
          >
            {selectedMenus.length < minSelections
              ? `${minSelections - selectedMenus.length}개 더 골라주세요`
              : "다음"}
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes wiggle {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-2px);
          }
          75% {
            transform: translateX(2px);
          }
        }
      `}</style>
    </main>
  );
}
