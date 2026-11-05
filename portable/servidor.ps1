param(
  [string]$Root = "$PSScriptRoot\app",
  [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Web

$Root = [System.IO.Path]::GetFullPath($Root)
if (-not (Test-Path (Join-Path $Root 'index.html'))) {
  Write-Host "Pasta app invalida: $Root" -ForegroundColor Red
  exit 1
}

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.wasm' = 'application/wasm'
  '.gz'   = 'application/gzip'
  '.woff' = 'font/woff'
  '.woff2'= 'font/woff2'
  '.txt'  = 'text/plain; charset=utf-8'
  '.pdf'  = 'application/pdf'
}

function Send-Response {
  param($Stream, [int]$Status, [string]$ContentType, [byte[]]$Body, [string]$Method)
  $reason = switch ($Status) { 200 {'OK'} 404 {'Not Found'} 403 {'Forbidden'} 500 {'Internal Server Error'} default {'OK'} }
  $headers = "HTTP/1.1 $Status $reason`r`n" +
             "Content-Type: $ContentType`r`n" +
             "Content-Length: $($Body.Length)`r`n" +
             "Cache-Control: no-cache`r`n" +
             "X-Content-Type-Options: nosniff`r`n" +
             "Connection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Method -ne 'HEAD' -and $Body.Length -gt 0) { $Stream.Write($Body, 0, $Body.Length) }
  $Stream.Flush()
}

$listener = $null
for ($p = $Port; $p -lt ($Port + 20); $p++) {
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $p)
    $listener.Start()
    $Port = $p
    break
  } catch {
    if ($listener) { try { $listener.Stop() } catch {} }
    $listener = $null
  }
}
if (-not $listener) { Write-Host 'Nenhuma porta livre encontrada.' -ForegroundColor Red; exit 1 }

$url = "http://localhost:$Port/"
Write-Host ''
Write-Host '  Rajamine FieldOps' -ForegroundColor Yellow
Write-Host "  Servidor local: $url" -ForegroundColor Green
Write-Host '  Mantenha esta janela aberta enquanto usar o sistema.'
Write-Host '  Feche a janela ou pressione Ctrl+C para encerrar.'
Write-Host ''
Start-Process $url

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $stream = $null
    $reader = $null
    try {
      $client.ReceiveTimeout = 8000
      $client.SendTimeout = 30000
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8, $false, 4096, $true)
      $requestLine = $reader.ReadLine()
      if (-not $requestLine) { continue }
      while ($true) { $h = $reader.ReadLine(); if ($null -eq $h -or $h -eq '') { break } }
      $parts = $requestLine.Split(' ')
      if ($parts.Length -lt 2) { continue }
      $method = $parts[0].ToUpperInvariant()
      if ($method -ne 'GET' -and $method -ne 'HEAD') {
        Send-Response $stream 403 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Metodo nao suportado')) $method
        continue
      }
      $rawPath = $parts[1].Split('?')[0]
      $path = [System.Web.HttpUtility]::UrlDecode($rawPath)
      if ($path -eq '/') { $path = '/index.html' }
      $relative = $path.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
      $full = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($Root, $relative))
      $rootPrefix = $Root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
      if (-not $full.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        Send-Response $stream 403 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Acesso negado')) $method
        continue
      }
      if (-not [System.IO.File]::Exists($full)) {
        $ext = [System.IO.Path]::GetExtension($full)
        if ([string]::IsNullOrEmpty($ext)) { $full = Join-Path $Root 'index.html' }
        else {
          Send-Response $stream 404 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Arquivo nao encontrado')) $method
          continue
        }
      }
      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $ct = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      Send-Response $stream 200 $ct $bytes $method
    } catch {
      try {
        if ($stream) { Send-Response $stream 500 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Erro interno')) 'GET' }
      } catch {}
    } finally {
      if ($reader) { $reader.Dispose() }
      if ($client) { $client.Close() }
    }
  }
} finally {
  if ($listener) { $listener.Stop() }
}
