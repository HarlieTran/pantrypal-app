@echo off
echo Building PantryPal Recipe Seed Lambda...

echo [1/3] Generating Prisma Client...
cd apps\api
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed
    exit /b %errorlevel%
)
cd ..\..

echo [2/3] Creating Lambda package directory...
set BUILD_DIR=.aws-sam\build-recipe-seed\RecipeSeedFunction
if exist %BUILD_DIR% rmdir /s /q %BUILD_DIR%
mkdir %BUILD_DIR%\node_modules 2>nul

echo [3/3] Bundling with esbuild...
call npx esbuild apps/api/src/jobs/recipe-seed.lambda.ts ^
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

echo Copying Prisma client...
xcopy /E /I /Q node_modules\@prisma %BUILD_DIR%\node_modules\@prisma >nul
xcopy /E /I /Q node_modules\.prisma %BUILD_DIR%\node_modules\.prisma >nul

(
echo {
echo   "name": "pantrypal-recipe-seed",
echo   "version": "1.0.0",
echo   "type": "module"
echo }
) > %BUILD_DIR%\package.json

echo Build complete: %BUILD_DIR%