"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
const menuIcons: Record<string, string> = {
  치킨: "🍗",
  피자: "🍕",
  떡볶이: "🌶️",
  마라탕: "🔥",
  삼겹살: "🥩",
  족발보쌈: "🍖",
  중국집: "🥡",
  햄버거: "🍔",
  초밥: "🍣",
  돈까스: "🍛",
  파스타: "🍝",
  김치찌개: "🥘",
  소고기: "🥩",
  국밥: "🍚",
  회: "🐟",
  곱창: "🔥",
  닭갈비: "🍳",
  샤브샤브: "🥘",
  감자탕: "🍖",
  라멘: "🍜",
  양꼬치: "🐑",
  전골: "🍲",
  닭발: "🌶️",
  꼬치: "🍢",
  육회: "🥩",
  타코야끼: "🐙",
  냉면: "🥣",
  해물탕: "🦐",
  오뎅탕: "🍢",
  닭강정: "🍗",
};
const rouletteColors = [
  "#eaf3ff",
  "#fff4d8",
  "#ffecef",
  "#eafaf1",
  "#f3f0ff",
  "#fff1e8",
];

type StoredVote = {
  participantId: string;
  menus: string[];
  votedAt: string;
};
type DecisionState = {
  type: "random" | "revote";
  menus: string[];
  createdAt: string;
};

const getVotesKey = (projectId: string) => `project_votes_${projectId}`;
const decisionParticipantId = "__decision__";
const revoteParticipantPrefix = "__revote__:";
const randomDecisionToken = "__decision_random__";
const revoteDecisionToken = "__decision_revote__";

const isSystemVote = (participantId: string) =>
  participantId === decisionParticipantId ||
  participantId.startsWith(revoteParticipantPrefix);

const pickRandomMenu = (menus: string[]) => {
  const randomValues = new Uint32Array(1);

  crypto.getRandomValues(randomValues);

  return menus[randomValues[0] % menus.length];
};

const buildRouletteBackground = (menus: string[]) => {
  const segmentSize = 100 / menus.length;

  return `conic-gradient(${menus
    .map((_, index) => {
      const start = index * segmentSize;
      const end = (index + 1) * segmentSize;

      return `${rouletteColors[index % rouletteColors.length]} ${start}% ${end}%`;
    })
    .join(", ")})`;
};

const readLocalVotes = (projectId: string): StoredVote[] => {
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

  const sortedMenus = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }

    return a[0].localeCompare(b[0], "ko");
  });
  const countGroups = new Map<number, number>();

  sortedMenus.forEach(([, count]) => {
    countGroups.set(count, (countGroups.get(count) || 0) + 1);
  });

  let previousCount: number | null = null;
  let rank = 0;

  return sortedMenus.map(([menu, count], index) => {
    if (count !== previousCount) {
      rank = index + 1;
      previousCount = count;
    }

    return {
      menu,
      count,
      rank,
      isTied: (countGroups.get(count) || 0) > 1,
    };
  });
};

