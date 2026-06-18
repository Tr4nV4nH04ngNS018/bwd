# ═══════════════════════════════════════════════════════════════════════
#  FILE: serve.ps1
#  MÔ TẢ: Script PowerShell thiết lập một Local Web Server nhẹ không cần Node.js
#  
#  CÁC CHỨC NĂNG CHÍNH:
#  1. Khởi tạo một HTTP Listener lắng nghe tại port 8000.
#  2. Hỗ trợ Proxy Route (/api/proxy) để vượt rào CORS khi gọi các API từ browser.
#  3. Tích hợp bộ nhớ đệm (In-memory Caching) cho các kết quả API giúp giảm tải và tăng tốc.
#  4. Cơ chế bảo mật chống Path Traversal (truy xuất file ngoài thư mục dự án).
#  5. Tự động trả về đúng Content-Type cho các file HTML, CSS, JS, GLB (3D models), ảnh,...
# ═══════════════════════════════════════════════════════════════════════

$port = 8000
# Khởi tạo đối tượng HttpListener của .NET
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server đang chạy tại: http://localhost:$port/"
Write-Host "Nhấn phím Ctrl + C để dừng Server."

# Khởi tạo Hashtable toàn cục làm bộ nhớ đệm (Cache) lưu kết quả API
$global:apiCache = @{}

try {
    # Vòng lặp liên tục xử lý các Request gửi đến server
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Trích xuất đường dẫn tương đối (ví dụ: /index.html)
        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/index.html" } # Mặc định trả về index.html
        $filePath = Join-Path (Get-Location).Path $path

        # ═════ PHẦN PROXY ĐỂ VƯỢT LỖI CORS & THIẾT LẬP CACHING ═════
        if ($path -like "/api/proxy*") {
            try {
                # Lấy tham số 'url' từ Query String (ví dụ: ?url=https://...)
                $remoteUrl = $request.QueryString["url"]
                if (-not $remoteUrl) {
                    $response.StatusCode = 400
                    $response.StatusDescription = "Thieu tham so 'url'"
                    $response.Close()
                    continue
                }

                # Lấy tham số TTL (Time-To-Live) chỉ định thời gian lưu cache (mặc định: 300 giây)
                $ttlParam = $request.QueryString["ttl"]
                $ttl = if ($ttlParam) { [int]$ttlParam } else { 300 }

                # Kiểm tra nếu cache đã có và còn hạn dùng (fresh) -> Trả về luôn từ cache
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

                # Gửi request HTTP từ Server lấy dữ liệu từ URL thực tế
                try {
                    $remoteResp = Invoke-WebRequest -Uri $remoteUrl -UseBasicParsing -TimeoutSec 20
                    $body = $remoteResp.Content
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
                    $contentType = $remoteResp.Headers["Content-Type"]
                    if (-not $contentType) { $contentType = "application/octet-stream" }

                    # Lưu dữ liệu tải được vào Cache cùng với thời gian ghi nhận
                    $global:apiCache[$remoteUrl] = @{ time = (Get-Date); content = $bytes; contentType = $contentType }
                    
                    # Trả response về cho Client
                    $response.ContentType = $contentType
                    $response.ContentLength64 = $bytes.Length
                    if ($request.HttpMethod -ne "HEAD") {
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    }
                }
                catch {
                    $response.StatusCode = 502 # Cổng kết nối trung gian lỗi (Bad Gateway)
                }
            }
            catch {
                $response.StatusCode = 500 # Lỗi hệ thống nội bộ
            }
            $response.Close()
            continue
        }

        # ═════ CƠ CHẾ BẢO MẬT: CHỐNG TRUY XUẤT FILE TRÁI PHÉP (Path Traversal) ═════
        # Lấy đường dẫn tuyệt đối của file yêu cầu và thư mục hiện tại
        $fullPath = [System.IO.Path]::GetFullPath($filePath)
        $currentDir = [System.IO.Path]::GetFullPath((Get-Location).Path)
        
        # Đảm bảo file nằm trong thư mục dự án và có tồn tại thực sự
        if ($fullPath.StartsWith($currentDir) -and (Test-Path $fullPath -PathType Leaf)) {
            try {
                # Đọc toàn bộ nội dung file dạng byte nhị phân
                [byte[]]$content = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentLength64 = $content.Length
                
                # Ánh xạ phần mở rộng file (Extension) sang Content-Type tương ứng
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                switch ($ext) {
                    ".html" { $response.ContentType = "text/html" }
                    ".css" { $response.ContentType = "text/css" }
                    ".js" { $response.ContentType = "application/javascript" }
                    ".glb" { $response.ContentType = "model/gltf-binary" } # Định dạng mô hình 3D
                    ".png" { $response.ContentType = "image/png" }
                    ".jpg" { $response.ContentType = "image/jpeg" }
                    default { $response.ContentType = "application/octet-stream" }
                }
                
                # Ghi dữ liệu file ra luồng phản hồi nếu không phải là method HEAD
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($content, 0, $content.Length)
                }
            }
            catch {
                Write-Host "Lỗi khi xử lý file: $_"
                $response.StatusCode = 500
            }
        }
        else {
            $response.StatusCode = 404 # Không tìm thấy trang hoặc file
        }
        $response.Close()
    }
}
finally {
    # Đảm bảo tắt listener an toàn để giải phóng port 8000 khi dừng script
    $listener.Stop()
}
