import { ImageResponse } from "next/og";

const defaultTitle = "우리 뭐 먹지?";
const imageSize = {
  width: 1200,
  height: 630,
};

const clampTitle = (title: string) => {
  const normalizedTitle = title.replace(/\s+/g, " ").trim();

  return normalizedTitle || defaultTitle;
};

const splitTitleLines = (title: string) => {
  if (title.length <= 12) {
    return [title];
  }

  const words = title.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= 12) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length <= 2) {
    return lines;
  }

  return [`${lines[0]}`, `${lines.slice(1).join(" ").slice(0, 13)}...`];
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const title = clampTitle(requestUrl.searchParams.get("title") || defaultTitle);
  const titleLines = splitTitleLines(title);
  const titleFontSize =
    title.length <= 8 ? 88 : title.length <= 14 ? 76 : title.length <= 22 ? 64 : 56;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f8fa",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 88,
            top: 76,
            width: 172,
            height: 172,
            borderRadius: 86,
            background: "#eaf3ff",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 48,
            width: 188,
            height: 188,
            borderRadius: 94,
            background: "#eaf3ff",
          }}
        />
        <div
          style={{
            width: 920,
            height: 432,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 48,
            background: "#ffffff",
            boxShadow: "0 16px 34px rgba(25,31,40,0.10)",
            padding: "48px 80px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 48,
              padding: "0 40px",
              borderRadius: 24,
              background: "#eaf3ff",
              color: "#3182f6",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 0,
              marginBottom: 34,
            }}
          >
            MENU VOTE
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#191f28",
              fontSize: titleFontSize,
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: 0,
              textAlign: "center",
              maxWidth: 760,
              minHeight: titleLines.length > 1 ? 140 : 96,
              marginBottom: 22,
            }}
          >
            {titleLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4e5968",
              fontSize: 36,
              fontWeight: 800,
              marginBottom: 28,
            }}
          >
            친구들과 같이 메뉴를 골라보세요 🍻
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 248,
              height: 68,
              borderRadius: 34,
              background: "#3182f6",
              color: "#ffffff",
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            참여하기
          </div>
        </div>
      </div>
    ),
    {
      ...imageSize,
      emoji: "twemoji",
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
