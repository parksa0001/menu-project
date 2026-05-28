"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
const participantLabels: Record<string, string> = {
  "2": "2명",
  "3": "3명",
  "4": "4명",
  "5": "5명",
  "6": "6명",
  "7": "7명",
  "8": "8명",
  "9": "9명",
  "10": "10명",
  "11": "11명",
  "12": "12명",
  "13": "13명",
  "14": "14명",
  "15": "15명",
  "16": "16명",
  "17": "17명",
  "18": "18명",
  "19": "19명",
  "20": "20명",
};
type StoredVote = {
  participantId: string;
  menus: string[];
  votedAt: string;
};

const createParticipantId = () => {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `participant_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const getVoteKey = (projectId: string) => `project_vote_${projectId}`;
const getVotesKey = (projectId: string) => `project_votes_${projectId}`;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const readVotes = (projectId: string): StoredVote[] => {
  try {
    return JSON.parse(localStorage.getItem(getVotesKey(projectId)) || "[]");
  } catch {
    return [];
  }
};

const buildPopularMenus = (votes: StoredVote[]) => {
  const counts = new Map<string, number>();

  votes.forEach((vote) => {
    vote.menus.forEach((menu) => {
      counts.set(menu, (counts.get(menu) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([menu]) => menu);
};

export default function MenuSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryProjectId = searchParams.get("projectId");
  const [fallbackProjectId] = useState(() => createParticipantId());
  const projectId =
    queryProjectId && uuidPattern.test(queryProjectId)
      ? queryProjectId
      : fallbackProjectId;
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [showLimitHint, setShowLimitHint] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [votes, setVotes] = useState<StoredVote[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return readVotes(projectId);
  });
  const [hasVoted] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(localStorage.getItem(getVoteKey(projectId)));
  });
  const participantKey =
    searchParams.get("participants") || searchParams.get("otherParticipants") || "4";
  const participantLabel = participantLabels[participantKey] || `${participantKey}명`;
  const popularMenus = buildPopularMenus(votes);
  const resultSearchParams = new URLSearchParams(searchParams.toString());

  resultSearchParams.set("projectId", projectId);

  const resultPath = `/result?${resultSearchParams.toString()}`;

  useEffect(() => {
    if (hasVoted) {
      router.replace(resultPath);
    }
  }, [hasVoted, resultPath, router]);

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

  const submitVote = async () => {
    if (selectedMenus.length < minSelections || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError("");

    const existingParticipantId = localStorage.getItem(getVoteKey(projectId));
    const participantId = existingParticipantId || createParticipantId();
    const projectTitle = searchParams.get("name") || null;
    const meetingType = searchParams.get("type") || null;
    const peopleCount = Number(participantKey);

    if (!supabase) {
      setSaveError("Supabase 환경변수가 설정되지 않았어요.");
      setIsSaving(false);
      return;
    }

    const { error: projectError } = await supabase.from("projects").upsert({
      id: projectId,
      title: projectTitle,
      type: meetingType,
      people_count: Number.isNaN(peopleCount) ? null : peopleCount,
    });

    if (projectError) {
      setSaveError("프로젝트 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
      setIsSaving(false);
      return;
    }

    const { error } = await supabase.from("votes").insert({
      project_id: projectId,
      participant_id: participantId,
      menus: selectedMenus,
    });

    if (error) {
      setSaveError("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      setIsSaving(false);
      return;
    }

    const nextVote: StoredVote = {
      participantId,
      menus: selectedMenus,
      votedAt: new Date().toISOString(),
    };
    const currentVotes = readVotes(projectId);
    const nextVotes = [
      ...currentVotes.filter((vote) => vote.participantId !== participantId),
      nextVote,
    ];

    localStorage.setItem(getVoteKey(projectId), participantId);
    localStorage.setItem(getVotesKey(projectId), JSON.stringify(nextVotes));
    setVotes(nextVotes);
    router.push(resultPath);
  };

  if (hasVoted) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] px-5 pb-8 pt-12 text-[#191f28]">
        <section className="mx-auto flex w-full max-w-md flex-col">
          <header className="mb-6 text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[36px] bg-[#eaf3ff] text-5xl">
              ✅
            </div>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-normal">
              메뉴 선택 완료!
            </h1>
            <p className="mt-3 text-sm font-bold text-[#6b7684]">
              친구들의 선택이 모이면 결과를 확인할 수 있어요
            </p>
          </header>

          <div className="rounded-[34px] border border-[#edf1f5] bg-white p-5 shadow-[0_4px_14px_rgba(25,31,40,0.035)]">
            <div className="rounded-[28px] bg-[#f7f8fa] px-4 py-4">
              <p className="text-xs font-extrabold text-[#8b95a1]">현재 참여</p>
              <p className="mt-1 text-2xl font-extrabold text-[#3182f6]">
                {votes.length} / {participantLabel}
              </p>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-sm font-extrabold text-[#4e5968]">
                현재 인기 메뉴 🔥
              </p>
              <div className="space-y-2">
                {(popularMenus.length > 0 ? popularMenus : selectedMenus).map(
                  (menu, index) => (
                    <div
                      key={menu}
                      className="flex items-center gap-3 rounded-[22px] bg-[#f7f8fa] px-4 py-3"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf3ff] text-sm font-extrabold text-[#3182f6]">
                        {index + 1}
                      </span>
                      <span className="text-base font-extrabold">{menu}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs font-bold text-[#8b95a1]">
            이 브라우저에서는 이미 투표한 상태로 저장되어 있어요
          </p>
        </section>
      </main>
    );
  }

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
            <p className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#6b7684]">
              현재 {votes.length} / {participantLabel} 참여중
            </p>
            <p
              className={[
                "text-xs font-bold text-[#ff5c2b] transition-all duration-200",
                showLimitHint || saveError
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-1 opacity-0",
              ].join(" ")}
            >
              {saveError || `최대 ${maxSelections}개까지만 고를 수 있어요`}
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
            onClick={submitVote}
            disabled={selectedMenus.length < minSelections || isSaving}
            style={{
              backgroundColor:
                selectedMenus.length >= minSelections ? selectedColor : undefined,
            }}
            className="h-14 w-full rounded-[28px] text-base font-extrabold text-white shadow-[0_6px_14px_rgba(49,130,246,0.18)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] disabled:translate-y-0 disabled:scale-100 disabled:bg-[#d8dde3] disabled:text-white disabled:shadow-none"
          >
            {isSaving
              ? "저장 중..."
              : selectedMenus.length < minSelections
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
