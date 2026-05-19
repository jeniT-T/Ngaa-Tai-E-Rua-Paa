import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import ArrivalPage from "./pages/ArrivalPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import Navbar from "./components/Navbar.jsx";

function App() {
  return (
    <div>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/arrival" element={<ArrivalPage />} />
        <Route path="/contacts" element={<ContactPage />} />
      </Routes>
    </div>
  );
}

export default App;