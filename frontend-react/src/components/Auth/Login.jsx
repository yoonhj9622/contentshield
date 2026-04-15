import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { authService } from '../../services/authService'
import { AlertCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

 // const [email, setEmail] = useState('')
  //const [password, setPassword] = useState('')
  const [email, setEmail] = useState('web9622@gmail.com')
const [password, setPassword] = useState('w1234567')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');  // 제출할 때만 에러 초기화
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      console.log("1. 서버 응답 성공:", data);

      const userRole = data.role || 'USER';

      await setAuth(
        {
          userId: data.user_id || data.userId,
          email: data.email,
          username: data.username,
          role: userRole,
          isSuspended: data.isSuspended || false,
          suspensionReason: data.suspensionReason || '',
          suspendedAt: data.suspendedAt || '',
          isFlagged: data.isFlagged || false,
          flagReason: data.flagReason || '',
          flaggedAt: data.flaggedAt || '',
        },
        data.token
      );

      console.log("2. 상태 저장 완료, 역할:", userRole, "정지:", data.isSuspended, "주의:", data.isFlagged);

      setTimeout(() => {
        if (data.isSuspended) {
          console.log("3. 정지된 사용자 - 대시보드로 이동");
          navigate('/dashboard', { replace: true });
        } else if (userRole === 'ADMIN') {
          console.log("3. 관리자 페이지로 이동");
          navigate('/admin/dashboard', { replace: true });
        } else {
          console.log("3. 일반 유저 대시보드로 이동");
          navigate('/dashboard', { replace: true });
        }
      }, 100);

    } catch (err) {
      console.error("로그인 실패:", err);
      const errorMessage = err.response?.data?.error || '로그인에 실패했습니다. 다시 시도해주세요.';
      setError(errorMessage);
      setLoading(false);  // 🆕 여기서 loading 해제
      return;  // 🆕 여기서 종료
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow rounded-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">로그인</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* 에러 메시지 박스 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 font-medium text-sm">{error}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '로그인 중:10초 정도 소요' : '로그인'}
            </button>
          </div>
        </form>
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <span className="text-gray-500 text-sm">계정이 없으신가요? </span>
          <Link to="/signup" className="text-blue-600 hover:text-blue-500 text-sm font-semibold">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}
