import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-lg font-bold tracking-tight text-zinc-900">SYNORA</p>
        <p className="text-xs text-zinc-500 mt-1">Loading workspace...</p>
      </div>
    </div>
  );
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, authReady, profile, profileLoading } = useAuth();

  if (!authReady || (user && profileLoading)) {
    return <FullScreenLoader />;
  }

  if (user) {
    if (profile && !profile.profileCompleted) {
      return <Navigate to="/profile-setup" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function PrivateRoute({
  children,
  requireCompletedProfile = true,
}: {
  children: React.ReactNode;
  requireCompletedProfile?: boolean;
}) {
  const { user, authReady, profile, profileLoading } = useAuth();
  const location = useLocation();

  if (!authReady || (user && profileLoading)) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireCompletedProfile && profile && !profile.profileCompleted) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, authReady, isAdmin, adminChecked } = useAuth();

  if (!authReady || (user && !adminChecked)) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-xl p-8 text-center">
          <h1 className="font-display text-xl font-semibold text-zinc-900 mb-2">
            Restricted Area
          </h1>
          <p className="text-sm text-zinc-600 mb-6">
            Administrator authorization is required to access scholarship verification and catalog management controls.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function RootRedirect() {
  const { user, authReady, profile, profileLoading } = useAuth();

  if (!authReady || (user && profileLoading)) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile && !profile.profileCompleted) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
