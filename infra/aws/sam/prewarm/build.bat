@echo off
REM Build script for prewarm Lambda using esbuild
REM Run from repo root: infra\aws\sam\prewarm\build.bat

echo Building prewarm Lambda for deployment...
echo.

echo [1/3] Generating Prisma Client...
cd apps\api
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed
    exit /b %errorlevel%
)
cd ..\..

echo.
echo [2/3] Creating Lambda package directory...
set BUILD_DIR=.aws-sam\build-prewarm\PrewarmFunction
if exist %BUILD_DIR% rmdir /s /q %BUILD_DIR%
mkdir %BUILD_DIR%\node_modules 2>nul

echo.
echo [3/3] Bundling with esbuild...
call npx esbuild apps/api/src/jobs/prewarm.lambda.ts ^
  --bundle ^
  --platform=node ^
  --format=esm ^
  --target=node22 ^
  --outfile=%BUILD_DIR%\index.js ^
  --external:@aws-sdk/* ^
  --external:@prisma/client ^
  --external:.prisma/* ^
  --log-level=info
if %errorlevel% neq 0 (
    echo ERROR: esbuild failed
    exit /b %errorlevel%
)

REM Prisma cannot be bundled — copy generated client and Linux binary separately
echo Copying Prisma client...
xcopy /E /I /Q node_modules\@prisma %BUILD_DIR%\node_modules\@prisma >nul
xcopy /E /I /Q node_modules\.prisma %BUILD_DIR%\node_modules\.prisma >nul

REM "type": "module" required for ESM
(
echo {
echo   "name": "pantrypal-prewarm",
echo   "version": "1.0.0",
echo   "type": "module"
echo }
) > %BUILD_DIR%\package.json

echo.
echo ============================================================
echo  Build complete! Package ready at: %BUILD_DIR%
echo.
echo  index.js size (should be a few hundred KB, not 70MB):
for %%F in (%BUILD_DIR%\index.js) do echo  %%~zF bytes
echo ============================================================
echo.
echo Next: run deploy
echo.
echo   aws cloudformation package ^
echo     --template-file infra\aws\sam\template.prewarm-simple.yaml ^
echo     --s3-bucket YOUR_SAM_BUCKET ^
echo     --output-template-file .aws-sam\packaged.yaml
echo.
echo   aws cloudformation deploy ^
echo     --template-file .aws-sam\packaged.yaml ^
echo     --stack-name pantrypal-prewarm ^
echo     --capabilities CAPABILITY_NAMED_IAM ^
echo     --region us-east-2 ^
echo     --parameter-overrides file://infra/aws/sam/prewarm-params.json
echo.
