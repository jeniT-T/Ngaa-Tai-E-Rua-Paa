import { TaskProvider } from "./context/TaskContext.jsx";
import { Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import ArrivalAccessGate from "./components/ArrivalAccessGate.jsx";
import HomeRoute from "./components/HomeRoute.jsx";

import SiteTheme from "./components/SiteTheme.jsx";
import StaffBackButton from "./components/StaffBackButton.jsx";
import AccessNotice from "./components/AccessNotice.jsx";
import Navbar from "./components/Navbar.jsx";

import ArrivalPage from "./pages/ArrivalPage.jsx";
import GuestArrivalPage from "./pages/GuestArrivalPage.jsx";
import GenericGuestArrivalPage from "./pages/GenericGuestArrivalPage.jsx";
import GenericGuestAccessGate from "./components/GenericGuestAccessGate.jsx";
import GuestAccessGate from "./components/GuestAccessGate.jsx";
import ContactPage from "./pages/ContactPage.jsx";
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

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import UnauthorizedPage from "./pages/UnauthorizedPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import CaretakerDashboardPage from "./pages/caretaker/CaretakerDashboardPage.jsx";
import ChecklistsPage from "./pages/caretaker/ChecklistsPage.jsx";
import EquipmentPage from "./pages/caretaker/EquipmentPage.jsx";
import TutorialsPage from "./pages/caretaker/TutorialsPage.jsx";
import CaretakerManageContentPage from "./pages/caretaker/CaretakerManageContentPage.jsx";
import ManageTutorialsPage from "./pages/caretaker/ManageTutorialsPage.jsx";
import ManagerDashboardPage from "./pages/manager/ManagerDashboardPage.jsx";
import ManagerBookingsPage from "./pages/manager/ManagerBookingsPage.jsx";
import ManagerNewBookingPage from "./pages/manager/ManagerNewBookingPage.jsx";
import ManagerUsersPage from "./pages/manager/ManagerUsersPage.jsx";
import ManagerIssuesPage from "./pages/manager/ManagerIssuesPage.jsx";

import ContentLibraryPage from "./pages/ContentLibraryPage.jsx";
import ChecklistsViewPage from "./pages/ChecklistsViewPage.jsx";
import TutorialsViewPage from "./pages/TutorialsViewPage.jsx";
import ReportIssuePage from "./pages/ReportIssuePage.jsx";
import ContentManagementPage from "./pages/admin/ContentManagementPage.jsx";
import SiteSettingsPage from "./pages/admin/SiteSettingsPage.jsx";

import CalendarCaretaker from "./pages/caretaker/CalendarCaretaker.jsx";
import ScheduleCaretaker from "./pages/caretaker/ScheduleCaretaker.jsx";


function App() {
  return (
    <AuthProvider>
      <TaskProvider>
      <div>
        <SiteTheme />
        <Navbar />
        <AccessNotice />
        <StaffBackButton />

        <Routes>
          {/* Logged-out visitors see the public homepage; logged-in users
              are redirected to their role's own dashboard (see HomeRoute /
              ROLE_HOME) — there's no single "home" that fits every role. */}
          <Route path="/" element={<HomeRoute />} />

          {/* Caretaker's own task calendar/schedule — gated the same as the
              rest of the caretaker area (was previously mounted with no
              RoleRoute at all, which would have made it reachable by anyone,
              logged in or not; gating it here to match every other
              caretaker-only route). Manager is included too — there's only
              one caretaker, and manager needs the same view (and the tasks
              themselves are now shared via the backend, not per-browser
              localStorage — see TaskContext.jsx). This calendar is only for
              people working at the marae, never public. */}
          <Route
            path="/caretaker/calendar"
            element={
              <RoleRoute allowed={["caretaker", "manager", "admin"]}>
                <CalendarCaretaker />
              </RoleRoute>
            }
          />
          <Route
            path="/caretaker/schedule"
            element={
              <RoleRoute allowed={["caretaker", "manager", "admin"]}>
                <ScheduleCaretaker />
              </RoleRoute>
            }
          />

          {/* Arrival guide — only for logged-in users with an approved,
              still-current booking (caretaker/admin always allowed).
              Health & Safety and Rules & Regulations used to be separate
              routes (/health-and-safety, /arrival/rules) — both are now
              rendered as sections inside ArrivalGuideView itself instead,
              so there's no standalone route for either one any more, and
              neither is reachable without the same access this route
              requires (or via the guest-link view below). See the comment
              above DEFAULT_SAFETY_SECTIONS in ArrivalGuideView.jsx. */}
          <Route
            path="/arrival"
            element={
              <RoleRoute allowed={["member", "caretaker", "manager", "admin"]}>
                <ArrivalAccessGate>
                  <ArrivalPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />
          <Route
            path="/arrival/gas"
            element={
              <RoleRoute allowed={["member", "caretaker", "manager", "admin"]}>
                <ArrivalAccessGate>
                  <GasPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />
          <Route
            path="/arrival/wifi"
            element={
              <RoleRoute allowed={["member", "caretaker", "manager", "admin"]}>
                <ArrivalAccessGate>
                  <WifiPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />
          <Route
            path="/arrival/emergency"
            element={
              <RoleRoute allowed={["member", "caretaker", "manager", "admin"]}>
                <ArrivalAccessGate>
                  <EmergencyPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />
          <Route
            path="/arrival/accessibility"
            element={
              <RoleRoute allowed={["member", "caretaker", "manager", "admin"]}>
                <ArrivalAccessGate>
                  <AccessibilityPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />

          {/* Read-only checklist view — members need an active booking;
              caretaker/admin/manager access is filtered by assigned role.
              Caretakers and admins manage the editable version at
              /caretaker/checklists. */}
          <Route
            path="/checklists"
            element={
              <RoleRoute allowed={["member", "caretaker", "manager", "admin"]}>
                <ArrivalAccessGate>
                  <ChecklistsViewPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />

          {/* Read-only tutorials view — same access rule as the checklist
              view above and the arrival guide itself. Caretakers manage the
              real, editable version at /caretaker/manage-tutorials. */}
          <Route
            path="/tutorials"
            element={
              <RoleRoute allowed={["member", "caretaker", "manager", "admin"]}>
                <ArrivalAccessGate>
                  <TutorialsViewPage />
                </ArrivalAccessGate>
              </RoleRoute>
            }
          />

          {/* Guest arrival access — no login required. Reached via the
              shareable link/QR code shown on a booking, for guests who
              aren't the account holder (see MyBookingsPage). Gated by the
              booking's own guest_access_token, not a role. */}
          <Route path="/arrival/guest/:token" element={<GuestArrivalPage />} />

          {/* Generic guest arrival access — no login, no specific booking
              token either. Backs a non-personal QR code the client can
              post physically around the marae itself, rather than a link
              shared digitally for one specific booking. Only "active"
              while an approved booking's date range covers today
              specifically — see §24 and GenericGuestAccessGate.jsx. */}
          <Route path="/arrival/guest" element={<GenericGuestArrivalPage />} />

          {/* Guest-reachable Checklists/Tutorials — read-only, same data
              the authenticated /checklists and /tutorials routes show,
              extended to an actual unauthenticated guest via either guest
              route above (per-booking token, or the generic site-wide
              code) — see §24. */}
          <Route
            path="/checklists/guest/:token"
            element={
              <GuestAccessGate>
                <ChecklistsViewPage />
              </GuestAccessGate>
            }
          />
          <Route
            path="/checklists/guest"
            element={
              <GenericGuestAccessGate>
                <ChecklistsViewPage />
              </GenericGuestAccessGate>
            }
          />
          <Route
            path="/tutorials/guest/:token"
            element={
              <GuestAccessGate>
                <TutorialsViewPage />
              </GuestAccessGate>
            }
          />
          <Route
            path="/tutorials/guest"
            element={
              <GenericGuestAccessGate>
                <TutorialsViewPage />
              </GenericGuestAccessGate>
            }
          />

          <Route path="/contacts" element={<ContactPage />} />
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
            path="/manager/bookings/previous"
            element={
              <RoleRoute allowed={["manager"]}>
                <ManagerBookingsPage previous />
              </RoleRoute>
            }
          />
          <Route
            path="/manager/bookings/new"
            element={
              <RoleRoute allowed={["manager"]}>
                <ManagerNewBookingPage />
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
          {/* Equipment inventory (S36) — caretaker/admin manage it, manager
              gets the same read-only access it already has to the
              caretaker calendar (see backend/routes/equipment.js). */}
          <Route
            path="/caretaker/equipment"
            element={
              <RoleRoute allowed={["caretaker", "manager", "admin"]}>
                <EquipmentPage />
              </RoleRoute>
            }
          />
          {/* "Manage Content" hub (see Navbar.jsx) and the caretaker's own
              tutorial content manager, mirroring the admin Content Manager's
              style but scoped to the caretaker-tutorials placement only
              (enforced server-side too, see backend/routes/content.js). */}
          <Route
            path="/caretaker/manage-content"
            element={
              <RoleRoute allowed={["caretaker", "admin"]}>
                <CaretakerManageContentPage />
              </RoleRoute>
            }
          />
          <Route
            path="/caretaker/manage-tutorials"
            element={
              <RoleRoute allowed={["caretaker", "admin"]}>
                <ManageTutorialsPage />
              </RoleRoute>
            }
          />
          {/* Caretaker's own view of reported issues — same page the manager
              uses (backend GET/PATCH /api/issues now allows caretaker too,
              see backend/routes/issues.js), so a caretaker knows what's been
              reported and can mark it in progress/resolved themselves. */}
          <Route
            path="/caretaker/issues"
            element={
              <RoleRoute allowed={["caretaker", "admin"]}>
                <ManagerIssuesPage />
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

          {/* Admin: manage content (the main thing admin does) */}
          <Route
            path="/admin/content"
            element={
              <RoleRoute allowed={["admin"]}>
                <ContentManagementPage />
              </RoleRoute>
            }
          />

          {/* Admin: the marae's own identity — name/logo, map, booking form
              wording — see SiteSettingsPage.jsx for why this is separate
              from Content Manager. */}
          <Route
            path="/admin/settings"
            element={
              <RoleRoute allowed={["admin"]}>
                <SiteSettingsPage />
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
