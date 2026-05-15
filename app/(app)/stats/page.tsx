import { getWorkouts } from "@/lib/actions/workouts";
import StatsClient from "./StatsClient";

export default async function StatsPage() {
  const workouts = await getWorkouts();
  return <StatsClient workouts={workouts} />;
}
