param(
    [string]$BaseUrl = $env:STAGING_BACKEND_URL,
    [string]$AccessToken = $env:STAGING_ACCESS_TOKEN,
    [string]$ExpectedEnvironment = "staging",
    [string]$ExpectedService = "greencard-api",
    [int]$TimeoutSeconds = 15,
    [switch]$PublicOnly
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    throw "Set STAGING_BACKEND_URL or pass -BaseUrl https://your-staging-api.example.com"
}

$script:Failures = New-Object System.Collections.Generic.List[string]
$script:Warnings = New-Object System.Collections.Generic.List[string]
$script:Passed = 0
$script:Skipped = 0

function Write-Step {
    param(
        [string]$Status,
        [string]$Name,
        [string]$Detail = ""
    )

    $line = "[$Status] $Name"
    if (-not [string]::IsNullOrWhiteSpace($Detail)) {
        $line = "$line - $Detail"
    }

    switch ($Status) {
        "PASS" { Write-Host $line -ForegroundColor Green }
        "FAIL" { Write-Host $line -ForegroundColor Red }
        "WARN" { Write-Host $line -ForegroundColor Yellow }
        "SKIP" { Write-Host $line -ForegroundColor DarkYellow }
        default { Write-Host $line }
    }
}

function Pass {
    param([string]$Name, [string]$Detail = "")
    $script:Passed++
    Write-Step "PASS" $Name $Detail
}

function Warn {
    param([string]$Name, [string]$Detail = "")
    $script:Warnings.Add($Name)
    Write-Step "WARN" $Name $Detail
}

function Skip {
    param([string]$Name, [string]$Detail = "")
    $script:Skipped++
    Write-Step "SKIP" $Name $Detail
}

function Fail {
    param([string]$Name, [string]$Detail = "")
    $script:Failures.Add("$Name $Detail".Trim())
    Write-Step "FAIL" $Name $Detail
}

function Convert-BodyToJson {
    param([string]$Body)

    if ([string]::IsNullOrWhiteSpace($Body)) {
        return $null
    }

    try {
        return $Body | ConvertFrom-Json
    }
    catch {
        return $null
    }
}

