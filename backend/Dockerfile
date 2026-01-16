FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

COPY . .

# ✅ Windows → Linux 줄바꿈 + 실행권한 문제 해결
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew

# ✅ (핵심) 도커(리눅스)에서는 윈도우 전용 Java 경로 설정이 있으면 무조건 깨짐 → 삭제
RUN sed -i '/org\.gradle\.java\.home/d' gradle.properties || true

# ✅ 우선 테스트 제외하고 jar 생성
RUN ./gradlew clean bootJar -x test

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
