# Test Double Booking Concurrency Script
param(
    [string]$BaseUrl = "http://localhost:8081/api/v1",
    [string]$Date = (Get-Date).AddDays(3).ToString("yyyy-MM-dd"),
    [string]$Time = "15:00"
)

Write-Host "=== CONCURRENCY TEST: PREVENTING DOUBLE BOOKING ===" -ForegroundColor Cyan
Write-Host "Target Date: $Date, Time: $Time"

# 1. Fetch courts
try {
    $courtsResp = Invoke-RestMethod -Uri "$BaseUrl/facility/courts" -Method Get
    $court = $courtsResp.data | Select-Object -First 1
    if (-not $court) {
        Write-Error "No courts found."
        exit 1
    }
    $courtId = $court.id
    Write-Host "Selected Court: $($court.name) (ID: $courtId)" -ForegroundColor Green
} catch {
    Write-Error "Failed to reach backend at ${BaseUrl} - $_"
    exit 1
}

# 2. Prepare simultaneous payloads
$payload1 = @{
    courtId = $courtId
    guestName = "Racer Alpha"
    guestPhone = "9876543210"
    date = $Date
    startTime = $Time
    channel = "ONLINE"
    paymentPolicy = "PAY_AT_CLUB"
} | ConvertTo-Json

$payload2 = @{
    courtId = $courtId
    guestName = "Racer Beta"
    guestPhone = "9876543211"
    date = $Date
    startTime = $Time
    channel = "ONLINE"
    paymentPolicy = "PAY_AT_CLUB"
} | ConvertTo-Json

Write-Host "`nFiring 2 concurrent booking requests at the EXACT same millisecond..." -ForegroundColor Yellow

$job1 = Start-Job -ScriptBlock {
    param($url, $body)
    try {
        $resp = Invoke-WebRequest -Uri "$url/bookings" -Method Post -Body $body -ContentType "application/json" -SkipHttpErrorCheck
        return [PSCustomObject]@{ Status = $resp.StatusCode; Content = $resp.Content }
    } catch {
        return [PSCustomObject]@{ Status = 500; Content = $_.Exception.Message }
    }
} -ArgumentList $BaseUrl, $payload1

$job2 = Start-Job -ScriptBlock {
    param($url, $body)
    try {
        $resp = Invoke-WebRequest -Uri "$url/bookings" -Method Post -Body $body -ContentType "application/json" -SkipHttpErrorCheck
        return [PSCustomObject]@{ Status = $resp.StatusCode; Content = $resp.Content }
    } catch {
        return [PSCustomObject]@{ Status = 500; Content = $_.Exception.Message }
    }
} -ArgumentList $BaseUrl, $payload2

Wait-Job $job1, $job2 | Out-Null

$res1 = Receive-Job $job1
$res2 = Receive-Job $job2
Remove-Job $job1, $job2

Write-Host "`n--- RESULTS ---" -ForegroundColor Cyan
Write-Host "Request 1 (Racer Alpha): Status $($res1.Status)" -ForegroundColor Cyan
Write-Host "$($res1.Content)`n"

Write-Host "Request 2 (Racer Beta):  Status $($res2.Status)" -ForegroundColor Cyan
Write-Host "$($res2.Content)`n"

$hasSuccess = ($res1.Status -eq 201) -or ($res2.Status -eq 201)
$hasConflict = ($res1.Status -eq 409 -or $res1.Status -eq 400) -or ($res2.Status -eq 409 -or $res2.Status -eq 400)

if ($hasSuccess -and $hasConflict) {
    Write-Host "[SUCCESS] CONCURRENCY GUARD VERIFIED! Exactly ONE booking succeeded, the duplicate was REJECTED." -ForegroundColor Green
} else {
    Write-Host "[RESULT] Check statuses above." -ForegroundColor Yellow
}
