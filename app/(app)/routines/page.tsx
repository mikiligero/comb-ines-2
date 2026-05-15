import { getRoutines } from "@/lib/actions/routines";
import { getRopes } from "@/lib/actions/ropes";
import { getExercises } from "@/lib/actions/exercises";
import RoutinesClient from "./RoutinesClient";

export default async function RoutinesPage() {
  const [routines, ropes, exercises] = await Promise.all([
    getRoutines(), getRopes(), getExercises(),
  ]);
  return <RoutinesClient initialRoutines={routines} ropes={ropes} exercises={exercises} />;
}
