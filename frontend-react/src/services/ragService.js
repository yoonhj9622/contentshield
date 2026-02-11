import axios from 'axios';

// FastAPI 백엔드 주소 (Nginx 프록시를 위해 상대 경로 사용)
const API_URL = '';

export const ragService = {
    // 문서 로드 (벡터 DB 생성)
    loadDocuments: async (directoryPath = 'docs') => {
        try {
            const response = await axios.post(`${API_URL}/rag/load`, {
                directory_path: directoryPath
            });
            return response.data;
        } catch (error) {
            console.error('Error loading documents:', error);
            throw error;
        }
    },

    // RAG 질문하기
    chat: async (question) => {
        try {
            const response = await axios.post(`${API_URL}/rag/chat`, {
                question: question
            });
            return response.data;
        } catch (error) {
            console.error('Error querying RAG:', error);
            throw error;
        }
    },

    // 벡터 DB 초기화
    clearDatabase: async () => {
        try {
            const response = await axios.delete(`${API_URL}/rag/clear`);
            return response.data;
        } catch (error) {
            console.error('Error clearing database:', error);
            throw error;
        }
    },

    // CSV 다운로드 (블랙리스트 방식과 동일)
    exportToCSV: async (question) => {
        try {
            // 백엔드에서 JSON 데이터 가져오기
            const response = await axios.post(`${API_URL}/rag/export`, {
                question: question
            });

            console.log('Export response:', response.data);

            const data = response.data.data;

            if (!data || data.length === 0) {
                throw new Error('검색 결과가 없습니다. 다른 질문을 시도해보세요.');
            }

            console.log('Export data:', data);

            // CSV 헤더
            const headers = ['댓글내용', '작성자', '위험도', '카테고리', '분석시간'];

            // CSV 데이터 행
            const rows = data.map(item => [
                item.댓글내용 ? `"${item.댓글내용.replace(/"/g, '""')}"` : '',
                item.작성자 || '',
                item.위험도 || 0,
                item.카테고리 || '',
                item.분석시간 || ''
            ]);

            // CSV 문자열 생성 (BOM 추가로 Excel 호환)
            const csvContent = '\uFEFF' + [headers, ...rows]
                .map(row => row.map(cell =>
                    typeof cell === 'string' && (cell.includes(',') || cell.includes('\n'))
                        ? `"${cell}"`
                        : cell
                ).join(','))
                .join('\n');

            // 다운로드
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `rag_export_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            return { success: true };
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            throw error;
        }
    }
};
