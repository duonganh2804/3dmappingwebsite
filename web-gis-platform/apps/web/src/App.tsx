import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ViewerPage } from './pages/ViewerPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BookDemoPage } from './pages/BookDemoPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

import { SurveyingSolutionPage } from './pages/SurveyingSolutionPage';
import ConstructionInfrastructureSolutionPage from './pages/ConstructionInfrastructureSolutionPage';
import { AgricultureSolutionPage } from './pages/AgricultureSolutionPage';
import { UavMappingLidarSolutionPage } from './pages/UavMappingLidarSolutionPage';

import { Platform3DGisPage } from './pages/Platform3DGisPage';
import PointCloudLidarPage from './pages/PointCloudLidarPage';
import MeasurementAnalysis3DPage from './pages/MeasurementAnalysisPage';
import { DataLayerManagementPage } from './pages/DataLayerManagementPage';
import { CoordinateSystemsPage } from './pages/CoordinateSystemsPage';
import { ProjectSharingManagementPage } from './pages/ProjectSharingManagementPage';

import { useAuthStore } from './store/useAuthStore';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <HashRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Demo */}
        <Route path="/book-demo" element={<BookDemoPage />} />

        {/* Solutions */}
        <Route
          path="/solutions/surveying"
          element={<SurveyingSolutionPage />}
        />
        <Route
          path="/solutions/construction-infrastructure"
          element={<ConstructionInfrastructureSolutionPage />}
        />
        <Route
          path="/solutions/agriculture"
          element={<AgricultureSolutionPage />}
        />
        <Route
          path="/solutions/uav-mapping-lidar"
          element={<UavMappingLidarSolutionPage />}
        />

        {/* Platform */}
        <Route
          path="/platform/3d-gis"
          element={<Platform3DGisPage />}
        />
        <Route
          path="/platform/point-cloud-lidar"
          element={<PointCloudLidarPage />}
        />
        <Route
          path="/platform/measurement-analysis"
          element={<MeasurementAnalysis3DPage />}
        />
        <Route
          path="/platform/data-layer-management"
          element={<DataLayerManagementPage />}
        />
        <Route
          path="/platform/vn2000-coordinate-systems"
          element={<CoordinateSystemsPage />}
        />
        <Route
          path="/platform/project-sharing-management"
          element={<ProjectSharingManagementPage />}
        />

        {/* App */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/viewer/:projectId" element={<ViewerPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;