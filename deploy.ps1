$ErrorActionPreference = "Stop"

$script:StepFailures = 0
$script:RequiredTables = @("produtos", "pedidos", "pedido_itens")

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[FALHA] $Message" -ForegroundColor Red
}

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Step $Name

    try {
        & $Action
        Write-Ok $Name
        return $true
    }
    catch {
        Write-Host $_.Exception.Message -ForegroundColor Yellow
        Write-Fail $Name
        $script:StepFailures++
        return $false
    }
}

function Get-OptionalEnv {
    param([string]$Name)

    $value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $null
    }

    return $value.Trim()
}

function Get-RequiredEnv {
    param([string]$Name)

    $value = Get-OptionalEnv $Name
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "Variavel obrigatoria ausente: $Name"
    }

    return $value
}

function Get-FirstAvailableEnv {
    param(
        [string[]]$Names,
        [switch]$Required
    )

    foreach ($name in $Names) {
        $value = Get-OptionalEnv $name
        if (-not [string]::IsNullOrWhiteSpace($value)) {
            return @{
                Name  = $name
                Value = $value
            }
        }
    }

    if ($Required) {
        throw "Nenhuma das variaveis obrigatorias foi encontrada: $($Names -join ', ')"
    }

    return $null
}

function Import-DotEnvFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        Write-Host "Arquivo de ambiente nao encontrado em: $Path" -ForegroundColor DarkYellow
        return
    }

    Write-Host "Carregando variaveis de ambiente de: $Path" -ForegroundColor DarkCyan

    $lines = Get-Content $Path -ErrorAction Stop

    foreach ($line in $lines) {
        $trimmed = $line.Trim()

        if ([string]::IsNullOrWhiteSpace($trimmed)) {
            continue
        }

        if ($trimmed.StartsWith("#")) {
            continue
        }

        $index = $trimmed.IndexOf("=")
        if ($index -lt 1) {
            continue
        }

        $name = $trimmed.Substring(0, $index).Trim()
        $value = $trimmed.Substring($index + 1).Trim()

        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [string[]]$Arguments = @(),

        [hashtable]$ExtraEnv = @{}
    )

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $FilePath
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    foreach ($arg in $Arguments) {
        [void]$psi.ArgumentList.Add($arg)
    }

    foreach ($key in $ExtraEnv.Keys) {
        if ($null -ne $ExtraEnv[$key]) {
            $psi.Environment[$key] = [string]$ExtraEnv[$key]
        }
    }

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi

    [void]$process.Start()

    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()

    $process.WaitForExit()

    [PSCustomObject]@{
        ExitCode = $process.ExitCode
        StdOut   = $stdout
        StdErr   = $stderr
        Combined = (($stdout, $stderr) -join [Environment]::NewLine).Trim()
    }
}

function Test-NodeVersion {
    $result = Invoke-NativeCommand -FilePath "node" -Arguments @("-v")

    if ($result.ExitCode -ne 0) {
        throw "Falha ao obter versao do Node.js: $($result.Combined)"
    }

    $raw = $result.StdOut.Trim()
    if (-not $raw) {
        throw "Node.js nao encontrado."
    }

    $version = $raw.TrimStart("v")
    $parts = $version.Split(".")

    if ($parts.Count -lt 2) {
        throw "Nao foi possivel interpretar a versao do Node: $raw"
    }

    $major = [int]$parts[0]
    $minor = [int]$parts[1]

    if ($major -lt 20 -or ($major -eq 20 -and $minor -lt 19)) {
        throw "Versao do Node incompativel: $raw. Requer >= v20.19.0."
    }

    Write-Host "Node detectado: $raw"
}

function Test-SupabaseCli {
    $result = Invoke-NativeCommand -FilePath "npx" -Arguments @("supabase", "--version")

    if ($result.ExitCode -ne 0) {
        throw "Falha ao validar Supabase CLI: $($result.Combined)"
    }

    Write-Host $result.StdOut.Trim()
}

function Test-VercelCli {
    $result = Invoke-NativeCommand -FilePath "vercel" -Arguments @("--version")

    if ($result.ExitCode -ne 0) {
        throw "Falha ao validar Vercel CLI: $($result.Combined)"
    }

    Write-Host $result.StdOut.Trim()
}

