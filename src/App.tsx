import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import {
  AdminRoute,
  PrivateRoute,
  PublicOnlyRoute,
  RootRedirect,
} from './components/RouteGuards.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ExamDirectoryPage } from './pages/ExamDirectoryPage.tsx';
import { ExplorerPage } from './pages/ExplorerPage.tsx';
import { FindForMePage } from './pages/FindForMePage.tsx';
import { GlobalScholarshipsPage } from './pages/GlobalScholarshipsPage.tsx';
import { GuidePage } from './pages/GuidePage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { ProfileSetupPage } from './pages/ProfileSetupPage.tsx';
import { SavedScholarshipsPage } from './pages/SavedScholarshipsPage.tsx';
import { ScholarshipDetailsPage } from './pages/ScholarshipDetailsPage.tsx';
import { TrackerPage } from './pages/TrackerPage.tsx';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <AuthPage mode="login" />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <AuthPage mode="signup" />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/profile-setup"
              element={
                <PrivateRoute requireCompletedProfile={false}>
                  <ProfileSetupPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute requireCompletedProfile={false}>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute requireCompletedProfile={false}>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/find-for-me"
              element={
                <PrivateRoute requireCompletedProfile={false}>
                  <FindForMePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/global-scholarships"
              element={
                <PrivateRoute requireCompletedProfile={false}>
                  <GlobalScholarshipsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/exam-directory"
              element={
                <PrivateRoute requireCompletedProfile={false}>
                  <ExamDirectoryPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/explorer"
              element={
                <PrivateRoute requireCompletedProfile={false}>
                  <ExplorerPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <PrivateRoute requireCompletedProfile={false}>
                  <SavedScholarshipsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/tracker"
              element={
                <PrivateRoute requireCompletedProfile={false}>
                  <TrackerPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/guide"
              element={
                <PrivateRoute requireCompletedProfile={false}>
                  <GuidePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/scholarships/:id"
              element={
                <PrivateRoute requireCompletedProfile={false}>
                  <ScholarshipDetailsPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
