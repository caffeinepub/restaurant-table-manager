import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Layout from "./components/Layout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import FloorPlanPage from "./pages/FloorPlanPage";
import LoginPage from "./pages/LoginPage";
import ReservationsPage from "./pages/ReservationsPage";
import TodayPage from "./pages/TodayPage";

export type AppPage = "piantina" | "prenotazioni" | "oggi";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<AppPage>("oggi");

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
          <p className="font-display text-xl text-muted-foreground">
            Benvenuto...
          </p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === "oggi" && <TodayPage />}
        {currentPage === "piantina" && <FloorPlanPage />}
        {currentPage === "prenotazioni" && <ReservationsPage />}
      </Layout>
      <Toaster />
    </>
  );
}
