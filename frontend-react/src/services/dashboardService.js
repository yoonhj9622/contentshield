/** [File: dashboardService.js / Date: 2026-01-22 / 설명: 백엔드 API와의 통신을 위한 대시보드 데이터 서비스 구현] */
import api from './api';

const dashboardService = {
    getStats: async () => {
        const response = await api.get('dashboard/stats');
        return response.data;
    },
    analyzeVideo: async (url, limit = 20) => {
        const response = await api.post('analysis/video', { url, limit });
        return response.data;
    }
};

export default dashboardService;
