import { Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import RoleRoute from "./components/RoleRoute.jsx";

import Navbar from "./components/Navbar.jsx";

import HomePage from "./pages/HomePage.jsx";
import ArrivalPage from "./pages/ArrivalPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import HealthAndSafetyPage from "./pages/HealthAndSafetyPage.jsx";

import GasPage from "./pages/arrival/GasPage.jsx";
import WifiPage from "./pages/arrival/WifiPage.jsx";
import MapPage from "./pages/MapPage.jsx";
import EmergencyPage from "./pages/arrival/EmergencyPage.jsx";
import AccessibilityPage from "./pages/arrival/AccessibilityPage.jsx";
import RulesPage from "./pages/arrival/RulesPage.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import UnauthorizedPage from "./pages/UnauthorizedPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import UserManagementPage from "./pages/admin/UserManagementPage.jsx";
import ChecklistsPage from "./pages/caretaker/ChecklistsPage.jsx";
import TutorialsPage from "./pages/caretaker/TutorialsPage.jsx";

function App() {
  return (
    <AuthProvider>
      <div>
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/arrival" element={<ArrivalPage />} />

          {/* Arrival subpages */}
          <Route path="/arrival/gas" element={<GasPage />} />
          <Route path="/arrival/wifi" element={<WifiPage />} />
          <Route path="/arrival/emergency" element={<EmergencyPage />} />
          <Route path="/arrival/accessibility" element={<AccessibilityPage />} />
          <Route path="/arrival/rules" element={<RulesPage />} />

          <Route path="/contacts" element={<ContactPage />} />
          <Route path="/health-and-safety" element={<HealthAndSafetyPage />} />
          <Route path="/map" element={<MapPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Caretaker-only (and admin) */}
          <Route
            path="/caretaker/checklists"
            element={
              <RoleRoute allowed={["caretaker", "admin"]}>
                <ChecklistsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/caretaker/tutorials"
            element={
              <RoleRoute allowed={["caretaker", "admin"]}>
                <TutorialsPage />
              </RoleRoute>
            }
          />

          {/* Admin-only */}
          <Route
            path="/admin"
            element={
              <RoleRoute allowed={["admin"]}>
                <AdminDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowed={["admin"]}>
                <UserManagementPage />
              </RoleRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;