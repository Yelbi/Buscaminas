@echo off
setlocal enableextensions
title GrandGames - Launcher

REM ============================================================
REM  GrandGames / Buscaminas - Lanzador de desarrollo
REM  Coloca este .bat en la raiz del proyecto (junto a la
REM  carpeta "app") o dentro de la propia carpeta "app".
REM ============================================================

REM --- Localiza la carpeta de la app (la que tiene package.json) ---
set "BASE=%~dp0"
if exist "%BASE%package.json" (
  set "APP_DIR=%BASE%"
) else if exist "%BASE%app\package.json" (
  set "APP_DIR=%BASE%app\"
) else (
  echo.
  echo  [ERROR] No se encontro package.json junto a este .bat ni en .\app
  echo  Copia este archivo a la carpeta del proyecto o a su carpeta "app".
  echo.
  pause
  exit /b 1
)

REM --- Quita la barra final para rutas limpias ---
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"

set "DEV_TITLE=GrandGames Dev"
set "CLIENT_PORT=5173"
set "SERVER_PORT=8787"
set "CLIENT_URL=http://localhost:%CLIENT_PORT%"

:menu
cls
echo ============================================================
echo    GrandGames / Buscaminas  -  Lanzador
echo ============================================================
echo    App: %APP_DIR%
echo    Cliente: %CLIENT_URL%   Servidor WS: :%SERVER_PORT%
echo ------------------------------------------------------------
echo.
echo    [1] Iniciar        (npm run dev)
echo    [2] Reiniciar      (detener + iniciar)
echo    [3] Detener        (cierra cliente y servidor)
echo    [4] Build          (npm run build)
echo    [5] Typecheck      (npm run typecheck)
echo    [6] Instalar deps  (npm install)
echo    [7] Abrir navegador (%CLIENT_URL%)
echo    [0] Salir
echo.
set "opt="
set /p "opt=Elige una opcion: "

if "%opt%"=="1" goto start
if "%opt%"=="2" goto restart
if "%opt%"=="3" goto stop
if "%opt%"=="4" goto build
if "%opt%"=="5" goto typecheck
if "%opt%"=="6" goto install
if "%opt%"=="7" goto open
if "%opt%"=="0" goto end
goto menu

:start
call :do_stop
call :ensure_deps
call :launch_dev
goto menu

:restart
echo Reiniciando...
call :do_stop
call :launch_dev
goto menu

:stop
call :do_stop
echo.
echo Servidores detenidos.
pause
goto menu

:build
call :run_npm "run build"
goto menu

:typecheck
call :run_npm "run typecheck"
goto menu

:install
call :run_npm "install"
goto menu

:open
start "" "%CLIENT_URL%"
goto menu

:end
endlocal
exit /b 0

REM ============================================================
REM  Subrutinas
REM ============================================================

:launch_dev
echo Iniciando servidor de desarrollo en una ventana nueva...
start "%DEV_TITLE%" /d "%APP_DIR%" cmd /k "npm run dev"
REM Espera breve y abre el navegador
timeout /t 4 >nul
start "" "%CLIENT_URL%"
exit /b 0

:ensure_deps
if not exist "%APP_DIR%\node_modules" (
  echo No hay dependencias instaladas. Ejecutando "npm install"...
  pushd "%APP_DIR%"
  call npm install
  popd
)
exit /b 0

:do_stop
REM 1) Cierra la ventana de dev (y sus procesos hijos) por titulo
taskkill /FI "WINDOWTITLE eq %DEV_TITLE%*" /T /F >nul 2>&1
REM 2) Mata cualquier proceso que aun retenga los puertos de dev
for %%P in (%CLIENT_PORT% %SERVER_PORT%) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /r /c:":%%P[^0-9].*LISTENING"') do (
    taskkill /PID %%A /F >nul 2>&1
  )
)
exit /b 0

:run_npm
echo.
echo Ejecutando: npm %~1
echo.
pushd "%APP_DIR%"
call npm %~1
popd
echo.
pause
exit /b 0
