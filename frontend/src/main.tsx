import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ContractProvider } from "./context/ContractContext";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import UserDashboard from "./pages/UserDashboard";
import LawyerDashboard from "./pages/LawyerDashboard";
import ContractAnalysisPage from "./pages/ContractAnalysisPage";
import ReportPage from "./pages/ReportPage";
import MarketplacePage from "./pages/MarketplacePage";
import "./styles.css";

const App = (): JSX.Element => (
  <AuthProvider>
    <ContractProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/lawyers/dashboard" element={<LawyerDashboard />} />
          <Route path="/analysis" element={<ContractAnalysisPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </BrowserRouter>
    </ContractProvider>
  </AuthProvider>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

