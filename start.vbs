Option Explicit
Dim shell, fso, root, node, command, programFiles
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
If Not fso.FileExists(root & "\server.cjs") Then
  MsgBox "Dongu baslatma dosyasi bulunamadi. Proje klasorunu kontrol edin.", vbCritical, "Dongu"
  WScript.Quit 1
End If
programFiles = shell.ExpandEnvironmentStrings("%ProgramFiles%")
node = programFiles & "\nodejs\node.exe"
If Not fso.FileExists(node) Then
  node = FindNodeOnPath(shell.ExpandEnvironmentStrings("%PATH%"))
End If
If node = "" Then
  MsgBox "Node.js bulunamadi. Node.js LTS kurulduktan sonra Dongu kisayolunu yeniden acin.", vbCritical, "Dongu"
  WScript.Quit 1
End If
shell.CurrentDirectory = root
command = Chr(34) & node & Chr(34) & " " & Chr(34) & root & "\server.cjs" & Chr(34)
On Error Resume Next
shell.Run command, 0, False
If Err.Number <> 0 Then
  MsgBox "Dongu baslatilamadi: " & Err.Description, vbCritical, "Dongu"
  WScript.Quit 1
End If
On Error GoTo 0

Function FindNodeOnPath(paths)
  Dim entry, candidate
  FindNodeOnPath = ""
  For Each entry In Split(paths, ";")
    entry = Replace(Trim(entry), Chr(34), "")
    If Len(entry) > 0 Then
      candidate = fso.BuildPath(entry, "node.exe")
      If fso.FileExists(candidate) Then
        FindNodeOnPath = candidate
        Exit Function
      End If
    End If
  Next
End Function
