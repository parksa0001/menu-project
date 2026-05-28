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

type StoredVote = {
  participantId: string;
  menus: string[];
  votedAt: string;
};

const getVotesKey = (projectId: string) => `project_votes_${projectId}`;

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

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([menu, count]) => ({ menu, count }));
};

export default function VoteResult() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "default";
  const participantKey =
    searchParams.get("participants") || searchParams.get("otherParticipants") || "4";
  const participantLabel = participantLabels[participantKey] || `${participantKey}명`;
  const [votes, setVotes] = useState<StoredVote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const popularMenus = buildPopularMenus(votes);

  useEffect(() => {
    const loadVotes = async () => {
      setIsLoading(true);
      setLoadError("");

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

      setVotes(
        (data || []).map((vote) => ({
          participantId: vote.participant_id,
          menus: vote.menus,
          votedAt: vote.created_at,
        })),
      );
      setIsLoading(false);
    };

    loadVotes();
  }, [projectId]);

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
              {isLoading ? "확인 중..." : `${votes.length} / ${participantLabel}`}
            </p>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-extrabold text-[#4e5968]">
              현재 인기 메뉴 🔥
            </p>
            <div className="space-y-2">
              {isLoading ? (
                <div className="rounded-[22px] bg-[#f7f8fa] px-4 py-3 text-sm font-extrabold text-[#8b95a1]">
                  결과를 불러오는 중이에요
                </div>
              ) : popularMenus.length > 0 ? (
                popularMenus.map((item, index) => (
                  <div
                    key={item.menu}
                    className="flex items-center gap-3 rounded-[22px] bg-[#f7f8fa] px-4 py-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf3ff] text-sm font-extrabold text-[#3182f6]">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-base font-extrabold">
                      {item.menu}
                    </span>
                    <span className="text-sm font-extrabold text-[#3182f6]">
                      {item.count}표
                    </span>
                  </div>
                ))
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
    </main>
  );
}