export default function VoteResult() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "default";
  const participantKey =
    searchParams.get("participants") || searchParams.get("otherParticipants") || "4";
  const participantLabel = participantLabels[participantKey] || `${participantKey}명`;
  const participantCount = Number(participantKey) || 4;
  const [votes, setVotes] = useState<StoredVote[]>([]);
  const [revoteVotes, setRevoteVotes] = useState<StoredVote[]>([]);
  const [decision, setDecision] = useState<DecisionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decisionAction, setDecisionAction] = useState<
    "random" | "revote" | null
  >(null);
  const [rouletteMenus, setRouletteMenus] = useState<string[]>([]);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [rouletteWinner, setRouletteWinner] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [loadError, setLoadError] = useState("");
  const resultVotes = decision?.type === "revote" ? revoteVotes : votes;
  const popularMenus = buildPopularMenus(resultVotes);
  const topMenus = popularMenus.filter((item) => item.rank === 1);
  const isFinished =
    !isLoading &&
    resultVotes.length >= participantCount &&
    decision?.type !== "revote";
  const isRevoteFinished =
    !isLoading && decision?.type === "revote" && revoteVotes.length >= participantCount;
  const hasTie = !decision && isFinished && topMenus.length > 1;
  const decisionMenus = decision?.menus || topMenus.map((item) => item.menu);
  const revoteSearchParams = new URLSearchParams(searchParams.toString());

  revoteSearchParams.set("projectId", projectId);
  revoteSearchParams.set("revote", "1");
  revoteSearchParams.set("candidates", decisionMenus.join(","));

  const revotePath = `/join?${revoteSearchParams.toString()}`;

  const startRouletteAnimation = (winner: string, menus: string[]) => {
    const segmentAngle = 360 / menus.length;
    const winnerIndex = menus.indexOf(winner);
    const targetAngle = 360 * 7 - (winnerIndex * segmentAngle + segmentAngle / 2);

    setRouletteMenus(menus);
    setRouletteWinner(winner);
    setShowConfetti(false);
    setRouletteRotation(0);
    window.setTimeout(() => setRouletteRotation(targetAngle), 50);
    window.setTimeout(() => {
      setDecision({
        type: "random",
        menus: [winner],
        createdAt: new Date().toISOString(),
      });
      setDecisionAction(null);
      setShowConfetti(true);
      window.setTimeout(() => setShowConfetti(false), 2600);
    }, 4300);
  };

  useEffect(() => {
    const loadVotes = async () => {
      setIsLoading(true);
      setLoadError("");

      if (!supabase) {
        setVotes(readLocalVotes(projectId));
        setLoadError("Supabase 환경변수가 설정되지 않아 이 브라우저의 저장값을 보여주고 있어요.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("votes")
        .select("participant_id, menus, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) {
        setVotes(readLocalVotes(projectId));
        setLoadError("결과를 불러오지 못해서 이 브라우저의 저장값을 보여주고 있어요.");
        setIsLoading(false);
        return;
      }

      const allVotes = (data || []).map((vote) => ({
          participantId: vote.participant_id,
          menus: vote.menus,
          votedAt: vote.created_at,
        }));
      const decisionVotes = allVotes.filter(
        (vote) => vote.participantId === decisionParticipantId,
      );
      const latestDecision = decisionVotes[0];

      setDecision(
        latestDecision?.menus[0] === randomDecisionToken
          ? {
              type: "random",
              menus: latestDecision.menus.slice(1),
              createdAt: latestDecision.votedAt,
            }
          : latestDecision?.menus[0] === revoteDecisionToken
            ? {
                type: "revote",
                menus: latestDecision.menus.slice(1),
                createdAt: latestDecision.votedAt,
              }
            : null,
      );
      setVotes(allVotes.filter((vote) => !isSystemVote(vote.participantId)));
      setRevoteVotes(
        allVotes
          .filter((vote) => vote.participantId.startsWith(revoteParticipantPrefix))
          .map((vote) => ({
            ...vote,
            participantId: vote.participantId.replace(revoteParticipantPrefix, ""),
          })),
      );
      setIsLoading(false);
    };

    loadVotes();
  }, [projectId]);

  const saveDecision = async (type: "random" | "revote") => {
    if (!supabase || decision || topMenus.length < 2 || decisionAction) {
      return;
    }

    setDecisionAction(type);
    setLoadError("");

    const { data: existingDecision } = await supabase
      .from("votes")
      .select("menus, created_at")
      .eq("project_id", projectId)
      .eq("participant_id", decisionParticipantId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingDecision) {
      setDecision(
        existingDecision.menus[0] === randomDecisionToken
          ? {
              type: "random",
              menus: existingDecision.menus.slice(1),
              createdAt: existingDecision.created_at,
            }
          : {
              type: "revote",
              menus: existingDecision.menus.slice(1),
              createdAt: existingDecision.created_at,
            },
      );
      setDecisionAction(null);
      return;
    }

    const winnerMenus = topMenus.map((item) => item.menu);
    const randomMenu = pickRandomMenu(winnerMenus);
    const payload =
      type === "random"
        ? [randomDecisionToken, randomMenu]
        : [revoteDecisionToken, ...winnerMenus];
    const { error } = await supabase.from("votes").insert({
      project_id: projectId,
      participant_id: decisionParticipantId,
      menus: payload,
    });

    if (error) {
      setLoadError("결정 저장에 실패했어요. 다시 시도해주세요.");
      setDecisionAction(null);
      return;
    }

    if (type === "random") {
      startRouletteAnimation(randomMenu, winnerMenus);
      return;
    }

    setDecision({
      type: "revote",
      menus: payload.slice(1),
      createdAt: new Date().toISOString(),
    });
    setDecisionAction(null);
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 pb-8 pt-12 text-[#191f28]">
      <section className="mx-auto flex w-full max-w-md flex-col">
        <header className="mb-6 text-center">
          <div
            className={[
              "mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[36px] text-5xl shadow-[0_8px_20px_rgba(49,130,246,0.08)]",
              isFinished || isRevoteFinished ? "bg-[#fff4d8]" : "bg-[#eaf3ff]",
            ].join(" ")}
          >
            {isFinished || isRevoteFinished ? "🏆" : "✅"}
          </div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-normal">
            {isRevoteFinished
              ? "재투표 완료!"
              : isFinished
                ? "투표 완료!"
                : "메뉴 선택 완료!"}
          </h1>
          <p className="mt-3 text-sm font-bold text-[#6b7684]">
            {isRevoteFinished || isFinished
              ? "모두의 선택이 모였어요. 오늘의 메뉴를 확인해보세요"
              : "친구들의 선택이 모이면 결과를 확인할 수 있어요"}
          </p>
        </header>

        <div className="rounded-[34px] border border-[#edf1f5] bg-white p-5 shadow-[0_4px_14px_rgba(25,31,40,0.035)]">
          <div
            className={[
              "rounded-[28px] px-4 py-4",
              isFinished || isRevoteFinished ? "bg-[#fff8e6]" : "bg-[#f7f8fa]",
            ].join(" ")}
          >
            <p className="text-xs font-extrabold text-[#8b95a1]">
              {isFinished || isRevoteFinished ? "투표가 모두 끝났어요" : "현재 참여"}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[#3182f6]">
              {isLoading ? "확인 중..." : `${resultVotes.length} / ${participantLabel}`}
            </p>
          </div>

          {(hasTie || decision || decisionAction === "random") && (
            <div className="relative mt-5 overflow-hidden rounded-[30px] border border-[#edf1f5] bg-[#f7fbff] p-4">
              {showConfetti && (
                <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                  {Array.from({ length: 18 }).map((_, index) => (
                    <span
                      key={index}
                      className="absolute top-0 h-2 w-2 animate-[confetti_1.8s_ease-out_forwards] rounded-full"
                      style={{
                        left: `${8 + ((index * 47) % 84)}%`,
                        backgroundColor:
                          rouletteColors[index % rouletteColors.length],
                        animationDelay: `${(index % 6) * 0.08}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              {decision?.type === "random" ? (
                <>
                  <p className="text-sm font-extrabold text-[#3182f6]">
                    오늘의 메뉴는... 🎉
                  </p>
                  <div className="mt-3 flex scale-[1.02] items-center gap-3 rounded-[26px] border border-[#ffd66b] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(255,190,40,0.16)]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#eaf3ff] text-3xl">
                      {menuIcons[decision.menus[0]] || "🍽️"}
                    </span>
                    <div>
                      <p className="text-xs font-black text-[#8b95a1]">
                        룰렛이 골라준 최종 메뉴
                      </p>
                      <p className="text-2xl font-black">{decision.menus[0]}</p>
                    </div>
                  </div>
                </>
              ) : decision?.type === "revote" ? (
                <>
                  <p className="text-sm font-extrabold text-[#3182f6]">
                    1등 메뉴 재투표가 시작됐어요 🗳
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#6b7684]">
                    공동 1등 메뉴만 다시 골라주세요
                  </p>
                  <a
                    href={revotePath}
                    className="mt-3 flex h-12 items-center justify-center rounded-[24px] bg-[#3182f6] text-sm font-extrabold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    재투표하러 가기
                  </a>
                </>
              ) : decisionAction === "random" ? (
                <>
                  <p className="text-lg font-black text-[#191f28]">
                    룰렛 돌아가는 중 🎲
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#6b7684]">
                    잠깐만요, 오늘의 메뉴가 정해지고 있어요
                  </p>
                  <div className="relative mx-auto mt-5 flex h-64 w-64 items-center justify-center">
                    <div className="absolute -top-1 z-10 h-0 w-0 border-x-[13px] border-t-[24px] border-x-transparent border-t-[#191f28]" />
                    <div
                      className="relative h-60 w-60 rounded-full border-[10px] border-white shadow-[0_14px_34px_rgba(25,31,40,0.12)] transition-transform duration-[4200ms] ease-out"
                      style={{
                        background: buildRouletteBackground(rouletteMenus),
                        transform: `rotate(${rouletteRotation}deg)`,
                      }}
                    >
                      {rouletteMenus.map((menu, index) => {
                        const segmentAngle = 360 / rouletteMenus.length;
                        const angle = index * segmentAngle + segmentAngle / 2;

                        return (
                          <div
                            key={menu}
                            className="absolute left-1/2 top-1/2 origin-left text-[13px] font-black text-[#191f28]"
                            style={{
                              transform: `rotate(${angle}deg) translateX(46px) rotate(90deg)`,
                            }}
                          >
                            <span className="rounded-full bg-white/75 px-2 py-1 shadow-sm">
                              {menuIcons[menu] || "🍽️"} {menu}
                            </span>
                          </div>
                        );
                      })}
                      <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl font-black shadow-[0_8px_18px_rgba(25,31,40,0.16)]">
                        GO
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-[24px] bg-white px-4 py-3 text-center">
                    <p className="text-xs font-black text-[#8b95a1]">
                      후보 메뉴
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-[#3182f6]">
                      {rouletteMenus.join(" · ")}
                    </p>
                    {rouletteWinner ? (
                      <p className="mt-2 text-base font-black text-[#191f28]">
                        오늘의 메뉴는...?
                      </p>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg font-black text-[#191f28]">
                    결정 장애 발생 🚨
                  </p>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-[#6b7684]">
                    공동 1등 메뉴가 있어요.
                    <br />
                    어떻게 결정할까요?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topMenus.map((item) => (
                      <span
                        key={item.menu}
                        className="rounded-full bg-white px-3 py-2 text-sm font-extrabold text-[#191f28]"
                      >
                        {menuIcons[item.menu] || "🍽️"} {item.menu}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => saveDecision("random")}
                      disabled={Boolean(decisionAction)}
                      className="h-12 rounded-[24px] bg-[#3182f6] text-sm font-extrabold text-white transition-all hover:scale-[1.02] active:scale-[0.99] disabled:bg-[#d8dde3]"
                    >
                      🎲 랜덤 룰렛
                    </button>
                    <button
                      type="button"
                      onClick={() => saveDecision("revote")}
                      disabled={Boolean(decisionAction)}
                      className="h-12 rounded-[24px] border border-[#dbe5f0] bg-white text-sm font-extrabold text-[#3182f6] transition-all hover:scale-[1.02] active:scale-[0.99] disabled:text-[#b0b8c1]"
                    >
                      {decisionAction === "revote" ? "준비 중..." : "🗳 다시 투표"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-5">
            <p className="mb-3 text-sm font-extrabold text-[#4e5968]">
              {isFinished ? "최종 인기 메뉴 🏁" : "현재 인기 메뉴 🔥"}
            </p>
            <div className="space-y-2">
              {isLoading ? (
                <div className="rounded-[22px] bg-[#f7f8fa] px-4 py-3 text-sm font-extrabold text-[#8b95a1]">
                  결과를 불러오는 중이에요
                </div>
              ) : popularMenus.length > 0 ? (
                popularMenus.map((item) => {
                  const isWinner = item.rank === 1;

                  return (
                  <div
                    key={item.menu}
                    className={[
                      "flex items-center gap-3 rounded-[24px] px-4 py-3 transition-all",
                      isWinner
                        ? "border border-[#ffd66b] bg-[#fff8e6] shadow-[0_8px_18px_rgba(255,190,40,0.14)]"
                        : "bg-[#f7f8fa]",
                    ].join(" ")}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf3ff] text-sm font-extrabold text-[#3182f6]">
                      {isWinner ? "🏅" : item.rank}
                    </span>
                    <span
                      className={[
                        "flex h-11 w-11 items-center justify-center rounded-[18px] text-2xl shadow-[inset_0_-6px_16px_rgba(25,31,40,0.035)]",
                        isWinner ? "bg-white" : "bg-[#eef4ff]",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      {menuIcons[item.menu] || "🍽️"}
                    </span>
                    <span className="flex-1 text-base font-extrabold">
                      {item.menu}
                    </span>
                    {isWinner || item.isTied ? (
                      <span className="rounded-full bg-[#ffcf4a] px-2.5 py-1 text-[11px] font-black text-[#7a4b00]">
                        {item.isTied ? `공동 ${item.rank}등` : `${item.rank}등`}
                      </span>
                    ) : null}
                    <span className="text-sm font-extrabold text-[#3182f6]">
                      {item.count}표
                    </span>
                  </div>
                  );
                })
              ) : (
                <div className="rounded-[22px] bg-[#f7f8fa] px-4 py-3 text-sm font-extrabold text-[#8b95a1]">
                  아직 표시할 투표가 없어요
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs font-bold text-[#8b95a1]">
          {loadError || "이 브라우저에서는 이미 투표한 상태로 저장되어 있어요"}
        </p>
      </section>
      <style jsx global>{`
        @keyframes confetti {
          0% {
            opacity: 0;
            transform: translateY(-20px) rotate(0deg) scale(0.8);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(260px) rotate(520deg) scale(1.2);
          }
        }
      `}</style>
    </main>
  );
}
