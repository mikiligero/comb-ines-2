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

export default function ExerciseVideo({ exName, size = 140 }: Props) {
  const [failed, setFailed] = useState(false);
  const slug = exName ? toSlug(exName) : null;

  if (!slug || failed) return <ExerciseIcon name={exName} />;

  return (
    <video
      key={slug}
      src={`/exercises/${slug}.mp4`}
      autoPlay
      loop
      muted
      playsInline
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: 12,
        background: "var(--bg-2)",
        flexShrink: 0,
      }}
    />
  );
}
