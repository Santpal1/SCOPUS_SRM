import { Route, Routes } from "react-router-dom";
import AgentLogin from "./pages/AgentLogin";
import AgentSignUp from "./pages/AgentSignUp";
import AnalyticsPage from './pages/AnalyticsPage';
import FacultyDetailPage from "./pages/FacultyDetailPage";
import FacultyListPage from "./pages/FacultyListPage";
import HeroSection from "./pages/HeroSection";
import HomePage from "./pages/HomePage";
import PaperDetailPage from "./pages/PaperDetailPage";
import ResearchDashboard from "./pages/ResearchDashboard";
import AuthorPerformance from "./pages/AuthorPerformance";
import AuthorPerformanceDetail from "./pages/AuthorPerformanceDetails";

const App: React.FC = () => {
  return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AgentLogin />} />
        <Route path="/signup" element={<AgentSignUp />} />
        <Route path="/hero" element={<HeroSection />}></Route>
        <Route path="/dashboard" element={<ResearchDashboard />}></Route>
        <Route path="/faculty" element={<FacultyListPage />}></Route>
        <Route path="/faculty/:scopusId" element={<FacultyDetailPage />}></Route>
        <Route path="/paper/:doi" element={<PaperDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/author-performance" element={<AuthorPerformance />} />
        <Route path="/author-performance/:scopus_id" element={<AuthorPerformanceDetail />}/>
      </Routes>
  );
};

export default App;