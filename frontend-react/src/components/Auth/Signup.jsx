import React, { useState } from 'react'; // 1. useState 추가
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Mail, Lock, ArrowLeft } from 'lucide-react';

import { authService } from '../../services/authService';

export default function Signup() {
  const navigate = useNavigate();
  
  // 3. 입력값을 저장할 상태 변수 생성
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  // 4. 입력값이 바뀔 때 호출되는 함수
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 5. 가입 버튼 클릭 시 실행될 함수
  const handleSubmit = async (e) => {
    e.preventDefault(); // 페이지 새로고침 방지
    console.log("가입 시도 데이터:", formData);

    try {
      const response = await authService.signup(
        formData.email,
        formData.password,
        formData.username
      );
      console.log("가입 성공!", response);
      alert("회원가입에 성공했습니다! 로그인해 주세요.");
      navigate('/login'); // 성공 시 로그인 페이지로 이동
    } catch (err) {
      console.error("가입 에러 상세:", err.response?.data || err.message);
      alert("가입 실패: " + (err.response?.data?.message || "서버 에러가 발생했습니다."));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-6 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 로그인으로 돌아가기
        </Link>
        
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white">시작하기</h2>
            <p className="text-slate-500 text-sm mt-1">Guard AI와 함께 깨끗한 커뮤니티를 만드세요.</p>
          </div>

          {/* 6. onSubmit 연결 */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 ml-1">이름</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 text-slate-600" size={20} />
                <input 
                  name="username" // name 속성 추가
                  value={formData.username} // 상태값 연결
                  onChange={handleChange} // 변경 핸들러 연결
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-11 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
                  placeholder="홍길동" 
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 ml-1">이메일</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-slate-600" size={20} />
                <input 
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-11 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
                  placeholder="name@example.com" 
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 ml-1">비밀번호</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-slate-600" size={20} />
                <input 
                  name="password"
                  type="password" 
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-11 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
                  placeholder="8자리 이상 입력" 
                  required
                />
              </div>
            </div>

            {/* 7. type을 submit으로 변경 */}
            <button type="submit" className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-4 rounded-xl transition-all mt-4">
              계정 생성하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}