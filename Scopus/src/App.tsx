import { Route, Routes } from "react-router-dom";
import AgentLogin from "./pages/AgentLogin";
import AgentSignUp from "./pages/AgentSignUp";
import FacultyDetailPage from "./pages/FacultyDetailPage";
import FacultyListPage from "./pages/FacultyListPage";
import HeroSection from "./pages/HeroSection";
import HomePage from "./pages/HomePage";
import ResearchDashboard from "./pages/ResearchDashboard";
import HomePage from "./pages/HomePage";

const App: React.FC = () => {
  return (
      <Routes>
<<<<<<< HEAD
        <Route path="/Home" element={<HomePage />} />
        <Route path="/" element={<AgentLogin />} />
=======
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AgentLogin />} />
>>>>>>> 61740eaedce88ea7882eaad106050695f8bdc6e0
        <Route path="/signup" element={<AgentSignUp />} />
        <Route path="/hero" element={<HeroSection />}></Route>
        <Route path="/dashboard" element={<ResearchDashboard />}></Route>
        <Route path="/faculty" element={<FacultyListPage />}></Route>
        <Route path="/faculty/:scopusId" element={<FacultyDetailPage />}></Route>
      </Routes>
  );
};

export default App;