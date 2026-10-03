<#
.SYNOPSIS
    Script unificado de inicializacao e execucao do CANAMED (Backend, Frontend e Banco de Dados).

.DESCRIPTION
    Verifica os pre-requisitos locais, garante que o PostgreSQL esteja em execucao,
    aplica as migrations do EF Core no banco de desenvolvimento, instala dependencias
    se necessario e inicia o Backend ASP.NET Core e o Frontend Vite/React simultaneamente.

.PARAMETER NoBrowser
    Nao abre automaticamente o navegador no frontend.

.PARAMETER SkipMigrations
    Pula a execucao de 'dotnet ef database update'.

.PARAMETER PortFrontend
    Porta para o Vite rodar (padrao: 5173).

.PARAMETER PortBackend
    Porta para a API ASP.NET Core (padrao: 5080).

.EXAMPLE
    .\start-canamed.ps1
    .\start-canamed.ps1 -NoBrowser
#>

[CmdletBinding()]
param(
    [switch]$NoBrowser,
    [switch]$SkipMigrations,
    [int]$PortFrontend = 5173,
    [int]$PortBackend = 5080
)

$ErrorActionPreference = "Stop"

# Garante que o diretorio de execucao seja a raiz do repositorio
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoRoot

function Write-BrandHeader {
    param([switch]$Clear)
    if ($Clear) {
        try { Clear-Host } catch {}
    }
    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor Cyan
    Write-Host "    C A N A M E D  -  Plataforma de Gestao Clinica Integrada" -ForegroundColor Green
    Write-Host "    'Eficiencia Para Quem Mais Precisa'" -ForegroundColor DarkCyan
    Write-Host "  ================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "  [INFO] $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "  [OK]   $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "  [ERRO] $Message" -ForegroundColor Red
}

Write-BrandHeader

# 1. Verificacao de Pre-requisitos
Write-Step "Verificando pre-requisitos do ambiente..."

# .NET SDK
try {
    $dotnetVer = (dotnet --version).Trim()
    Write-Success ".NET SDK detectado: $dotnetVer"
} catch {
    Write-ErrorMsg ".NET SDK nao encontrado no PATH. Instale o .NET 10 SDK antes de continuar."
    exit 1
}

# Node.js e npm
try {
    $nodeVer = (node --version).Trim()
    $npmVer = (npm --version).Trim()
    Write-Success "Node.js $nodeVer / npm $npmVer detectados"
} catch {
    Write-ErrorMsg "Node.js ou npm nao encontrados no PATH. Instale o Node 20+ LTS antes de continuar."
    exit 1
}

# Arquivo .env
if (-not (Test-Path "$RepoRoot\.env")) {
    Write-Step "Arquivo .env nao encontrado. Copiando a partir de .env.example..."
    Copy-Item "$RepoRoot\.env.example" "$RepoRoot\.env"
    Write-Success "Arquivo .env criado com sucesso."
} else {
    Write-Success "Arquivo .env configurado."
}

# Carrega as variaveis do .env para a sessao do processo
Write-Step "Carregando variaveis de ambiente locais..."
Get-Content "$RepoRoot\.env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line -split "=", 2
        if ($parts.Length -eq 2) {
            $varName = $parts[0].Trim()
            $varVal = $parts[1].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($varName, $varVal, "Process")
        }
    }
}
$env:ASPNETCORE_ENVIRONMENT = "Development"

# 2. Verificacao e Inicializacao do PostgreSQL
Write-Step "Verificando conectividade com o PostgreSQL (127.0.0.1:5432)..."

$pgRunning = $false
try {
    $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
    $pgRunning = $tcp.TcpTestSucceeded
} catch {
    $pgRunning = $false
}

$pgStartedByScript = $false

if (-not $pgRunning) {
    Write-Step "PostgreSQL nao esta ouvindo na porta 5432. Tentando iniciar instancia local..."
    
    $portablePgPath = "D:\Tools\PostgreSQL\18.6\pgsql\bin\pg_ctl.exe"
    $portableDataDir = "D:\Tools\PostgreSQL\data"

    if (Test-Path $portablePgPath -and (Test-Path $portableDataDir)) {
        & $portablePgPath -D $portableDataDir start
        $pgStartedByScript = $true
        Start-Sleep -Seconds 2

        # Aguarda estar pronto
        $isReadyTool = "D:\Tools\PostgreSQL\18.6\pgsql\bin\pg_isready.exe"
        $attempts = 0
        while ($attempts -lt 10) {
            if (Test-Path $isReadyTool) {
                & $isReadyTool -h 127.0.0.1 -p 5432 *>$null
                if ($LASTEXITCODE -eq 0) {
                    $pgRunning = $true
                    break
                }
            } else {
                $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
                if ($tcp.TcpTestSucceeded) {
                    $pgRunning = $true
                    break
                }
            }
            $attempts++
            Start-Sleep -Seconds 1
        }
    }
}

