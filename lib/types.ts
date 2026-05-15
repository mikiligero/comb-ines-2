export type Rope = {
  id: string;
  name: string;
  color: string;
  weight: number;
  type: string;
  bought: string;
};

export type Exercise = {
  id: string;
  name: string;
};

export type RoutineItem = {
  kind: "ex" | "rest";
  exId?: string;
  exName?: string;
  mode?: "time" | "reps";
  value: number;
};

export type RoutineBlock = {
  letter: string;
  ropeId: string;
  items: RoutineItem[];
};

export type Routine = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  transitionSec: number;
  blocks: RoutineBlock[];
};

export type WorkoutSession = {
  id: string;
  routineId: string;
  routineName: string;
  date: string;
  duration: number;
  jumps: number;
  avgHr: number;
  calories: number;
  ropes: string[];
  completed: boolean;
};
