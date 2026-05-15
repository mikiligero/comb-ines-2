import { getRopes } from "@/lib/actions/ropes";
import RopesClient from "./RopesClient";

export default async function RopesPage() {
  const ropes = await getRopes();
  return <RopesClient initialRopes={ropes} />;
}
