import { useEffect } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import PublicSiteLayout from './components/PublicSiteLayout';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ViewerPage } from './pages/ViewerPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BookDemoPage } from './pages/BookDemoPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import ContactConsultationPage from './pages/ContactConsultationPage';

// Solutions
import { SurveyingSolutionPage } from './pages/SurveyingSolutionPage';
import ConstructionInfrastructureSolutionPage from './pages/ConstructionInfrastructureSolutionPage';
import { AgricultureSolutionPage } from './pages/AgricultureSolutionPage';
import { UavMappingLidarSolutionPage } from './pages/UavMappingLidarSolutionPage';

// Platform
import { Platform3DGisPage } from './pages/Platform3DGisPage';
import PointCloudLidarPage from './pages/PointCloudLidarPage';
import MeasurementAnalysis3DPage from './pages/MeasurementAnalysisPage';
import { DataLayerManagementPage } from './pages/DataLayerManagementPage';
import { CoordinateSystemsPage } from './pages/CoordinateSystemsPage';
import { ProjectSharingManagementPage } from './pages/ProjectSharingManagementPage';

// Resources
import MappingWorkflowPage from './pages/resources/MappingWorkflowPage';
import EquipmentTechnicalSpecsPage from './pages/resources/EquipmentTechnicalSpecsPage';
import Output3DDataPage from './pages/resources/Output3DDataPage';
import DemoMapsPage from './pages/resources/DemoMapsPage';
import UserGuidesPage from './pages/resources/UserGuidesPage';

// Store
import { useAuthStore } from './store/useAuthStore';

const PublicPage = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <PublicSiteLayout>
    {children}
  </PublicSiteLayout>
);

function App() {
  const checkAuth = useAuthStore(
    (state) => state.checkAuth
  );

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <HashRouter>
      <Routes>
        {/* PUBLIC WEBSITE */}
        <Route
          path="/"
          element={
            <PublicPage>
              <LandingPage />
            </PublicPage>
          }
        />

        <Route
          path="/contact-consultation"
          element={
            <PublicPage>
              <ContactConsultationPage />
            </PublicPage>
          }
        />

        {/* SOLUTIONS */}
        <Route
          path="/solutions/surveying"
          element={
            <PublicPage>
              <SurveyingSolutionPage />
            </PublicPage>
          }
        />

        <Route
          path="/solutions/construction-infrastructure"
          element={
            <PublicPage>
              <ConstructionInfrastructureSolutionPage />
            </PublicPage>
          }
        />

        <Route
          path="/solutions/agriculture"
          element={
            <PublicPage>
              <AgricultureSolutionPage />
            </PublicPage>
          }
        />

        <Route
          path="/solutions/uav-mapping-lidar"
          element={
            <PublicPage>
              <UavMappingLidarSolutionPage />
            </PublicPage>
          }
        />

        {/* PLATFORM */}
        <Route
          path="/platform/3d-gis"
          element={
            <PublicPage>
              <Platform3DGisPage />
            </PublicPage>
          }
        />

        <Route
          path="/platform/point-cloud-lidar"
          element={
            <PublicPage>
              <PointCloudLidarPage />
            </PublicPage>
          }
        />

        <Route
          path="/platform/measurement-analysis"
          element={
            <PublicPage>
              <MeasurementAnalysis3DPage />
            </PublicPage>
          }
        />

        <Route
          path="/platform/data-layer-management"
          element={
            <PublicPage>
              <DataLayerManagementPage />
            </PublicPage>
          }
        />

        <Route
          path="/platform/vn2000-coordinate-systems"
          element={
            <PublicPage>
              <CoordinateSystemsPage />
            </PublicPage>
          }
        />

        <Route
          path="/platform/project-sharing-management"
          element={
            <PublicPage>
              <ProjectSharingManagementPage />
            </PublicPage>
          }
        />

        {/* RESOURCES */}
        <Route
          path="/resources/3d-mapping-workflow"
          element={
            <PublicPage>
              <MappingWorkflowPage />
            </PublicPage>
          }
        />

        <Route
          path="/resources/equipment-specifications"
          element={
            <PublicPage>
              <EquipmentTechnicalSpecsPage />
            </PublicPage>
          }
        />

        <Route
          path="/resources/3d-output-data"
          element={
            <PublicPage>
              <Output3DDataPage />
            </PublicPage>
          }
        />

        <Route
          path="/resources/demo-maps"
          element={
            <PublicPage>
              <DemoMapsPage />
            </PublicPage>
          }
        />

        <Route
          path="/resources/user-guides"
          element={
            <PublicPage>
              <UserGuidesPage />
            </PublicPage>
          }
        />

        {/* AUTH */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        {/* DEMO FLOW */}
        <Route
          path="/book-demo"
          element={<BookDemoPage />}
        />

        {/* APPLICATION */}
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/viewer/:projectId"
          element={<ViewerPage />}
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}

export default App;