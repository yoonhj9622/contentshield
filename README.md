# ContentShield
ai를 활용한 유튜브 댓글 필터링 서비스 

26.01.16 프로젝트 현황 및 도커 실행 방법 정리(실행 방법)

ContentShield Backend – 로컬 & Docker 배포 정리 (팀 공유용)
1️⃣ 현재 상태 요약 (결론)

✅ Spring Boot 백엔드 서버 정상 실행

✅ Docker + Docker Compose 기반으로 MariaDB 포함 전체 인프라 기동 성공

✅ /health API 외부(브라우저/로컬) 접근 정상

✅ 컨테이너 내부/외부 네트워크 분리 및 연동 정상

✅ 팀원이 동일 환경에서 그대로 재현 가능

2️⃣ 프로젝트 구조 (중요)

ContentShield/
├─ backend/                # Spring Boot 백엔드
│  ├─ Dockerfile
│  ├─ build.gradle
│  └─ src/main/java/com/contentshield/backend
│     └─ HealthController.java
│
├─ infra/                  # 인프라(Docker Compose)
│  ├─ docker-compose.yml
│  └─ mariadb/
│
├─ .env                    # 공통 환경 변수 (중요!)
├─ .env.example            # 환경 변수 템플릿
└─ README.md

3️⃣ 정상 응답 확인
curl http://localhost:8080/health
# → ok

curl http://localhost:8080/hello
# → hello contentshield

4️⃣ Docker Compose 구성 핵심 요약
🔹 MariaDB

컨테이너 이름: contentshield-db

포트: 3306

healthcheck 포함 → backend는 DB가 살아있을 때만 기동

🔹 Backend

컨테이너 이름: contentshield-backend

포트: 8080

env_file: .env 사용

DB 주소는 localhost가 아니라 서비스명(db) 사용

5️⃣ .env 파일 (필수)

📍 위치: ContentShield/.env

DB_NAME=contentshield
DB_USER=root
DB_PASSWORD=1234
DB_ROOT_PASSWORD=root1234

6️⃣ 실행 방법 (팀원 기준 그대로 따라 하면 됨)

① infra 폴더로 이동
cd infra

② 전체 초기화 (권장)
docker compose down -v

③ 캐시 없이 빌드
docker compose build --no-cache

④ 기동
docker compose up -d

⑤ 상태 확인
docker ps


정상 상태:

contentshield-db        Up (healthy)
contentshield-backend   Up

7️⃣ 현재 아키텍처 흐름
[Browser / curl]
↓
localhost:8080
↓
[Docker: contentshield-backend]
↓
[Docker Network]
↓
[Docker: contentshield-db (MariaDB)]


✔ 컨테이너 내부에서는 DB_HOST=db
✔ 외부 접근은 localhost:8080

✅ 결론 한 줄 요약

ContentShield 백엔드는 Docker 기반으로 완전한 로컬 배포 환경이 구축되었고,
팀원 누구든 .env만 맞추면 동일하게 실행 가능하다.

깃