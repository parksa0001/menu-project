"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const KAKAO_JAVASCRIPT_KEY = "989f610781cb7f258b2028717879b287";
const KAKAO_SDK_ID = "kakao-javascript-sdk";
const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";
const PRODUCTION_ORIGIN = "https://menu-project-three-ruddy.vercel.app";
const KAKAO_SHARE_DEBUG_KEY = "kakao_share_debug_info";
const SHOW_KAKAO_SHARE_DEBUG = process.env.NODE_ENV === "development";
const OG_IMAGE_VERSION = "20260604-2204";

const meetingTypeLabels: Record<string, string> = {
  offline: "만나서 먹기",
  delivery: "배달",
  drink: "술자리",
  meal: "식사",
};

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

type KakaoShareOptions = {
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
};

type KakaoShareDebugInfo = {
  checkedAt: string;
  currentHref: string;
  currentOrigin: string;
  expectedOrigin: string;
  participantUrl: string;
  imageUrl: string;
  kakaoInitializedBeforeLoad: boolean | null;
  kakaoInitializedAfterLoad: boolean | null;
  payload: KakaoShareOptions;
  executionOriginReason: string;
  suspiciousUrlReason: string;
  errorMessage?: string;
};

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share?: {
        sendDefault: (options: KakaoShareOptions) => void;
      };
    };
  }
}

const getCurrentOrigin = () => {
  if (typeof window === "undefined") {
    return PRODUCTION_ORIGIN;
  }

  return window.location.origin;
};

const getProductionUrl = (path: string) => `${PRODUCTION_ORIGIN}${path}`;

const getSuspiciousUrlReason = (url: string) => {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;

  if (origin === PRODUCTION_ORIGIN) {
    return "OK: production domain";
  }

  if (origin === "http://localhost:3000") {
    return "CHECK: localhost URL is being used";
  }

  if (origin === "http://127.0.0.1:3000") {
    return "CHECK: 127.0.0.1 URL is being used";
  }

  if (origin.endsWith(".vercel.app")) {
    return "CHECK: Vercel preview deployment URL may be used";
  }

  return `CHECK: unexpected origin ${origin}`;
};

const getExecutionOriginReason = (origin: string) => {
  if (origin === PRODUCTION_ORIGIN) {
    return "OK: SDK is running on production domain";
  }

  if (origin === "http://localhost:3000") {
    return "CHECK: SDK is running on localhost";
  }

  if (origin === "http://127.0.0.1:3000") {
    return "CHECK: SDK is running on 127.0.0.1";
  }

  if (origin.endsWith(".vercel.app")) {
    return "CHECK: SDK is running on a Vercel preview domain";
  }

  return `CHECK: SDK is running on unexpected origin ${origin}`;
};

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

const loadKakaoSdk = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
      }

      resolve();
      return;
    }

    const existingScript = document.getElementById(KAKAO_SDK_ID);

    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");

    script.id = KAKAO_SDK_ID;
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (!window.Kakao) {
        reject(new Error("Kakao SDK is not available"));
        return;
      }

      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
      }

      resolve();
    };
    script.onerror = () => reject(new Error("Kakao SDK load failed"));
    document.head.appendChild(script);
  });

