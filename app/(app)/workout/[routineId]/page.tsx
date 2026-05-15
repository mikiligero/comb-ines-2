import { redirect } from "next/navigation";
import { getRoutine } from "@/lib/actions/routines";
import { getRopes } from "@/lib/actions/ropes";
import WorkoutScreen from "./WorkoutScreen";

export default async function WorkoutPage({ params }: { params: Promise<{ routineId: string }> }) {
  const { routineId } = await params;
  const [routine, ropes] = await Promise.all([getRoutine(routineId), getRopes()]);
  if (!routine) redirect("/routines");
  return <WorkoutScreen routine={routine} ropes={ropes} />;
}
