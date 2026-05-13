import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { Toaster } from "sonner";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { JobsPage } from "./pages/JobsPage.jsx";
import { PostJobPage } from "./pages/PostJobPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { WalletPage } from "./pages/WalletPage.jsx";
import { ChatPage } from "./pages/ChatPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { JobDetailsPage } from "./pages/JobDetailsPage.jsx";
import { FindWorkersPage } from "./pages/FindWorkersPage.jsx";
import { ActiveContractsPage } from "./pages/ActiveContractsPage.jsx";
import { WorkerVerificationPage } from "./pages/WorkerVerificationPage.jsx";
import { ClientReviewPage } from "./pages/ClientReviewPage.jsx";

export default function App() {
  return (
    <>
      <Toaster position="top-center" theme="dark" richColors />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/find-workers" element={<FindWorkersPage />} />
          <Route path="/active-contracts" element={<ActiveContractsPage />} />
          <Route path="/post-job" element={<PostJobPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/verification/:jobId" element={<WorkerVerificationPage />} />
          <Route path="/verification/:jobId/review" element={<ClientReviewPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
    </Routes>
    </>
  );
}
