import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import Layout from './Layout';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import TempsPage from './pages/TempsPage';
import AddJobPage from './pages/AddJobPage';
import AddTempPage from './pages/AddTempPage';
import SkillsPage from './pages/SkillsPage';
import AssignJobPage from './pages/AssignJobPage';
import AssignTempPage from './pages/AssignTempPage';
import { Toaster } from './components/Toaster/Toaster';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Toaster />
        <Routes>
          <Route path="/"                   element={<HomePage />} />
          <Route path="/jobs"               element={<JobsPage />} />
          <Route path="/temps"              element={<TempsPage />} />
          <Route path="/temps/:tempId/assign" element={<AssignJobPage />} />
          <Route path="/jobs/:jobId/assign"  element={<AssignTempPage />} />
          <Route path="/skills"             element={<SkillsPage />} />
          <Route path="/add-job"            element={<AddJobPage />} />
          <Route path="/add-temp"           element={<AddTempPage />} />
          <Route path="*"                   element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
