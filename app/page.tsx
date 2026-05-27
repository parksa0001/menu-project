"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const meetingTypes = [
  { value: "offline", label: "만나서 먹기", icon: "🍽️" },
  { value: "delivery", label: "배달", icon: "🛵" },
] as const;

type MeetingTypeValue = (typeof meetingTypes)[number]["value"];

export default function Home() {
  const router = useRouter();
  const [meetingName, setMeetingName] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingTypeValue>("offline");

  const startPicking = () => {
    const params = new URLSearchParams();

    if (meetingName.trim()) {
      params.set("name", meetingName.trim());
    }

    params.set("type", meetingType);
    router.push(`/invite?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 pb-8 pt-14 text-[#191f28]">
      <section className="mx-auto flex w-full max-w-md flex-col">
        <header className="mb-6">
          <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-[#3182f6] shadow-[0_6px_16px_rgba(49,130,246,0.08)]">
            친구들과 메뉴 고르기
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-normal">
            우리 뭐 먹지?
          </h1>
          <p className="mt-2 text-sm font-bold text-[#6b7684]">
            가볍게 고르고 바로 투표를 시작해요
          </p>
        </header>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-[13px] font-extrabold text-[#6b7684]">
              만남 이름 (선택)
            </span>
            <input
              value={meetingName}
              onChange={(event) => setMeetingName(event.target.value)}
              placeholder="금요일 술약속 (선택)"
              className="h-[52px] w-full rounded-[26px] border border-[#edf1f5] bg-white px-4 text-base font-extrabold text-[#191f28] shadow-[0_4px_12px_rgba(25,31,40,0.035)] outline-none transition-all placeholder:text-[#b0b8c1] focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10"
            />
          </label>

          <div>
            <p className="mb-2 text-[13px] font-extrabold text-[#6b7684]">
              어떻게 먹을까요?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {meetingTypes.map((type) => {
                const isSelected = meetingType === type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMeetingType(type.value)}
                    aria-pressed={isSelected}
                    className={[
                      "flex h-[82px] flex-col items-center justify-center rounded-[30px] border text-[15px] font-extrabold shadow-[0_4px_12px_rgba(25,31,40,0.035)] transition-all duration-200 ease-out",
                      "hover:scale-[1.03] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-[#3182f6]/15",
                      isSelected
                        ? "border-[#3182f6] bg-[#eaf3ff] text-[#1b64da] shadow-[0_6px_14px_rgba(49,130,246,0.1)]"
                        : "border-[#edf1f5] bg-white text-[#191f28]",
                    ].join(" ")}
                  >
                    <span className="mb-0.5 text-[28px]" aria-hidden="true">
                      {type.icon}
                    </span>
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={startPicking}
          className="mt-7 h-14 rounded-[28px] bg-[#3182f6] text-base font-extrabold text-white shadow-[0_6px_14px_rgba(49,130,246,0.18)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[#1b64da] active:scale-[0.99]"
        >
          메뉴 정하기 시작
        </button>
      </section>
    </main>
  );
}
