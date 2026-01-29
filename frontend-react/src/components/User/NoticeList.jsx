// ==================== NoticeList.jsx ====================
// 위치: frontend/src/components/User/NoticeList.jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Pin, Calendar, Eye, ChevronRight, Filter } from 'lucide-react';
import { noticeService } from '../../services/noticeService';

// 다크모드 UI 컴포넌트
const Card = ({ children, className = "" }) => (
    <div className={`bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-xl ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = "" }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = "" }) => <h3 className={`text-xl font-bold tracking-tight text-white ${className}`}>{children}</h3>;
const CardContent = ({ children, className = "" }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

export default function NoticeList() {
    const [selectedType, setSelectedType] = useState('ALL');
    const [expandedNotice, setExpandedNotice] = useState(null);

    // 공지사항 목록 조회
    const { data: notices, isLoading } = useQuery({
        queryKey: ['notices'],
        queryFn: noticeService.getAll,
    });

    // 타입별 필터링
    const filteredNotices = notices?.filter(notice =>
        selectedType === 'ALL' || notice.noticeType === selectedType
    ) || [];

    // 고정 공지 우선 + 최신순 정렬
    const sortedNotices = [...filteredNotices].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const handleNoticeClick = (noticeId) => {
        // 공지 클릭 시 상세 보기 토글
        setExpandedNotice(expandedNotice === noticeId ? null : noticeId);

        // 조회수 증가 (선택사항)
        // noticeService.getById(noticeId);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-500 animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <div className="max-w-5xl mx-auto">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                        <Bell className="text-blue-400" />
                        공지사항
                    </h1>
                    <p className="text-slate-500">중요한 소식과 업데이트를 확인하세요.</p>
                </div>

                {/* 필터 */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Filter className="text-slate-500" size={18} />
                            <span className="text-sm text-slate-400 mr-3">필터:</span>
                            <div className="flex gap-2 flex-wrap">
                                {['ALL', 'GENERAL', 'MAINTENANCE', 'UPDATE', 'URGENT'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedType(type)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedType === type
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        {type === 'ALL' ? '전체' : getTypeLabel(type)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 공지사항 목록 */}
                <div className="space-y-3">
                    {sortedNotices.length > 0 ? (
                        sortedNotices.map((notice) => (
                            <Card key={notice.noticeId} className="overflow-hidden">
                                <div
                                    onClick={() => handleNoticeClick(notice.noticeId)}
                                    className="p-6 cursor-pointer hover:bg-slate-800/50 transition-all group"
                                >
                                    {/* 요약 정보 */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {notice.isPinned && (
                                                    <Pin size={18} className="text-blue-400 fill-blue-400/20" />
                                                )}
                                                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                                                    {notice.title}
                                                </h3>
                                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded ${getNoticeTypeStyle(notice.noticeType)}`}>
                                                    {getTypeLabel(notice.noticeType)}
                                                </span>
                                            </div>

                                            {/* 메타 정보 */}
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Eye size={14} />
                                                    조회 {notice.viewCount}
                                                </span>
                                            </div>

                                            {/* 미리보기 (축약 시) */}
                                            {expandedNotice !== notice.noticeId && (
                                                <p className="mt-3 text-sm text-slate-400 line-clamp-2">
                                                    {notice.content}
                                                </p>
                                            )}
                                        </div>

                                        {/* 펼치기 아이콘 */}
                                        <ChevronRight
                                            size={20}
                                            className={`text-slate-600 transition-transform flex-shrink-0 ml-4 ${expandedNotice === notice.noticeId ? 'rotate-90' : ''
                                                }`}
                                        />
                                    </div>

                                    {/* 상세 내용 (펼쳤을 때) */}
                                    {expandedNotice === notice.noticeId && (
                                        <div className="mt-4 pt-4 border-t border-slate-800">
                                            <div className="prose prose-invert prose-sm max-w-none">
                                                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                    {notice.content}
                                                </p>
                                            </div>
                                            {notice.updatedAt && (
                                                <p className="mt-4 text-xs text-slate-600">
                                                    최종 수정: {new Date(notice.updatedAt).toLocaleString('ko-KR')}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Bell className="mx-auto mb-4 text-slate-700" size={48} />
                                <p className="text-slate-500">등록된 공지사항이 없습니다.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

// 타입별 라벨
function getTypeLabel(type) {
    const labels = {
        GENERAL: '일반',
        MAINTENANCE: '점검',
        UPDATE: '업데이트',
        URGENT: '긴급'
    };
    return labels[type] || type;
}

// 타입별 스타일
function getNoticeTypeStyle(type) {
    const styles = {
        GENERAL: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        MAINTENANCE: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
        UPDATE: 'bg-green-500/10 text-green-400 border border-green-500/20',
        URGENT: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
    };
    return styles[type] || styles.GENERAL;
}