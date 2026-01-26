// ==================== src/components/Auth/Login.jsx (로직 수정본) ====================
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { authService } from '../../services/authService'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   setError('')
  //   setLoading(true)

  //   try {
  //     // 1. 백엔드 서버(DB)에 로그인 요청
  //     const data = await authService.login(email, password)
  //     console.log("로그인 응답 데이터:", data); // DB에서 넘어온 값 확인용

  //     // 2. Zustand 스토어에 유저 정보와 토큰 저장
  //     // 백엔드에서 주는 필드명(role 등)이 일치하는지 확인이 필요합니다.
  //     setAuth(
  //       {
  //         userId: data.user_id || data.userId, // DB 필드명 user_id 대응
  //         email: data.email,
  //         username: data.username,
  //         role: data.role || 'USER',
  //       },
  //       data.token
  //     )

  //     // 3. 성공 시 대시보드로 이동
  //     navigate('/dashboard')
  //   } catch (err) {
  //     console.error("로그인 에러 상세:", err);
  //     setError(err.response?.data?.error || '로그인에 실패했습니다. 아이디와 비밀번호를 확인하세요.')
  //   } finally {
  //     setLoading(false)
  //   }
  // }
  // src/components/Auth/Login.jsx

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const data = await authService.login(email, password);
    console.log("1. 서버 응답 성공:", data);

    // Zustand 스토어에 데이터 저장
    await setAuth(
      {
        userId: data.user_id || data.userId,
        email: data.email,
        username: data.username,
        role: data.role || 'USER',
      },
      data.token
    );

    // 로컬 스토리지에 토큰이 저장될 시간을 아주 잠깐 벌어줍니다 (안전장치)
    console.log("2. 상태 저장 완료, 이동 준비...");
    
    setTimeout(() => {
      // replace: true를 사용하여 로그인 페이지를 히스토리에서 제거합니다.
      navigate('/dashboard', { replace: true });
      console.log("3. 대시보드로 이동 실행");
    }, 100);

  } catch (err) {
    console.error("로그인 시 실패 로그:", err);
    setError(err.response?.data?.error || '아이디 또는 비밀번호가 올바르지 않습니다.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow rounded-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">로그인 (DB 연동 테스트)</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center font-bold">{error}</div>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소 (admin@snsanalyzer.com)"
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
              {loading ? '연결 중...' : '로그인 시도'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}