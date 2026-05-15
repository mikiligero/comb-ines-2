import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Tabbar from "@/components/Tabbar";
import UserInitializer from "@/components/UserInitializer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const name  = session?.user?.name  ?? "";
  const email = session?.user?.email ?? "";

  return (
    <>
      <UserInitializer name={name} email={email} />
      <div className="app-shell">
        <Sidebar />
        <main style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          {children}
        </main>
      </div>
      <Tabbar />
    </>
  );
}
