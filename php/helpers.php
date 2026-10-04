<?php
/**
 * helpers.php - Shared functions for form handlers.
 */
require_once __DIR__ . '/config.php';

function json_response(bool $success, string $message, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function require_post(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(false, 'Invalid request method.', 405);
    }
    // Honeypot: bots fill hidden fields. Pretend success so they go away.
    if (!empty($_POST['website'])) {
        json_response(true, 'Thank you!');
    }
}

function clean(string $key, int $max = 120): string {
    $v = isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
    $v = strip_tags($v);
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $v);
    return mb_substr($v, 0, $max);
}

function ensure_dir(string $dir): void {
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        json_response(false, 'Server storage error. Please contact us by phone.', 500);
    }
}

/** Basic per-IP rate limit using a small file counter. */
function rate_limit(): void {
    ensure_dir(DATA_DIR);
    $ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = DATA_DIR . '/rate_' . md5($ip) . '.json';
    $now  = time();
    $hits = [];
    if (is_file($file)) {
        $hits = json_decode((string) file_get_contents($file), true) ?: [];
        $hits = array_filter($hits, fn($t) => $t > $now - 3600);
    }
    if (count($hits) >= RATE_LIMIT_PER_HOUR) {
        json_response(false, 'Too many submissions. Please try again later or call us.', 429);
    }
    $hits[] = $now;
    file_put_contents($file, json_encode(array_values($hits)), LOCK_EX);
}

/**
 * Safely validate and store an uploaded image.
 * - checks upload error, size, real MIME type (finfo), and that it decodes as an image
 * - generates a random filename (never trusts the client's name/extension)
 * Returns the stored filename.
 */
function save_image(string $field, string $destDir, string $prefix): string {
    if (!isset($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) {
        json_response(false, 'Please attach the required image.', 422);
    }
    $f = $_FILES[$field];

    if ($f['error'] !== UPLOAD_ERR_OK) {
        $msg = ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE)
            ? 'Image is too large. Maximum size is 3 MB.'
            : 'Upload failed. Please try again.';
        json_response(false, $msg, 422);
    }
    if ($f['size'] > MAX_UPLOAD_BYTES) {
        json_response(false, 'Image is too large. Maximum size is 3 MB.', 422);
    }
    if (!is_uploaded_file($f['tmp_name'])) {
        json_response(false, 'Invalid upload.', 400);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($f['tmp_name']);
    if (!isset(ALLOWED_MIME[$mime])) {
        json_response(false, 'Only JPG, PNG or WEBP images are allowed.', 422);
    }
    if (@getimagesize($f['tmp_name']) === false) {
        json_response(false, 'The file is not a valid image.', 422);
    }

    ensure_dir($destDir);
    $name = $prefix . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . ALLOWED_MIME[$mime];
    if (!move_uploaded_file($f['tmp_name'], $destDir . '/' . $name)) {
        json_response(false, 'Could not save the image. Please try again.', 500);
    }
    @chmod($destDir . '/' . $name, 0644);
    return $name;
}

/** Append a row to a CSV log (opens fine in Excel). Guards against CSV formula injection. */
function log_csv(string $file, array $row): void {
    ensure_dir(DATA_DIR);
    $path   = DATA_DIR . '/' . $file;
    $isNew  = !is_file($path);
    $safe   = array_map(function ($v) {
        $v = (string) $v;
        return preg_match('/^[=+\-@]/', $v) ? "'" . $v : $v;
    }, $row);
    $fh = fopen($path, 'ab');
    if ($fh) {
        flock($fh, LOCK_EX);
        if ($isNew) { fwrite($fh, "\xEF\xBB\xBF"); } // UTF-8 BOM for Excel
        fputcsv($fh, $safe);
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}

function notify_admin(string $subject, string $body): void {
    if (!ADMIN_EMAIL || ADMIN_EMAIL === 'you@example.com') return;
    $subject = preg_replace('/[\r\n]+/', ' ', $subject);
    $headers = "From: Bandhan Shadi Office <" . MAIL_FROM . ">\r\n"
             . "Content-Type: text/plain; charset=UTF-8\r\n";
    @mail(ADMIN_EMAIL, $subject, $body, $headers);
}
