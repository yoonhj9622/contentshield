import api from './api';

export const commentService = {
    // 유튜브 댓글 크롤링 및 분석 요청
    crawlAndAnalyze: async (url, startDate, endDate) => {
        try {
            const response = await api.post('/comments/crawl', { url, startDate, endDate });
            return response.data;
        } catch (error) {
            console.error('Error crawling comments:', error);
            throw error;
        }
    },

    // 댓글 목록 조회
    getComments: async (url, startDate, endDate, status, page = 0, size = 20) => {
        try {
            const params = {};
            if (url) params.url = url;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (status && status !== 'all') params.status = status;
            params.page = page;
            params.size = size;

            const response = await api.get('/comments', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    },

    // 댓글 삭제
    deleteComment: async (commentId) => {
        try {
            const response = await api.delete(`/comments/${commentId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    },

    // 댓글 다중 삭제
    deleteComments: async (commentIds) => {
        try {
            const response = await api.post('/comments/delete-batch', commentIds);
            return response.data;
        } catch (error) {
            console.error('Error deleting comments batch:', error);
            throw error;
        }
    },

    // 댓글 전체 삭제 (필터링된 URL 기준)
    deleteAllComments: async (url) => {
        try {
            const params = {};
            if (url) params.url = url;
            const response = await api.delete('/comments/delete-all', { params });
            return response.data;
        } catch (error) {
            console.error('Error deleting all comments:', error);
            throw error;
        }
    }
};
