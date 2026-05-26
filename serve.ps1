$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server is running at http://localhost:$port/"
Write-Host "Press Ctrl+C to stop."

# Simple in-memory cache for proxied API responses
$global:apiCache = @{}


try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/index.html" }
        $filePath = Join-Path (Get-Location).Path $path

        # Handle simple proxy route to bypass CORS and provide caching
        if ($path -like "/api/proxy*") {
            try {
                $remoteUrl = $request.QueryString["url"]
                if (-not $remoteUrl) {
                    $response.StatusCode = 400
                    $response.StatusDescription = "Missing 'url' parameter"
                    $response.Close()
                    continue
                }

                # Optional TTL param (seconds)
                $ttlParam = $request.QueryString["ttl"]
                $ttl = if ($ttlParam) { [int]$ttlParam } else { 300 }

                # Return from cache if present and fresh
                if ($global:apiCache.ContainsKey($remoteUrl)) {
                    $entry = $global:apiCache[$remoteUrl]
                    $age = (Get-Date) - $entry.time
                    if ($age.TotalSeconds -lt $ttl) {
                        $response.ContentType = $entry.contentType
                        $response.ContentLength64 = $entry.content.Length
                        if ($request.HttpMethod -ne "HEAD") {
                            $response.OutputStream.Write($entry.content, 0, $entry.content.Length)
                        }
                        $response.Close()
                        continue
                    }
                }

                # Fetch remote resource
                try {
                    $remoteResp = Invoke-WebRequest -Uri $remoteUrl -UseBasicParsing -TimeoutSec 20
                    $body = $remoteResp.Content
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
                    $contentType = $remoteResp.Headers["Content-Type"]
                    if (-not $contentType) { $contentType = "application/octet-stream" }

                    # Cache and respond
                    $global:apiCache[$remoteUrl] = @{ time = (Get-Date); content = $bytes; contentType = $contentType }
                    $response.ContentType = $contentType
                    $response.ContentLength64 = $bytes.Length
                    if ($request.HttpMethod -ne "HEAD") {
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    }
                }
                catch {
                    $response.StatusCode = 502
                }
            }
            catch {
                $response.StatusCode = 500
            }
            $response.Close()
            continue
        }

        # Avoid path traversal
        $fullPath = [System.IO.Path]::GetFullPath($filePath)
        $currentDir = [System.IO.Path]::GetFullPath((Get-Location).Path)
        
        if ($fullPath.StartsWith($currentDir) -and (Test-Path $fullPath -PathType Leaf)) {
            try {
                [byte[]]$content = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentLength64 = $content.Length
                
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                switch ($ext) {
                    ".html" { $response.ContentType = "text/html" }
                    ".css" { $response.ContentType = "text/css" }
                    ".js" { $response.ContentType = "application/javascript" }
                    ".glb" { $response.ContentType = "model/gltf-binary" }
                    ".png" { $response.ContentType = "image/png" }
                    ".jpg" { $response.ContentType = "image/jpeg" }
                    default { $response.ContentType = "application/octet-stream" }
                }
                
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($content, 0, $content.Length)
                }
            }
            catch {
                Write-Host "Error serving file: $_"
                $response.StatusCode = 500
            }
        }
        else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
}
finally {
    $listener.Stop()
}
