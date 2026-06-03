import { Routes, Route } from "react-router-dom";

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

function App() {
  return (
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
      </Routes>
    </div>
  );

  
}

export default App;