function Invoke-DbPush {
    $dbPassword = Get-RequiredEnv "SUPABASE_DB_PASSWORD"
    $supabaseAccessToken = Get-OptionalEnv "SUPABASE_ACCESS_TOKEN"

    $extraEnv = @{
        "SUPABASE_DB_PASSWORD" = $dbPassword
    }

    if ($supabaseAccessToken) {
        $extraEnv["SUPABASE_ACCESS_TOKEN"] = $supabaseAccessToken
    }

    $result = Invoke-NativeCommand `
        -FilePath "npx" `
        -Arguments @("supabase", "db", "push") `
        -ExtraEnv $extraEnv

    if ($result.StdOut) {
        Write-Host $result.StdOut.Trim()
    }
    if ($result.StdErr) {
        Write-Host $result.StdErr.Trim() -ForegroundColor DarkYellow
    }

    if ($result.ExitCode -ne 0) {
        throw "Falha no supabase db push: $($result.Combined)"
    }

    if ($result.Combined -match "Unauthorized" -or
        $result.Combined -match "unexpected login role status 401" -or
        $result.Combined -match "Access token not provided" -or
        $result.Combined -match "Connect to your database by setting the env var: SUPABASE_DB_PASSWORD") {
        throw "O supabase db push nao concluiu corretamente: $($result.Combined)"
    }
}

function Get-SupabaseUrlForValidation {
    return Get-FirstAvailableEnv -Names @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "VITE_SUPABASE_URL"
    ) -Required
}

function Get-SupabaseApiKeyForValidation {
    return Get-FirstAvailableEnv -Names @(
        "SUPABASE_SECRET_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
        "VITE_SUPABASE_ANON_KEY",
        "SUPABASE_ANON_KEY"
    ) -Required
}

function Test-OneTableViaRest {
    param(
        [string]$BaseUrl,
        [string]$ApiKey,
        [string]$ApiKeyName,
        [string]$TableName
    )

    $headers = @{
        "apikey"        = $ApiKey
        "Authorization" = "Bearer $ApiKey"
    }

    $uri = "$($BaseUrl.TrimEnd('/'))/rest/v1/$TableName?select=*&limit=1"

    try {
        $response = Invoke-WebRequest -Uri $uri -Headers $headers -Method Get -UseBasicParsing
    }
    catch {
        $errorText = $_.ErrorDetails.Message
        if ([string]::IsNullOrWhiteSpace($errorText)) {
            $errorText = $_.Exception.Message
        }

        if ($errorText -match "Invalid API key") {
            throw "Chave invalida ao validar '$TableName' usando $ApiKeyName."
        }

        if ($errorText -match "relation .* does not exist" -or
            $errorText -match "Could not find the table" -or
            $errorText -match "does not exist") {
            throw "Tabela inexistente no remoto: $TableName"
        }

        if ($errorText -match "permission denied" -or
            $errorText -match "row-level security" -or
            $errorText -match "JWT") {
            throw "A tabela '$TableName' existe, mas a chave usada ($ApiKeyName) nao tem permissao para validar."
        }

        throw "Falha ao validar tabela '$TableName' via REST: $errorText"
    }

    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
        throw "Resposta HTTP inesperada ao validar '$TableName': $($response.StatusCode)"
    }

    Write-Host "Tabela validada via REST: $TableName"
}

function Test-Tables {
    $urlInfo = Get-SupabaseUrlForValidation
    $keyInfo = Get-SupabaseApiKeyForValidation

    Write-Host "URL usada na validacao: $($urlInfo.Name)"
    Write-Host "Chave usada na validacao: $($keyInfo.Name)"

    foreach ($tableName in $script:RequiredTables) {
        Test-OneTableViaRest `
            -BaseUrl $urlInfo.Value `
            -ApiKey $keyInfo.Value `
            -ApiKeyName $keyInfo.Name `
            -TableName $tableName
    }
}

function Invoke-VercelProd {
    $vercelToken = Get-OptionalEnv "VERCEL_TOKEN"

    if (-not [string]::IsNullOrWhiteSpace($vercelToken)) {
        $result = Invoke-NativeCommand -FilePath "vercel" -Arguments @("--prod", "--token", $vercelToken)
    }
    else {
        $result = Invoke-NativeCommand -FilePath "vercel" -Arguments @("--prod")
    }

    if ($result.StdOut) {
        Write-Host $result.StdOut.Trim()
    }
    if ($result.StdErr) {
        Write-Host $result.StdErr.Trim() -ForegroundColor DarkYellow
    }

    if ($result.ExitCode -ne 0) {
        throw "Falha no deploy da Vercel: $($result.Combined)"
    }
}

Write-Host "Fluxo final de deploy"
Write-Host "Diretorio: $(Get-Location)"

Import-DotEnvFile ".env"
Import-DotEnvFile ".env.local"

Invoke-Step "Validar Node.js" { Test-NodeVersion } | Out-Null
Invoke-Step "Validar Supabase CLI" { Test-SupabaseCli } | Out-Null
Invoke-Step "Validar Vercel CLI" { Test-VercelCli } | Out-Null
Invoke-Step "Aplicar migrations com supabase db push" { Invoke-DbPush } | Out-Null
Invoke-Step "Validar tabelas produtos, pedidos e pedido_itens" { Test-Tables } | Out-Null
Invoke-Step "Executar deploy em producao na Vercel" { Invoke-VercelProd } | Out-Null

Write-Host ""
if ($script:StepFailures -gt 0) {
    Write-Fail "Fluxo finalizado com $script:StepFailures etapa(s) com falha."
    exit 1
}

Write-Ok "Fluxo finalizado com sucesso."
