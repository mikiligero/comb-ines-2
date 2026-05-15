import { getWorkouts } from "@/lib/actions/workouts";
import { getRopes } from "@/lib/actions/ropes";
import HistoryClient from "./HistoryClient";

export default async function HistoryPage() {
  const [workouts, ropes] = await Promise.all([getWorkouts(), getRopes()]);
  return <HistoryClient workouts={workouts} ropes={ropes} />;
}
