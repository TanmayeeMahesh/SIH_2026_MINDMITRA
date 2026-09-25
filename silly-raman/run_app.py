import uvicorn
import webbrowser
import threading
import time
import sys
import os
import re
import socket
import subprocess

# Ensure UTF-8 output encoding for Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

def get_local_ip():
    """Detect local Wi-Fi / LAN IP address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def launch_mobile_tunnel():
    """Launch Cloudflare HTTPS tunnel for instant mobile phone access with Camera + GPS."""
    time.sleep(2.0)
    cf_bin = os.path.abspath(os.path.join(os.path.dirname(__file__), "cloudflared.exe"))
    local_ip = get_local_ip()
    local_wifi_url = f"http://{local_ip}:8000"
    
    public_https_url = None
    if os.path.exists(cf_bin):
        print("\n🚀 Starting secure HTTPS tunnel for mobile phone deployment...")
        try:
            proc = subprocess.Popen(
                [cf_bin, "tunnel", "--edge-ip-version", "4", "--url", "http://127.0.0.1:8000"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            # Scan output for trycloudflare.com URL
            for line in proc.stdout:
                m = re.search(r'(https://[a-zA-Z0-9-]+\.trycloudflare\.com)', line)
                if m:
                    public_https_url = m.group(1)
                    break
            
            # Drain remaining output in background so pipe buffer never fills up
            def drain():
                try:
                    for _ in proc.stdout:
                        pass
                except Exception:
                    pass
            threading.Thread(target=drain, daemon=True).start()

            import atexit
            atexit.register(lambda: proc.terminate() if proc.poll() is None else None)
        except Exception as e:
            print(f"Notice starting tunnel: {e}")

    # Generate mobile access HTML file with QR Code
    access_url = public_https_url or local_wifi_url
    qr_img_url = f"https://api.qrserver.com/v1/create-qr-code/?size=260x260&data={access_url}"
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MindMitra — Mobile Access & QR Code</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #FBF1E3;
      color: #332F29;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      text-align: center;
    }}
    .card {{
      background: #EEE1CC;
      border: 2px solid #8FA17A;
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(51, 47, 41, 0.15);
    }}
    .qr-frame {{
      background: #ffffff;
      padding: 16px;
      border-radius: 20px;
      display: inline-block;
      margin: 20px 0;
      box-shadow: 0 4px 20px rgba(143, 161, 122, 0.3);
      border: 2px solid #D8B878;
    }}
    .qr-frame img {{
      display: block;
      width: 240px;
      height: 240px;
    }}
    .url-badge {{
      background: #5E6F4A;
      border: 1px solid #8FA17A;
      color: #FBF1E3;
      padding: 12px 16px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      word-break: break-all;
      display: block;
      text-decoration: none;
      margin: 12px 0;
      box-shadow: 0 3px 10px rgba(94, 111, 74, 0.3);
    }}
    .url-badge:hover {{
      background: #8FA17A;
      color: #FBF1E3;
    }}
    .tip {{
      font-size: 13px;
      color: #6B6B63;
      line-height: 1.5;
      margin-top: 14px;
    }}
    .features {{
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
    }}
    .pill {{
      background: rgba(143, 161, 122, 0.2);
      border: 1px solid #8FA17A;
      color: #5E6F4A;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 40px; margin-bottom: 8px;">🛰️📱</div>
    <h2 style="font-size: 22px; font-weight: 800; color: #332F29;">Open MindMitra on Mobile</h2>
    <p style="color: #6B6B63; font-size: 14px; margin-top: 4px;">
      Scan this QR code with your phone camera to test live navigation:
    </p>

    <div class="qr-frame">
      <img src="{qr_img_url}" alt="Scan QR Code to open on mobile" />
    </div>

    <a href="{access_url}" class="url-badge" target="_blank">
      {access_url}
    </a>

    <div class="features">
      <span class="pill">📷 Live Camera</span>
      <span class="pill">🛰️ Real-Time GPS</span>
      <span class="pill">📲 Installable PWA</span>
    </div>

    <div class="tip">
      <strong>✨ Pro Tip:</strong> In Chrome or Safari on your phone, tap <strong>"Add to Home Screen"</strong> to install MindMitra as a standalone app!
    </div>
  </div>
</body>
</html>
"""
    access_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "MOBILE_ACCESS.html"))
    with open(access_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    print("\n" + "=" * 65)
    print("✅ MOBILE DEPLOYMENT READY!")
    print(f"📱 Secure Public HTTPS URL (Phone Camera + GPS active):")
    print(f"   {access_url}")
    print(f"🏠 Local Wi-Fi URL: {local_wifi_url}")
    print(f"💻 Localhost URL:   http://127.0.0.1:8000")
    print(f"📄 Scannable QR Code page created at: MOBILE_ACCESS.html")
    print("=" * 65 + "\n")

    # Open the QR code access page in the default desktop browser
    try:
        webbrowser.open(f"file:///{access_file.replace(os.sep, '/')}")
    except Exception:
        pass

if __name__ == "__main__":
    print("=" * 65)
    print("MindMitra SafeNav - Live Satellite & Camera Mobile Deployment")
    print("Smart India Hackathon 2026 (Problem Statement 26003)")
    print("=" * 65)
    
    # Start mobile tunnel in background thread
    threading.Thread(target=launch_mobile_tunnel, daemon=True).start()
    
    # Start FastAPI / Uvicorn server on all network interfaces (0.0.0.0)
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
