import Sidebar from "@/components/Sidebar";
import Tabbar from "@/components/Tabbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="app-shell">
        <Sidebar />
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {children}
        </main>
      </div>
      <Tabbar />
    </>
  );
}
