Set WshShell = CreateObject("WScript.Shell")

startupFolder = WshShell.SpecialFolders("Startup")
shortcutPath = startupFolder & "\XuanJiTechnology.lnk"
scriptPath = "e:\郭海娥\trae 项目\business-website\start.bat"
workingDir = "e:\郭海娥\trae 项目\business-website"

Set shortcut = WshShell.CreateShortcut(shortcutPath)
shortcut.TargetPath = scriptPath
shortcut.WorkingDirectory = workingDir
shortcut.WindowStyle = 7
shortcut.Save

MsgBox "Auto-start configured!", vbInformation, "XuanJi Technology"
