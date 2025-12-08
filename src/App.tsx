import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import History from "./pages/History";
import ManageUsers from "./pages/ManageUsers";
import LeaveApplication from "./pages/forms/LeaveApplication";
import MoneyRequisition from "./pages/forms/MoneyRequisition";
import MaterialRequisition from "./pages/forms/MaterialRequisition";
import AdvanceAdjustment from "./pages/forms/AdvanceAdjustment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<History />} />
          <Route path="/manage-users" element={<ManageUsers />} />
          <Route path="/forms/leave" element={<LeaveApplication />} />
          <Route path="/forms/money" element={<MoneyRequisition />} />
          <Route path="/forms/material" element={<MaterialRequisition />} />
          <Route path="/forms/advance" element={<AdvanceAdjustment />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
