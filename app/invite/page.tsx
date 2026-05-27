"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// TODO: Kakao JavaScript 앱 키를 발급받아 입력하세요.
const KAKAO_JAVASCRIPT_KEY = "";
const KAKAO_SDK_URL = "https://developers.kakao.com/sdk/js/kakao.js";
const meetingTypeLabels: Record<string, string> = {
  offline: "만나서 먹기",
  delivery: "배달",
  drink: "술자리",
  meal: "식사",
};

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share?: {
        sendDefault: (options: {
          objectType: "feed";
          content: {
            title: string;
            description: string;
            imageUrl: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          };
          buttons: Array<{
            title: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          }>;
        }) => void;
      };
    };
  }
}

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState("");
  const meetingName = searchParams.get("name") || "우리 모임";
  const meetingTypeKey = searchParams.get("type") || "offline";
  const meetingTypeLabel = meetingTypeLabels[meetingTypeKey] || meetingTypeKey;

  const participantUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/join?${searchParams.toString()}`;

  useEffect(() => {
    if (!KAKAO_JAVASCRIPT_KEY || window.Kakao) {
      return;
    }

    const script = document.createElement("script");
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
      }
    };
    document.head.appendChild(script);
  }, []);

  const moveToMenu = () => {
    router.push(`/join?${searchParams.toString()}`);
  };

  const showCopiedNotice = () => {
    setNotice("링크가 복사됐어요");
    window.setTimeout(() => setNotice(""), 1600);
  };

  const copyInviteLink = async () => {
    if (participantUrl) {
      try {
        await navigator.clipboard?.writeText(participantUrl);
      } catch {
        // Clipboard can be blocked in some embedded browsers; keep the user-facing fallback gentle.
      }
      showCopiedNotice();
    }
  };

  const shareToKakao = async () => {
    try {
      if (
        !KAKAO_JAVASCRIPT_KEY ||
        !window.Kakao ||
        !window.Kakao.isInitialized() ||
        !window.Kakao.Share
      ) {
        throw new Error("Kakao SDK is not ready");
      }

      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: "우리 뭐 먹지?",
          description: "친구들과 같이 먹고 싶은 메뉴를 골라보세요",
          imageUrl: `${window.location.origin}/next.svg`,
          link: {
            mobileWebUrl: participantUrl,
            webUrl: participantUrl,
          },
        },
        buttons: [
          {
            title: "참여하기",
            link: {
              mobileWebUrl: participantUrl,
              webUrl: participantUrl,
            },
          },
        ],
      });
    } catch {
      await copyInviteLink();
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 pb-8 pt-10 text-[#191f28]">
      <section className="mx-auto flex w-full max-w-md flex-col">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[36px] bg-[#eaf3ff] text-5xl shadow-[0_8px_20px_rgba(49,130,246,0.08)]">
            🎉
          </div>
          <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-[#3182f6]">
            {meetingTypeLabel}
          </div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-normal">
            메뉴 정하기가 생성되었어요 🍻
          </h1>
          <p className="mt-3 text-[15px] font-bold leading-relaxed text-[#6b7684]">
            친구들에게 링크를 공유하고
            <br />
            같이 메뉴 투표를 시작해보세요
          </p>
        </header>

        <div className="rounded-[34px] border border-[#edf1f5] bg-white p-5 shadow-[0_4px_14px_rgba(25,31,40,0.035)]">
          <div className="mb-5 rounded-[28px] bg-[#f7f8fa] px-4 py-4">
            <p className="text-xs font-extrabold text-[#8b95a1]">만남 이름</p>
            <p className="mt-1 text-xl font-extrabold text-[#191f28]">
              {meetingName}
            </p>
            <div className="mt-4 flex items-center justify-between rounded-[22px] bg-white px-4 py-3">
              <span className="text-sm font-extrabold text-[#6b7684]">
                현재 0명이 참여중이에요
              </span>
              <span className="text-2xl" aria-hidden="true">
                🙋
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={shareToKakao}
              className="h-14 w-full rounded-[28px] bg-[#fee500] text-base font-extrabold text-[#191f28] shadow-[0_4px_12px_rgba(25,31,40,0.04)] transition-all duration-200 ease-out hover:scale-[1.01] active:scale-[0.99]"
            >
              카카오톡 공유하기
            </button>
            <button
              type="button"
              onClick={copyInviteLink}
              className="h-14 w-full rounded-[28px] border border-[#dbe5f0] bg-white text-base font-extrabold text-[#3182f6] transition-all duration-200 ease-out hover:scale-[1.01] hover:bg-[#f4f9ff] active:scale-[0.99]"
            >
              링크 복사
            </button>
          </div>
        </div>

        <p
          className={[
            "mt-3 text-center text-sm font-extrabold text-[#3182f6] transition-all duration-200",
            notice ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
          ].join(" ")}
        >
          {notice || "링크가 복사됐어요"}
        </p>

        <button
          type="button"
          onClick={moveToMenu}
          className="mt-5 h-14 rounded-[28px] bg-[#3182f6] text-base font-extrabold text-white shadow-[0_6px_14px_rgba(49,130,246,0.18)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[#1b64da] active:scale-[0.99]"
        >
          메뉴 고르러 가기
        </button>
      </section>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteContent />
    </Suspense>
  );
}
