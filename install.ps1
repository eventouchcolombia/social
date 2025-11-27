# Eliminar node_modules y package-lock.json si existen
Write-Host "Limpiando instalación anterior..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

# Limpiar caché de npm
Write-Host "Limpiando caché de npm..." -ForegroundColor Yellow
npm cache clean --force

# Crear archivo .npmrc si no existe
Write-Host "Configurando npm para instalar dependencias opcionales..." -ForegroundColor Cyan
if (-not (Test-Path ".npmrc")) {
    "optional=true" | Out-File -FilePath ".npmrc" -Encoding utf8
}

# Instalar dependencias con --include=optional
Write-Host "Instalando dependencias con opcionales incluidos..." -ForegroundColor Green
npm install --include=optional

# Verificar y reinstalar rollup si es necesario
Write-Host "Verificando instalación de rollup..." -ForegroundColor Cyan
$rollupPath = "node_modules\@rollup\rollup-win32-x64-msvc"
if (-not (Test-Path $rollupPath)) {
    Write-Host "Rollup no encontrado, instalando explícitamente..." -ForegroundColor Yellow
    npm install @rollup/rollup-win32-x64-msvc@4.22.4
    
    # Verificar de nuevo
    if (Test-Path $rollupPath) {
        Write-Host "Rollup instalado correctamente en segundo intento" -ForegroundColor Green
    } else {
        Write-Host "ERROR: No se pudo instalar rollup. Verifica tu conexión a internet." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Rollup para Windows instalado correctamente" -ForegroundColor Green
}

Write-Host ""
Write-Host "Instalación completada!" -ForegroundColor Green
Write-Host "Ejecuta 'npm run dev' para iniciar el proyecto" -ForegroundColor Cyan
