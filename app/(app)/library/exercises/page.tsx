import { readdirSync } from "fs";
import path from "path";
import { getExercises } from "@/lib/actions/exercises";
import ExercisesClient from "./ExercisesClient";

function getVideoSlugs(): Set<string> {
  try {
    const dir = path.join(process.cwd(), "public", "exercises");
    return new Set(
      readdirSync(dir)
        .filter(f => f.endsWith(".mp4"))
        .map(f => f.replace(".mp4", ""))
    );
  } catch {
    return new Set();
  }
}

function getPhotoSlugs(): Set<string> {
  try {
    const dir = path.join(process.cwd(), "public", "exercises");
    return new Set(
      readdirSync(dir)
        .filter(f => f.endsWith(".jpg"))
        .map(f => f.replace(".jpg", ""))
    );
  } catch {
    return new Set();
  }
}

export default async function ExercisesPage() {
  const exercises = await getExercises();
  const videoSlugs = getVideoSlugs();
  const photoSlugs = getPhotoSlugs();
  return <ExercisesClient initialExercises={exercises} videoSlugs={videoSlugs} photoSlugs={photoSlugs} />;
}
