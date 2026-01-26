import api from './api';

export const commentService = {
    // 유튜브 댓글 크롤링 및 분석 요청
    crawlAndAnalyze: async (url) => {
        try {
            const response = await api.post('/comments/crawl', { url });
            return response.data;
        } catch (error) {
            console.error('Error crawling comments:', error);
            throw error;
        }
    },

    // 댓글 목록 조회
    getComments: async (url) => {
        try {
            const params = url ? { url } : {};
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
    }
};
