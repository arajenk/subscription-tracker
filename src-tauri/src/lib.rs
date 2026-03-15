use std::net::TcpStream;
use std::time::{Duration, Instant};

// Keeps the backend process alive for the lifetime of the app.
// CommandChild's Drop implementation kills the child process, so we must
// hold this handle until the Tauri runtime shuts down.
#[cfg(not(debug_assertions))]
struct BackendProcess(std::sync::Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

/// Poll port 8000 until the backend accepts connections (or timeout expires).
fn wait_for_backend(timeout: Duration) {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if TcpStream::connect("127.0.0.1:8000").is_ok() {
            return;
        }
        std::thread::sleep(Duration::from_millis(100));
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // ── Production only: spawn the bundled Python sidecar ──────────
            #[cfg(not(debug_assertions))]
            {
                use tauri_plugin_shell::ShellExt;
                use tauri::Manager;

                let sidecar = app
                    .shell()
                    .sidecar("subtracker-backend")
                    .expect("subtracker-backend sidecar not found in bundle");

                let (mut rx, child) = sidecar
                    .spawn()
                    .expect("failed to spawn subtracker-backend");

                // Store the child so it stays alive until the app exits.
                app.manage(BackendProcess(Mutex::new(Some(child))));

                // Drain sidecar stdout/stderr in a background task so the
                // OS pipe buffer never fills up and blocks the process.
                tauri::async_runtime::spawn(async move {
                    while rx.recv().await.is_some() {}
                });
            }
            // ──────────────────────────────────────────────────────────────

            // Show the window once port 8000 is accepting connections.
            // In dev the backend is already running; in production we wait
            // for the sidecar to complete its startup sequence.
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                wait_for_backend(Duration::from_secs(30));
                if let Some(window) = handle.get_webview_window("main") {
                    let _ = window.show();
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running subtracker");
}
