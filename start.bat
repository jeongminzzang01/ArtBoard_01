@echo off
echo ArtBoard 서버를 시작합니다...
echo.

:: 데이터 디렉토리가 없으면 마이그레이션 실행
if not exist "server\data\teams.json" (
    echo 초기 데이터 마이그레이션 실행 중...
    node server\migrate.js
    echo.
)

:: 빌드가 없으면 빌드 실행
if not exist "public\index.html" (
    echo 프론트엔드 빌드 중...
    bash rebuild.sh
    echo.
)

:: 서버 실행
echo 서버 시작 중...
node server\server.js
pause
