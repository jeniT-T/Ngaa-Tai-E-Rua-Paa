import { TaskProvider } from "./context/TaskContext.jsx";
import { Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import ArrivalAccessGate from "./components/ArrivalAccessGate.jsx";
import HomeRoute from "./components/HomeRoute.jsx";

import Navbar from "./components/Navbar.jsx";

import ArrivalPage from "./pages/ArrivalPage.jsx";
import GuestArrivalPage from "./pages/GuestArrivalPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import HealthAndSafetyPage from "./pages/HealthAndSafetyPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import FacilitiesPage from "./pages/FacilitiesPage.jsx";
import EventsPage from "./pages/EventsPage.jsx";
import BookingRequestPage from "./pages/BookingRequestPage.jsx";
import MyBookingsPage from "./pages/MyBookingsPage.jsx";

import GasPage from "./pages/arrival/GasPage.jsx";
import WifiPage from "./pages/arrival/WifiPage.jsx";
import MapPage from "./pages/MapPage.jsx";
import EmergencyPage from "./pages/arrival/EmergencyPage.jsx";
import AccessibilityPage from "./pages/arrival/AccessibilityPage.jsx";
import RulesPage from "./pages/arrival/RulesPage.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import UnauthorizedPage from "./pages/UnauthorizedPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import CaretakerDashboardPage from "./pages/caretaker/CaretakerDashboardPage.jsx";
import ChecklistsPage from "./pages/caretaker/ChecklistsPage.jsx";
import TutorialsPage from "./pages/caretaker/TutorialsPage.jsx";
import ManagerDashboardPage from "./pages/manager/ManagerDashboardPage.jsx";
import ManagerBookingsPage from "./pages/manager/ManagerBookingsPage.jsx";
import ManagerUsersPage from "./pages/manager/ManagerUsersPage.jsx";
import ManagerIssuesPage from "./pages/manager/ManagerIssuesPage.jsx";

import ContentLibraryPage from "./pages/ContentLibraryPage.jsx";
import ReportIssuePage from "./pages/ReportIssuePage.jsx";
import ContentManagementPage from "./pages/admin/ContentManagementPage.jsx";

import CalendarCaretaker from "./pages/caretaker/CalendarCaretaker.jsx";
import ScheduleCaretaker from "./pages/caretaker/ScheduleCaretaker.jsx";


function App() {
  return (
    <AuthProvider>
      <TaskProvider>
      <div>
        <Navbar />

        <Routes>
          {/* Logged-out visitors see the public homepage; logged-in users
              are redirected to their role's own dashboard (see HomeRoute /
              ROLE_HOME) — there's no single "home" that fits every role. */}
          <Route path="/" element={<HomeRoute />} />

          {/* Caretaker's own task calendar/schedule — gated the same as the
              rest of the caretaker area (was previously mounted with no
              RoleRoute at all, which would have made it reachable by anyone,
              logged in or not; gating it here to match every other
              caretaker-only route). */}
          <Route
            path="/caretaker/calendar"
            element={
              <RoleRoute allowed={["caretaker", "admin"]}>
                <CalendarCaretaker />
              </RoleRoute>
            }
          />
          <Route
            path="/caretaker/schedule"
            element={
              <RoleRoute allowed={["caretaker", "admin"]}>
                <ScheduleCaretaker />
              </RoleRoute>
            }
          />

          {/* Arrival guide — only for logged-in users with an approved,
              still-current booking (caretaker/admin always allowed).
              /arrival/rules stays public — it's linked from the Facilities page. */}
          <Route
            path="/arrival"
            element={
              <RoleRoute allowed={["member", "caretaker", "admin"]}>
                <ArrivalAccessGate>
                  <ArrivalPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />
          <Route
            path="/arrival/gas"
            element={
              <RoleRoute allowed={["member", "caretaker", "admin"]}>
                <ArrivalAccessGate>
                  <GasPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />
          <Route
            path="/arrival/wifi"
            element={
              <RoleRoute allowed={["member", "caretaker", "admin"]}>
                <ArrivalAccessGate>
                  <WifiPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />
          <Route
            path="/arrival/emergency"
            element={
              <RoleRoute allowed={["member", "caretaker", "admin"]}>
                <ArrivalAccessGate>
                  <EmergencyPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />
          <Route
            path="/arrival/accessibility"
            element={
              <RoleRoute allowed={["member", "caretaker", "admin"]}>
                <ArrivalAccessGate>
                  <AccessibilityPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />
          <Route path="/arrival/rules" element={<RulesPage />} />

          {/* Guest arrival access — no login required. Reached via the
              shareable link/QR code shown on a booking, for guests who
              aren't the account holder (see MyBookingsPage). Gated by the
              booking's own guest_access_token, not a role. */}
          <Route path="/arrival/guest/:token" element={<GuestArrivalPage />} />

          <Route path="/contacts" element={<ContactPage />} />
          <Route path="/health-and-safety" element={<HealthAndSafetyPage />} />
          <Route path="/map" element={<MapPage />} />

          {/* Public landing page sections */}
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/events" element={<EventsPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Bookings — any logged-in user can view their own bookings and request new ones */}
          <Route
            path="/bookings"
            element={
              <RoleRoute allowed={["member", "caretaker", "admin"]}>
                <MyBookingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/bookings/new"
            element={
              <RoleRoute allowed={["member", "caretaker", "admin"]}>
                <BookingRequestPage />
              </RoleRoute>
            }
          />

          {/* Manager: bookings, users/roles, reported issues — everything the
              admin used to do except content management. */}
          <Route
            path="/manager"
            element={
              <RoleRoute allowed={["manager"]}>
                <ManagerDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/manager/bookings"
            element={
              <RoleRoute allowed={["manager"]}>
                <ManagerBookingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/manager/users"
            element={
              <RoleRoute allowed={["manager"]}>
                <ManagerUsersPage />
              </RoleRoute>
            }
          />
          <Route
            path="/manager/issues"
            element={
              <RoleRoute allowed={["manager"]}>
                <ManagerIssuesPage />
              </RoleRoute>
            }
          />

          {/* Caretaker-only (and admin) */}
          <Route
            path="/caretaker"
            element={
              <RoleRoute allowed={["caretaker", "admin"]}>
                <CaretakerDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/caretaker/checklists"
            element={
              <RoleRoute allowed={["caretaker", "admin"]}>
                <ChecklistsPage />
              </RoleRoute>
            }
          />

          {/* Content library — any logged-in user (member, caretaker, or admin) */}
          <Route
            path="/content"
            element={
              <RoleRoute allowed={["member", "caretaker", "admin"]}>
                <ContentLibraryPage />
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
          {/* Report an issue — any logged-in user */}
          <Route
            path="/report-issue"
            element={
              <RoleRoute allowed={["member", "caretaker", "admin"]}>
                <ReportIssuePage />
              </RoleRoute>
            }
          />

          {/* Admin: manage content (the only thing admin does now) */}
          <Route
            path="/admin/content"
            element={
              <RoleRoute allowed={["admin"]}>
                <ContentManagementPage />
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
        </Routes>
      </div>
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;
