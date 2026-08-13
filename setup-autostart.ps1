$taskName = "XuanJiTechnology"
$scriptPath = "e:\郭海娥\trae 项目\business-website\start.bat"
$workingDir = "e:\郭海娥\trae 项目\business-website"

Write-Host "============================================"
Write-Host "   XuanJi Technology - Auto-Start Setup"
Write-Host "============================================"
Write-Host ""

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Write-Host "Task already exists. Removing old task..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

Write-Host "Creating scheduled task..."

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c ""$scriptPath""" -WorkingDirectory $workingDir

$trigger = New-ScheduledTaskTrigger -AtStartup

$principal = New-ScheduledTaskPrincipal -UserID "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

$task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings

Register-ScheduledTask -TaskName $taskName -InputObject $task

Write-Host ""
Write-Host "✅ Auto-start task created successfully!"
Write-Host ""
Write-Host "Task Name: $taskName"
Write-Host "Startup Script: $scriptPath"
Write-Host "Working Directory: $workingDir"
Write-Host ""
Write-Host "The website will now start automatically when your computer boots."
Write-Host ""
Write-Host "To check task status:"
Write-Host "  Get-ScheduledTask -TaskName $taskName"
Write-Host ""
Write-Host "To disable auto-start:"
Write-Host "  Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false"
Write-Host ""
Write-Host "============================================"
