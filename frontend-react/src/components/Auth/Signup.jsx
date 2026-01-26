// [File: Signup.jsx / Date: 2026-01-22 / 작성자: Antigravity / 설명: 회원가입 화면 - 이용약관 및 개인정보 처리방침 동의 기능 추가]
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
    password: '',
    termsAgreed: false,
    privacyAgreed: false
  });

  const [activeModal, setActiveModal] = useState(null); // 'terms' or 'privacy'

  // 4. 입력값이 바뀔 때 호출되는 함수
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 5. 가입 버튼 클릭 시 실행될 함수
  const handleSubmit = async (e) => {
    e.preventDefault(); // 페이지 새로고침 방지
    console.log("가입 시도 데이터:", formData);

    if (!formData.termsAgreed || !formData.privacyAgreed) {
      alert("이용약관 및 개인정보 처리방침에 모두 동의해야 합니다.");
      return;
    }

    try {
      const response = await authService.signup(
        formData.email,
        formData.password,
        formData.username,
        {
          termsAgreed: formData.termsAgreed,
          privacyAgreed: formData.privacyAgreed,
          version: 'v1.0'
        }
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

            {/* 이용약관 및 개인정보 동의 */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between group">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="termsAgreed"
                    checked={formData.termsAgreed}
                    onChange={handleChange}
                    className="w-5 h-5 rounded-md bg-slate-950 border-slate-800 text-blue-500 focus:ring-blue-500/50 transition-all cursor-pointer"
                    required
                  />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">[필수] 서비스 이용약관 동의</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  className="text-xs text-slate-600 hover:text-blue-400 underline transition-colors"
                >
                  보기
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="privacyAgreed"
                    checked={formData.privacyAgreed}
                    onChange={handleChange}
                    className="w-5 h-5 rounded-md bg-slate-950 border-slate-800 text-blue-500 focus:ring-blue-500/50 transition-all cursor-pointer"
                    required
                  />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">[필수] 개인정보 처리방침 동의</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  className="text-xs text-slate-600 hover:text-blue-400 underline transition-colors"
                >
                  보기
                </button>
              </div>
            </div>

            {/* 7. type을 submit으로 변경 */}
            <button type="submit" className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-4 rounded-xl transition-all mt-4">
              계정 생성하기
            </button>
          </form>
        </div>
      </div>

      {/* 모달 스타일 약관 보기 */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {activeModal === 'terms' ? '서비스 이용약관' : '개인정보 처리방침'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                닫기
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-slate-400 text-sm leading-relaxed space-y-4">
              {activeModal === 'terms' ? (
                <>
                  <h4 className="font-bold text-slate-200">제1조 (목적)</h4>
                  <p>본 약관은 AI TEAM 4(이하 '팀')가 제공하는 'ContentShield' 서비스(이하 '서비스')의 이용 조건 및 절차, 사용자와 팀 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.</p>

                  <h4 className="font-bold text-slate-200">제2조 (서비스의 내용)</h4>
                  <p>1. 'ContentShield'는 사용자가 SNS 콘텐츠 게시 전 위험 요소를 실시간 감지하고 안전한 표현을 제안받는 사전 예방형 AI 코파일럿 솔루션입니다.</p>
                  <p>2. 주요 서비스로는 유해성 분석(Toxicity Analysis), 문장 순화 제안(Rewriting), 관리자 대시보드 등이 있습니다.</p>

                  <h4 className="font-bold text-slate-200">제3조 (이용 제한 및 보안)</h4>
                  <p>1. 서비스는 회원가입 및 로그인 후 이용 가능하며, 모든 계정 정보는 본인이 관리해야 합니다.</p>
                  <p>2. 보안 정책에 따라 로그인 5회 실패 시 해당 계정은 10분간 잠금 처리될 수 있습니다.</p>
                  <p>3. 혐오 표현, 허위 사실 유포 등 콘텐츠 정책을 반복적으로 위반하는 경우 서비스 이용이 제한될 수 있습니다.</p>

                  <h4 className="font-bold text-slate-200">제4조 (AI 결과물의 한계 및 책임)</h4>
                  <p>1. 본 서비스가 제공하는 분석 결과 및 수정 제안은 AI 모델(Llama-Guard, Llama-3.1)의 추론에 기반하며, 100%의 정확성을 보장하지 않습니다.</p>
                  <p>2. 최종 게시물에 대한 작성 및 게시 여부의 결정권은 사용자에게 있으며, 게시물로 인해 발생하는 법적 책임은 사용자 본인에게 있습니다.</p>
                </>
              ) : (
                <>
                  <h4 className="font-bold text-slate-200">1. 개인정보 수집 항목</h4>
                  <p>서비스는 회원가입 및 원활한 서비스 제공을 위해 아래와 같은 최소한의 정보를 수집합니다.</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>필수 항목: 이메일(아이디), 비밀번호</li>
                    <li>서비스 이용 과정 생성 정보: SNS 채널 연동 정보(API Token), 분석 로그, 활동 이력</li>
                  </ul>

                  <h4 className="font-bold text-slate-200">2. 개인정보의 수집 및 이용 목적</h4>
                  <p>수집된 정보는 다음의 목적으로만 활용됩니다.</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>사용자 식별 및 회원 관리</li>
                    <li>AI를 통한 콘텐츠 위험도 분석 및 맞춤형 리라이팅 서비스 제공</li>
                    <li>관리자 대시보드를 통한 통계 분석 및 서비스 개선</li>
                  </ul>

                  <h4 className="font-bold text-slate-200">3. 개인정보의 저장 및 보안</h4>
                  <p>비밀번호 등 민감 정보는 BCrypt 해싱 또는 AES-256 방식으로 암호화하여 저장됩니다. 모든 데이터 접근 및 변경 이력은 감사 로그(Audit Log)에 기록되어 보안 사고 예방을 위해 관리됩니다.</p>

                  <h4 className="font-bold text-slate-200">4. 개인정보의 보유 및 파기 정책</h4>
                  <p>사용자가 서비스 탈퇴를 요청하거나 수집 목적이 달성된 경우 해당 정보를 즉시 파기합니다. 사용자의 삭제 요청 데이터는 최대 30일 이내에 영구 삭제 처리됩니다.</p>

                  <h4 className="font-bold text-slate-200">5. 사용자의 권리</h4>
                  <p>사용자는 언제든지 본인의 개인정보를 조회, 수정하거나 서비스 탈퇴를 통해 개인정보 이용 동의를 처회할 권리가 있습니다.</p>
                </>
              )}
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-6 py-2 bg-slate-100 hover:bg-white text-slate-950 font-bold rounded-xl transition-all"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}