function Invoke-StageRequest {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Headers = @{}
    )

    $uri = "$script:NormalizedBaseUrl$Path"
    try {
        $response = Invoke-WebRequest `
            -Method $Method `
            -Uri $uri `
            -Headers $Headers `
            -TimeoutSec $TimeoutSeconds `
            -UseBasicParsing

        return [pscustomobject]@{
            Ok         = $true
            StatusCode = [int]$response.StatusCode
            Body       = [string]$response.Content
            Json       = Convert-BodyToJson ([string]$response.Content)
            Headers    = $response.Headers
            Error      = $null
        }
    }
    catch [System.Net.WebException] {
        $errorResponse = $_.Exception.Response
        if ($null -ne $errorResponse) {
            $body = ""
            try {
                $reader = [System.IO.StreamReader]::new($errorResponse.GetResponseStream())
                $body = $reader.ReadToEnd()
                $reader.Dispose()
            }
            catch {
                $body = ""
            }

            return [pscustomobject]@{
                Ok         = $false
                StatusCode = [int]$errorResponse.StatusCode
                Body       = $body
                Json       = Convert-BodyToJson $body
                Headers    = $errorResponse.Headers
                Error      = $_.Exception.Message
            }
        }

        return [pscustomobject]@{
            Ok         = $false
            StatusCode = 0
            Body       = ""
            Json       = $null
            Headers    = @{}
            Error      = $_.Exception.Message
        }
    }
    catch {
        $errorResponse = $_.Exception.Response
        if ($null -ne $errorResponse -and $null -ne $errorResponse.StatusCode) {
            $body = ""
            try {
                if ($null -ne $errorResponse.Content) {
                    $body = $errorResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult()
                }
            }
            catch {
                $body = ""
            }

            return [pscustomobject]@{
                Ok         = $false
                StatusCode = [int]$errorResponse.StatusCode
                Body       = $body
                Json       = Convert-BodyToJson $body
                Headers    = $errorResponse.Headers
                Error      = $_.Exception.Message
            }
        }

        return [pscustomobject]@{
            Ok         = $false
            StatusCode = 0
            Body       = ""
            Json       = $null
            Headers    = @{}
            Error      = $_.Exception.Message
        }
    }
}

function Expect-Status {
    param(
        [string]$Name,
        [object]$Response,
        [int[]]$ExpectedStatus
    )

    if ($ExpectedStatus -contains $Response.StatusCode) {
        Pass $Name "HTTP $($Response.StatusCode)"
        return $true
    }

    $detail = "expected HTTP $($ExpectedStatus -join '/') but got HTTP $($Response.StatusCode)"
    if (-not [string]::IsNullOrWhiteSpace($Response.Error)) {
        $detail = "$detail; $($Response.Error)"
    }
    Fail $Name $detail
    return $false
}

function Expect-HealthPayload {
    param(
        [string]$Name,
        [object]$Payload,
        [string]$ExpectedStatus
    )

    if ($null -eq $Payload) {
        Fail $Name "response body was not JSON"
        return
    }

    if ($Payload.status -ne $ExpectedStatus) {
        Fail $Name "expected status '$ExpectedStatus' but got '$($Payload.status)'"
    }
    else {
        Pass "$Name status" $Payload.status
    }

    if ($Payload.service -ne $ExpectedService) {
        Fail "$Name service" "expected '$ExpectedService' but got '$($Payload.service)'"
    }
    else {
        Pass "$Name service" $Payload.service
    }

    if ($Payload.environment -ne $ExpectedEnvironment) {
        Fail "$Name environment" "expected '$ExpectedEnvironment' but got '$($Payload.environment)'"
    }
    else {
        Pass "$Name environment" $Payload.environment
    }

    if ([string]::IsNullOrWhiteSpace([string]$Payload.version) -or $Payload.version -eq "dev") {
        Fail "$Name version" "APP_VERSION appears unset or still 'dev'"
    }
    elseif ($Payload.version -in @("unknown", "container")) {
        Warn "$Name version" "version '$($Payload.version)' is usable for smoke checks but should be a commit/release label"
    }
    else {
        Pass "$Name version" $Payload.version
    }
}

function Expect-ReadinessChecks {
    param([object]$Payload)

    if ($null -eq $Payload.checks) {
        Warn "readiness checks" "no readiness checks were returned"
        return
    }

    foreach ($check in $Payload.checks) {
        $name = "readiness check '$($check.name)'"
        if ($check.critical -and $check.status -ne "ok") {
            Fail $name "critical check returned '$($check.status)'"
        }
        else {
            Pass $name $check.status
        }
    }
}

function Test-PublicHealth {
    $live = Invoke-StageRequest -Method "GET" -Path "/live"
    if (Expect-Status "GET /live reachable" $live @(200)) {
        Expect-HealthPayload "live payload" $live.Json "ok"
    }

    $health = Invoke-StageRequest -Method "GET" -Path "/health"
    if (Expect-Status "GET /health reachable" $health @(200)) {
        Expect-HealthPayload "health payload" $health.Json "ok"
    }

    $ready = Invoke-StageRequest -Method "GET" -Path "/ready"
    if (Expect-Status "GET /ready reachable" $ready @(200)) {
        Expect-HealthPayload "ready payload" $ready.Json "ready"
        Expect-ReadinessChecks $ready.Json
    }
}

function Test-AuthProtection {
    $response = Invoke-StageRequest -Method "GET" -Path "/v1/auth/session"
    if (Expect-Status "protected route rejects missing token" $response @(401)) {
        if ($null -ne $response.Json -and $response.Json.error.code -eq "authentication_required") {
            Pass "missing-token error shape" $response.Json.error.code
        }
        else {
            Warn "missing-token error shape" "expected authentication_required error code"
        }
    }
}

function Test-AuthenticatedRead {
    param([string]$Path, [string]$Name)

    $headers = @{
        Authorization = "Bearer $AccessToken"
    }
    $response = Invoke-StageRequest -Method "GET" -Path $Path -Headers $headers
    if (Expect-Status $Name $response @(200)) {
        if ($null -eq $response.Json) {
            Fail "$Name JSON body" "expected JSON response body"
        }
        else {
            Pass "$Name JSON body" "valid JSON"
        }
    }
}

$script:NormalizedBaseUrl = $BaseUrl.TrimEnd("/")

Write-Host "GreenCard staging backend verification" -ForegroundColor Cyan
Write-Host "Target: $script:NormalizedBaseUrl"
Write-Host "Expected environment: $ExpectedEnvironment"
Write-Host ""

Test-PublicHealth
Test-AuthProtection

if ([string]::IsNullOrWhiteSpace($AccessToken)) {
    if ($PublicOnly) {
        Skip "authenticated staging checks" "PublicOnly was set; Supabase auth and repository-backed endpoints were not checked"
    }
    else {
        Fail "authenticated staging checks" "set STAGING_ACCESS_TOKEN or pass -AccessToken to verify Supabase auth and repository-backed endpoints; use -PublicOnly only for health-only checks"
    }
}
else {
    Test-AuthenticatedRead "/v1/auth/session" "authenticated session"
    Test-AuthenticatedRead "/v1/profile" "profile/Supabase read"
    Test-AuthenticatedRead "/v1/accounts" "accounts/Supabase read"
    Test-AuthenticatedRead "/v1/activity/recent" "recent activity/Supabase read"
    Test-AuthenticatedRead "/v1/transactions/funding" "funding transactions/Supabase read"
    Test-AuthenticatedRead "/v1/transactions/transfers" "transfer transactions/Supabase read"
    Test-AuthenticatedRead "/v1/transactions/payments" "payment transactions/Supabase read"
    Test-AuthenticatedRead "/v1/recipients" "recipients/Supabase read"
    Test-AuthenticatedRead "/v1/support/tickets" "support tickets/Supabase read"
}

Write-Host ""
Write-Host "Verification summary"
Write-Host "Passed:  $script:Passed"
Write-Host "Skipped: $script:Skipped"
Write-Host "Warnings: $($script:Warnings.Count)"
Write-Host "Failures: $($script:Failures.Count)"

if ($script:Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Failures:" -ForegroundColor Red
    foreach ($failure in $script:Failures) {
        Write-Host "- $failure" -ForegroundColor Red
    }
    exit 1
}

if ($script:Warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "Warnings:" -ForegroundColor Yellow
    foreach ($warning in $script:Warnings) {
        Write-Host "- $warning" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Staging backend verification passed." -ForegroundColor Green
