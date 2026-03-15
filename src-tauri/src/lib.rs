use std::net::TcpStream;
use std::time::{Duration, Instant};
use tauri::Manager;

// Keeps the backend process alive for the lifetime of the app.
// CommandChild's Drop implementation kills the child process, so we must
// hold this handle until the Tauri runtime shuts down.
#[cfg(not(debug_assertions))]
#[allow(dead_code)] // field exists solely to keep the child alive until app exit
struct BackendProcess(std::sync::Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

/// Poll port 8000 until the backend accepts connections (or timeout expires).
/// Returns true if the backend is ready, false if the timeout elapsed.
fn wait_for_backend(timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if TcpStream::connect("127.0.0.1:8000").is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    false
}

/// Inline error page shown when the backend fails to start.
/// Styled to match the app's dark theme.
const ERROR_PAGE_HTML: &str = r#"
document.body.style.cssText = 'margin:0;background:#09090b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif';
document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;padding:32px;box-sizing:border-box"><h2 style="margin:0;font-size:1.25rem">subtracker failed to start</h2><p style="margin:0;color:#a1a1aa;text-align:center;max-width:520px;line-height:1.7">The backend process did not respond within 30 seconds.<br>See <strong>Console.app</strong> and filter for <code style="background:#18181b;padding:2px 6px;border-radius:4px">[sidecar]</code> to read the error.<br><br>If macOS says the app is <em>damaged</em> or <em>cannot be opened</em>,<br>run this once in Terminal then relaunch:<br><code style="display:inline-block;margin-top:8px;background:#18181b;padding:6px 14px;border-radius:6px;font-size:0.9rem">xattr -cr /Applications/subtracker.app</code></p></div>';
"#;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Production only: spawn the bundled Python sidecar.
            #[cfg(not(debug_assertions))]
            {
                use tauri_plugin_shell::process::CommandEvent;
                use tauri_plugin_shell::ShellExt;

                match app
                    .shell()
                    .sidecar("subtracker-backend")
                    .and_then(|s| s.spawn())
                {
                    Ok((mut rx, child)) => {
                        // Keep the child alive until the app exits.
                        app.manage(BackendProcess(std::sync::Mutex::new(Some(child))));

                        // Log all sidecar output to stderr.
                        // On macOS: visible in Console.app (filter "sidecar").
                        // When launched from Terminal: printed directly.
                        tauri::async_runtime::spawn(async move {
                            while let Some(event) = rx.recv().await {
                                match event {
                                    CommandEvent::Stdout(line) => {
                                        eprintln!(
                                            "[sidecar out] {}",
                                            String::from_utf8_lossy(&line).trim_end()
                                        );
                                    }
                                    CommandEvent::Stderr(line) => {
                                        eprintln!(
                                            "[sidecar err] {}",
                                            String::from_utf8_lossy(&line).trim_end()
                                        );
                                    }
                                    CommandEvent::Error(e) => {
                                        eprintln!("[sidecar] spawn error: {e}");
                                    }
                                    CommandEvent::Terminated(s) => {
                                        eprintln!(
                                            "[sidecar] process terminated, exit code: {:?}",
                                            s.code
                                        );
                                    }
                                    _ => {}
                                }
                            }
                        });
                    }
                    Err(e) => {
                        // Log and continue — wait_for_backend will time out and
                        // show the error page rather than leaving a hidden window.
                        eprintln!("[subtracker] could not spawn sidecar: {e}");
                    }
                }
            }

            // Show the window once port 8000 is accepting connections.
            // In dev the backend is already running; in production we wait
            // for the sidecar to complete its startup sequence.
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                let ready = wait_for_backend(Duration::from_secs(30));

                if !ready {
                    eprintln!("[subtracker] WARNING: backend did not respond within 30 s");
                }

                if let Some(window) = handle.get_webview_window("main") {
                    window.show().unwrap_or(());

                    if !ready {
                        // Replace the WebView content with an actionable error page.
                        let _ = window.eval(ERROR_PAGE_HTML);
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running subtracker");
}