function InviteContent() {
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState("");
  const [shareDebugInfo, setShareDebugInfo] =
    useState<KakaoShareDebugInfo | null>(() => {
      if (!SHOW_KAKAO_SHARE_DEBUG || typeof window === "undefined") {
        return null;
      }

      const savedDebugInfo = sessionStorage.getItem(KAKAO_SHARE_DEBUG_KEY);

      if (!savedDebugInfo) {
        return null;
      }

      try {
        return JSON.parse(savedDebugInfo) as KakaoShareDebugInfo;
      } catch {
        sessionStorage.removeItem(KAKAO_SHARE_DEBUG_KEY);
        return null;
      }
    });
  const meetingName = searchParams.get("name") || "우리 모임";
  const meetingTypeKey = searchParams.get("type") || "offline";
  const meetingTypeLabel = meetingTypeLabels[meetingTypeKey] || meetingTypeKey;
  const participantKey =
    searchParams.get("participants") || searchParams.get("otherParticipants") || "4";
  const participantLabel = participantLabels[participantKey] || `${participantKey}명`;
  const joinPath = useMemo(() => {
    const normalizedSearchParams = new URLSearchParams(searchParams.toString());

    if (!normalizedSearchParams.get("participants")) {
      normalizedSearchParams.set("participants", participantKey);
    }

    normalizedSearchParams.delete("otherParticipants");

    return `/join?${normalizedSearchParams.toString()}`;
  }, [participantKey, searchParams]);
  const getParticipantUrl = () => getProductionUrl(joinPath);

  useEffect(() => {
    loadKakaoSdk().catch(() => {
      // Link copy remains available when the SDK is blocked or unavailable.
    });
  }, []);

  const moveToMenu = () => {
    window.location.assign(joinPath);
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1600);
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard?.writeText(getParticipantUrl());
    } catch {
      // Clipboard can be blocked in some embedded browsers; keep the fallback quiet.
    }

    showNotice("링크가 복사됐어요");
  };

  const shareToKakao = async () => {
    const participantUrl = getParticipantUrl();
    const meetingTitle = meetingName.trim() || "우리 뭐 먹지?";
    const imageParams = new URLSearchParams({
      title: meetingTitle,
      v: OG_IMAGE_VERSION,
    });
    const imageUrl = getProductionUrl(`/api/og?${imageParams.toString()}`);
    const kakaoInitializedBeforeLoad = window.Kakao?.isInitialized() ?? null;
    const payload: KakaoShareOptions = {
      objectType: "feed",
      content: {
        title: meetingTitle,
        description: "친구들과 같이 메뉴를 골라보세요",
        imageUrl,
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
    };
    const baseDebugInfo: KakaoShareDebugInfo = {
      checkedAt: new Date().toISOString(),
      currentHref: window.location.href,
      currentOrigin: getCurrentOrigin(),
      expectedOrigin: PRODUCTION_ORIGIN,
      participantUrl,
      imageUrl,
      kakaoInitializedBeforeLoad,
      kakaoInitializedAfterLoad: null,
      payload,
      executionOriginReason: getExecutionOriginReason(getCurrentOrigin()),
      suspiciousUrlReason: getSuspiciousUrlReason(participantUrl),
    };

    if (SHOW_KAKAO_SHARE_DEBUG) {
      console.log("[Kakao Share Debug] window.location.href", window.location.href);
      console.log("[Kakao Share Debug] participantUrl", participantUrl);
      console.log(
        "[Kakao Share Debug] link.mobileWebUrl",
        payload.content.link.mobileWebUrl,
      );
      console.log("[Kakao Share Debug] link.webUrl", payload.content.link.webUrl);
      console.log(
        "[Kakao Share Debug] Kakao.isInitialized before load",
        kakaoInitializedBeforeLoad,
      );
      console.log(
        "[Kakao Share Debug] SDK execution origin",
        baseDebugInfo.currentOrigin,
        baseDebugInfo.executionOriginReason,
      );
      console.log("[Kakao Share Debug] payload", payload);
      sessionStorage.setItem(KAKAO_SHARE_DEBUG_KEY, JSON.stringify(baseDebugInfo));
      setShareDebugInfo(baseDebugInfo);
    }

    try {
      await loadKakaoSdk();

      if (!window.Kakao || !window.Kakao.isInitialized() || !window.Kakao.Share) {
        throw new Error("Kakao Share is not ready");
      }

      const kakaoInitializedAfterLoad = window.Kakao.isInitialized();

      const nextDebugInfo = {
        ...baseDebugInfo,
        kakaoInitializedAfterLoad,
      };

      if (SHOW_KAKAO_SHARE_DEBUG) {
        console.log(
          "[Kakao Share Debug] Kakao.isInitialized after load",
          kakaoInitializedAfterLoad,
        );
        console.log("[Kakao Share Debug] sendDefault payload", payload);
        sessionStorage.setItem(KAKAO_SHARE_DEBUG_KEY, JSON.stringify(nextDebugInfo));
        setShareDebugInfo(nextDebugInfo);
      }
      await waitForPaint();

      window.Kakao.Share.sendDefault(payload);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown Kakao Share error";

      const nextDebugInfo = {
        ...baseDebugInfo,
        kakaoInitializedAfterLoad: window.Kakao?.isInitialized() ?? null,
        errorMessage,
      };

      if (SHOW_KAKAO_SHARE_DEBUG) {
        console.log("[Kakao Share Debug] share error", error);
        sessionStorage.setItem(KAKAO_SHARE_DEBUG_KEY, JSON.stringify(nextDebugInfo));
        setShareDebugInfo(nextDebugInfo);
      }
      await copyInviteLink();
      showNotice("공유창을 열지 못해서 링크를 복사했어요");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 pb-8 pt-10 text-[#191f28]">
      <section className="mx-auto flex w-full max-w-md flex-col">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[36px] bg-[#eaf3ff] text-5xl shadow-[0_8px_20px_rgba(49,130,246,0.08)]">
            🍻
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
                현재 0 / {participantLabel} 참여중
              </span>
              <span className="text-2xl" aria-hidden="true">
                👥
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

        {SHOW_KAKAO_SHARE_DEBUG && shareDebugInfo && (
          <div className="mt-4 rounded-[24px] border border-[#dbe5f0] bg-white p-4 text-left shadow-[0_4px_14px_rgba(25,31,40,0.035)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-[#191f28]">
                카카오 공유 진단
              </p>
              <span
                className={[
                  "rounded-full px-3 py-1 text-[11px] font-extrabold",
                  shareDebugInfo.suspiciousUrlReason.startsWith("OK")
                    ? "bg-[#eaf3ff] text-[#3182f6]"
                    : "bg-[#fff4d8] text-[#b45f00]",
                ].join(" ")}
              >
                {shareDebugInfo.suspiciousUrlReason}
              </span>
            </div>
            <div className="space-y-2 text-xs font-bold leading-relaxed text-[#4e5968]">
              <p>
                실행 도메인:{" "}
                <span className="break-all text-[#191f28]">
                  {shareDebugInfo.currentOrigin}
                </span>{" "}
                <span className="text-[#3182f6]">
                  ({shareDebugInfo.executionOriginReason})
                </span>
              </p>
              <p>
                현재 URL:{" "}
                <span className="break-all text-[#191f28]">
                  {shareDebugInfo.currentHref}
                </span>
              </p>
              <p>
                공유 URL:{" "}
                <span className="break-all text-[#191f28]">
                  {shareDebugInfo.participantUrl}
                </span>
              </p>
              <p>
                이미지 URL:{" "}
                <span className="break-all text-[#191f28]">
                  {shareDebugInfo.imageUrl}
                </span>
              </p>
              <p>
                SDK 초기화:{" "}
                <span className="text-[#3182f6]">
                  before={String(shareDebugInfo.kakaoInitializedBeforeLoad)} /
                  after={String(shareDebugInfo.kakaoInitializedAfterLoad)}
                </span>
              </p>
              {shareDebugInfo.errorMessage && (
                <p className="rounded-[16px] bg-[#fff1f1] px-3 py-2 text-[#f04452]">
                  오류: {shareDebugInfo.errorMessage}
                </p>
              )}
            </div>
            <pre className="mt-3 max-h-56 overflow-auto rounded-[18px] bg-[#f7f8fa] p-3 text-[11px] font-bold leading-relaxed text-[#4e5968]">
              {JSON.stringify(shareDebugInfo.payload, null, 2)}
            </pre>
          </div>
        )}

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
