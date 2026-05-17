"use client";

import { useState } from "react";
import ExerciseIcon from "./ExerciseIcon";

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

type Props = {
  exId?: string;
  exName?: string;
  size?: number;
};

type State = "video" | "photo" | "icon";

export default function ExerciseVideo({ exName, size = 140 }: Props) {
  const [state, setState] = useState<State>("video");
  const slug = exName ? toSlug(exName) : null;

  const mediaStyle = {
    width: size,
    height: size,
    objectFit: "cover" as const,
    borderRadius: 12,
    background: "var(--bg-2)",
    flexShrink: 0,
  };

  if (!slug || state === "icon") return <ExerciseIcon name={exName} />;

  if (state === "video") {
    return (
      <video
        key={slug}
        src={`/exercises/${slug}.mp4`}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setState("photo")}
        style={mediaStyle}
      />
    );
  }

  return (
    <img
      key={slug + "-photo"}
      src={`/exercises/${slug}.jpg`}
      alt={exName}
      onError={() => setState("icon")}
      style={mediaStyle}
    />
  );
}