if ($pgRunning) {
    Write-Success "PostgreSQL ativo e aceitando conexoes na porta 5432."
} else {
    Write-ErrorMsg "Nao foi possivel conectar ao PostgreSQL na porta 5432."
    Write-Host "       Certifique-se de que o PostgreSQL esteja em execucao ou configure a porta no .env." -ForegroundColor Yellow
    exit 1
}

# 3. Migrations do Banco de Dados
if (-not $SkipMigrations) {
    Write-Step "Verificando e aplicando migrations no banco de desenvolvimento (EF Core)..."
    try {
        dotnet ef database update `
            --project "$RepoRoot\backend\src\Canamed.Infrastructure" `
            --startup-project "$RepoRoot\backend\src\Canamed.Api" `
            --no-build `
            *>$null
        Write-Success "Migrations do banco de dados atualizadas."
    } catch {
        try {
            dotnet ef database update `
                --project "$RepoRoot\backend\src\Canamed.Infrastructure" `
                --startup-project "$RepoRoot\backend\src\Canamed.Api" `
                *>$null
            Write-Success "Migrations do banco de dados atualizadas."
        } catch {
            Write-ErrorMsg "Aviso: Falha ao aplicar migrations do EF Core. Verifique logs do banco."
        }
    }
}

# 4. Dependencias do Frontend
if (-not (Test-Path "$RepoRoot\frontend\node_modules")) {
    Write-Step "Instalando dependencias do frontend (npm install)..."
    npm --prefix "$RepoRoot\frontend" install
    Write-Success "Dependencias do frontend instaladas."
}

# 5. Inicializacao dos Processos (Backend e Frontend)
Write-Step "Iniciando servicos da aplicacao..."

# Configura URLs das variaveis de ambiente para a sessao
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://localhost:$PortBackend"
$env:VITE_API_BASE_URL = "http://localhost:$PortBackend/api/v1"

# Inicia o Backend em segundo plano
$backendLog = "$RepoRoot\backend.log"
$backendProc = Start-Process `
    -FilePath "dotnet" `
    -ArgumentList "run --project `"$RepoRoot\backend\src\Canamed.Api`" --launch-profile http" `
    -WorkingDirectory "$RepoRoot\backend\src\Canamed.Api" `
    -RedirectStandardOutput $backendLog `
    -RedirectStandardError "$RepoRoot\backend.err.log" `
    -PassThru

# Inicia o Frontend em segundo plano
$frontendLog = "$RepoRoot\frontend.log"
$frontendProc = Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev -- --port $PortFrontend" `
    -WorkingDirectory "$RepoRoot\frontend" `
    -RedirectStandardOutput $frontendLog `
    -RedirectStandardError "$RepoRoot\frontend.err.log" `
    -PassThru

# Aguarda inicializacao dos servicos (ate 25 segundos)
Write-Step "Aguardando servicos ficarem online..."
$backendReady = $false
$frontendReady = $false
$timeout = 25
$elapsed = 0

while ($elapsed -lt $timeout) {
    if (-not $backendReady) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:$PortBackend/api/v1/health/live" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($resp.StatusCode -eq 200) { $backendReady = $true }
        } catch {}
    }

    if (-not $frontendReady) {
        try {
            $resp2 = Invoke-WebRequest -Uri "http://localhost:$PortFrontend" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($resp2.StatusCode -eq 200) { $frontendReady = $true }
        } catch {}
    }

    if ($backendReady -and $frontendReady) { break }

    # Verifica se algum processo morreu prematuramente
    if ($backendProc.HasExited) {
        Write-ErrorMsg "Backend encerrou inesperadamente com codigo de saida $($backendProc.ExitCode)."
        if (Test-Path "$RepoRoot\backend.err.log") {
            $errContent = (Get-Content "$RepoRoot\backend.err.log" -Raw).Trim()
            if ($errContent) {
                Write-Host "       Detalhes do erro:" -ForegroundColor Red
                Write-Host $errContent -ForegroundColor Red
            }
        }
        break
    }
    if ($frontendProc.HasExited) {
        Write-ErrorMsg "Frontend encerrou inesperadamente com codigo de saida $($frontendProc.ExitCode)."
        if (Test-Path "$RepoRoot\frontend.err.log") {
            $errContent = (Get-Content "$RepoRoot\frontend.err.log" -Raw).Trim()
            if ($errContent) {
                Write-Host "       Detalhes do erro:" -ForegroundColor Red
                Write-Host $errContent -ForegroundColor Red
            }
        }
        break
    }

    Start-Sleep -Seconds 1
    $elapsed++
}

# Painel de Status
Write-BrandHeader -Clear

Write-Host "  Status dos Servicos:" -ForegroundColor White
Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Success "Banco de Dados:       127.0.0.1:5432 (canamed_dev)"
if ($backendReady) {
    Write-Success "Backend API:          http://localhost:$PortBackend"
    Write-Success "Documentacao OpenAPI: http://localhost:$PortBackend/api/v1/openapi.json"
} else {
    Write-ErrorMsg "Backend API:          Iniciando em segundo plano (http://localhost:$PortBackend)"
}

if ($frontendReady) {
    Write-Success "Frontend SPA:         http://localhost:$PortFrontend"
} else {
    Write-Step    "Frontend SPA:         Iniciando em segundo plano (http://localhost:$PortFrontend)"
}

Write-Host ""
Write-Host "  Credenciais de Demonstracao (Ambiente de Desenvolvimento):" -ForegroundColor White
Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  * E-mail do Gestor:  " -NoNewline -ForegroundColor Gray
Write-Host "gestor@canamed.local" -ForegroundColor Yellow
Write-Host "  * Senha de Acesso:   " -NoNewline -ForegroundColor Gray
Write-Host "yR5vBpXhN9PotOH4ji8G6Sek!7" -ForegroundColor Yellow
Write-Host "  * Unidade Padrao:    " -NoNewline -ForegroundColor Gray
Write-Host "Clinica Demonstracao (dados sinteticos)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Modulos Ativos:" -ForegroundColor White
Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  * Agenda de Consultas & Recepcao / Fila de Espera" -ForegroundColor DarkCyan
Write-Host "  * Consultorio Medico Virtual & PEP (SOAP, Prescricoes ICP-Brasil)" -ForegroundColor DarkCyan
Write-Host "  * Portal do Paciente (OTP) & Totem de Autoatendimento" -ForegroundColor DarkCyan
Write-Host "  * Frente de Caixa, Repasses Medicos, Insumos e Painel TV" -ForegroundColor DarkCyan
Write-Host "  * Painel do DPO e Governanca LGPD (SLA 15 dias & ROPA)" -ForegroundColor DarkCyan
Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  [Pressione 'Q' ou Ctrl+C para encerrar os servicos do CANAMED]" -ForegroundColor Green
Write-Host ""

# Abre o navegador automaticamente
if (-not $NoBrowser) {
    try {
        Start-Process "http://localhost:$PortFrontend"
    } catch {}
}

# Loop de monitoramento de execucao
try {
    while ($true) {
        if ($backendProc.HasExited) {
            Write-ErrorMsg "O processo do Backend foi encerrado com codigo de saida $($backendProc.ExitCode)."
            if (Test-Path "$RepoRoot\backend.err.log") {
                $errContent = (Get-Content "$RepoRoot\backend.err.log" -Raw).Trim()
                if ($errContent) {
                    Write-Host "       Detalhes do erro:" -ForegroundColor Red
                    Write-Host $errContent -ForegroundColor Red
                }
            }
            break
        }
        if ($frontendProc.HasExited) {
            Write-ErrorMsg "O processo do Frontend foi encerrado com codigo de saida $($frontendProc.ExitCode)."
            if (Test-Path "$RepoRoot\frontend.err.log") {
                $errContent = (Get-Content "$RepoRoot\frontend.err.log" -Raw).Trim()
                if ($errContent) {
                    Write-Host "       Detalhes do erro:" -ForegroundColor Red
                    Write-Host $errContent -ForegroundColor Red
                }
            }
            break
        }

        try {
            if ([Console]::KeyAvailable) {
                $key = [Console]::ReadKey($true)
                if ($key.Key -eq [ConsoleKey]::Q) {
                    Write-Step "Comando 'Q' recebido. Encerrando servicos..."
                    break
                }
            }
        } catch {
            # Ignora excecoes de KeyAvailable caso o console nao tenha entrada interativa
        }
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host ""
    Write-Step "Parando processos em execucao..."

    if ($backendProc -and -not $backendProc.HasExited) {
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
        Write-Success "Processo Backend encerrado."
    }

    if ($frontendProc -and -not $frontendProc.HasExited) {
        Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node.exe*" } | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Success "Processo Frontend encerrado."
    }

    # Limpeza de logs temporarios se estiverem vazios
    if (Test-Path "$RepoRoot\backend.err.log") {
        if ((Get-Item "$RepoRoot\backend.err.log").Length -eq 0) { Remove-Item "$RepoRoot\backend.err.log" -Force }
    }
    if (Test-Path "$RepoRoot\frontend.err.log") {
        if ((Get-Item "$RepoRoot\frontend.err.log").Length -eq 0) { Remove-Item "$RepoRoot\frontend.err.log" -Force }
    }

    Write-Host ""
    Write-Success "Todos os servicos do CANAMED foram finalizados com seguranca."
    Write-Host ""
}
