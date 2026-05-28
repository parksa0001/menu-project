"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";

const meetingTypes = [
  { value: "offline", label: "만나서 먹기", icon: "🍽️" },
  { value: "delivery", label: "배달", icon: "🛵" },
] as const;
const participantOptions = [
  { value: "2", label: "2명" },
  { value: "3", label: "3명" },
  { value: "4", label: "4명" },
  { value: "5", label: "5명" },
  { value: "6", label: "6명" },
  { value: "7", label: "7명" },
  { value: "8", label: "8명" },
] as const;
const otherParticipantOptions = Array.from({ length: 12 }, (_, index) => {
  const value = String(index + 9);

  return { value, label: `${value}명` };
});

export default function Home() {
  const [meetingName, setMeetingName] = useState("");
  const [projectId] = useState(() => crypto.randomUUID());
  const [missingEatType, setMissingEatType] = useState(false);
  const [missingParticipants, setMissingParticipants] = useState(false);
  const [selectedPresetParticipants, setSelectedPresetParticipants] =
    useState<string | null>(null);
  const [selectedOtherParticipants, setSelectedOtherParticipants] = useState("");

  const logSelection = (peopleCount?: string | null) => {
    const eatType = document.querySelector<HTMLInputElement>(
      'input[name="type"]:checked',
    )?.value;
    const radioPeopleCount = document.querySelector<HTMLInputElement>(
      'input[name="participantsPreset"]:checked',
    )?.value;
    const otherPeopleCount = document.querySelector<HTMLSelectElement>(
      'select[name="otherParticipants"]',
    )?.value;
    const selectedPeopleCount =
      peopleCount ?? (otherPeopleCount || radioPeopleCount || null);

    if (eatType) {
      setMissingEatType(false);
    }

    if (selectedPeopleCount) {
      setMissingParticipants(false);
    }

    console.log(
      JSON.stringify({
        eatType: eatType || null,
        peopleCount: selectedPeopleCount ? Number(selectedPeopleCount) : null,
      }),
    );
  };

  const selectOtherParticipants = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const peopleCount = event.target.value;

    setSelectedPresetParticipants(null);
    setSelectedOtherParticipants(peopleCount);
    logSelection(peopleCount);
  };

  const selectPresetParticipants = (peopleCount: string) => {
    const otherSelect = document.querySelector<HTMLSelectElement>(
      'select[name="otherParticipants"]',
    );

    if (otherSelect) {
      otherSelect.value = "";
    }

    setSelectedPresetParticipants(peopleCount);
    setSelectedOtherParticipants("");
    logSelection(peopleCount);
  };

  const startPicking = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const eatType = form.querySelector<HTMLInputElement>(
      'input[name="type"]:checked',
    )?.value;
    const selectedPeopleCount = form.querySelector<HTMLInputElement>(
      'input[name="participants"]',
    )?.value;
    const radioPeopleCount = form.querySelector<HTMLInputElement>(
      'input[name="participantsPreset"]:checked',
    )?.value;
    const otherPeopleCount = form.querySelector<HTMLSelectElement>(
      'select[name="otherParticipants"]',
    )?.value;
    const peopleCount = selectedPeopleCount || otherPeopleCount || radioPeopleCount;

    if (!eatType || !peopleCount) {
      event.preventDefault();
      setMissingEatType(!eatType);
      setMissingParticipants(!peopleCount);
      window.setTimeout(() => {
        setMissingEatType(false);
        setMissingParticipants(false);
      }, 1800);
      return;
    }
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

        <form action="/invite" method="get" onSubmit={startPicking} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input
            type="hidden"
            name="participants"
            value={selectedOtherParticipants || selectedPresetParticipants || ""}
          />
          <label className="block">
            <span className="mb-2 block text-[13px] font-extrabold text-[#6b7684]">
              만남 이름 (선택)
            </span>
            <input
              name="name"
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
                return (
                  <label
                    key={type.value}
                    className={[
                      "choice-card flex h-[82px] cursor-pointer flex-col items-center justify-center rounded-[30px] border text-[15px] font-extrabold shadow-[0_4px_12px_rgba(25,31,40,0.035)] transition-all duration-200 ease-out",
                      "hover:scale-[1.03] active:scale-[0.99] has-focus-visible:ring-4 has-focus-visible:ring-[#3182f6]/15",
                      "border-[#edf1f5] bg-white text-[#191f28]",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      onChange={() => logSelection()}
                      className="sr-only"
                    />
                    <span className="mb-0.5 text-[28px]" aria-hidden="true">
                      {type.icon}
                    </span>
                    {type.label}
                  </label>
                );
              })}
            </div>
            <p
              className={[
                "mt-2 text-xs font-extrabold text-[#ff5c2b] transition-all duration-200",
                missingEatType
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-1 opacity-0",
              ].join(" ")}
            >
              먼저 어떻게 먹을지 선택해주세요
            </p>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-extrabold text-[#6b7684]">
              몇 명이 같이 고르나요?
            </p>
            <div className="grid grid-cols-4 gap-2">
              {participantOptions.map((option) => {
                return (
                  <label
                    key={option.value}
                    className={[
                      "flex h-12 cursor-pointer items-center justify-center rounded-[22px] border text-sm font-extrabold shadow-[0_4px_12px_rgba(25,31,40,0.035)] transition-all duration-200 ease-out",
                      "hover:scale-[1.03] active:scale-[0.98] has-focus-visible:ring-4 has-focus-visible:ring-[#3182f6]/15",
                      selectedPresetParticipants === option.value
                        ? "border-[#3182f6] bg-[#eaf3ff] text-[#1b64da] shadow-[0_6px_14px_rgba(49,130,246,0.1)]"
                        : "border-[#edf1f5] bg-white text-[#4e5968]",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="participantsPreset"
                      value={option.value}
                      checked={selectedPresetParticipants === option.value}
                      onChange={() => selectPresetParticipants(option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
              <label
                className={[
                  "relative h-12 rounded-[22px] border shadow-[0_4px_12px_rgba(25,31,40,0.035)] transition-all duration-200 ease-out hover:scale-[1.03] active:scale-[0.98]",
                  selectedOtherParticipants
                    ? "border-[#3182f6] bg-[#eaf3ff] text-[#1b64da] shadow-[0_6px_14px_rgba(49,130,246,0.1)]"
                    : "border-[#edf1f5] bg-white text-[#4e5968]",
                ].join(" ")}
              >
                <select
                  name="otherParticipants"
                  value={selectedOtherParticipants}
                  onChange={selectOtherParticipants}
                  className="h-full w-full appearance-none rounded-[22px] bg-transparent px-3 text-center text-sm font-extrabold outline-none"
                  aria-label="그 외 참여 인원 선택"
                >
                  <option value="" disabled>
                    그 외
                  </option>
                  {otherParticipantOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
                  aria-hidden="true"
                >
                  ▼
                </span>
              </label>
            </div>
            <p
              className={[
                "mt-2 text-xs font-extrabold text-[#ff5c2b] transition-all duration-200",
                missingParticipants
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-1 opacity-0",
              ].join(" ")}
            >
              같이 고를 인원을 먼저 선택해주세요
            </p>
          </div>
          <button
            type="submit"
            className="mt-3 h-14 w-full rounded-[28px] bg-[#3182f6] text-base font-extrabold text-white shadow-[0_6px_14px_rgba(49,130,246,0.18)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[#1b64da] active:scale-[0.99]"
          >
            메뉴 정하기 시작
          </button>
        </form>
      </section>
      <style jsx global>{`
        .choice-card:has(input:checked) {
          border-color: #3182f6;
          background: #eaf3ff;
          color: #1b64da;
          box-shadow: 0 6px 14px rgba(49, 130, 246, 0.1);
        }
      `}</style>
    </main>
  );
}
