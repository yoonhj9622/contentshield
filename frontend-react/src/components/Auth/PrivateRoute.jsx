import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { user, isAdmin } = useAuthStore();
  const location = useLocation();

  // ==========================================================
  // [개발 모드] true로 설정 시 로그인 없이 모든 페이지 접근 가능
  // 개발이 완료되면 아래 변수를 false로 바꾸거나, 
  // 하단의 [운영 모드] 주석을 해제하고 이 부분을 지우세요.
  // ==========================================================
  const IS_DEV_MODE = true;

  if (IS_DEV_MODE) {
    return children;
  }

  // ==========================================================
  // [운영 모드] 실제 서비스 배포 시 적용될 로직
  // ==========================================================
  /* // 1. 로그인 여부 확인 (Zustand 상태 및 로컬 스토리지 체크)
  const storageData = localStorage.getItem('auth-storage');
  if (!user && !storageData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. 관리자 권한 확인
  if (requireAdmin && user && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  */

  return children;
};

export default PrivateRoute;