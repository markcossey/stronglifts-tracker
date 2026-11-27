<?php
// Shared helpers for the StrongLifts sync API. Not reachable directly (.htaccess).
declare(strict_types=1);

const CONFIG_FILE = __DIR__ . '/config.php';
const MAX_BODY_BYTES = 8_000_000;
const HISTORY_KEEP = 100;
const LOGIN_MAX_FAILURES = 10;
const LOGIN_WINDOW_MINUTES = 15;

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function json_out(int $code, array $data): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

function config(): array
{
    if (!is_file(CONFIG_FILE)) {
        json_out(503, ['error' => 'not_configured']);
    }
    return require CONFIG_FILE;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config();
        $pdo = connect_db($c['db_host'], $c['db_name'], $c['db_user'], $c['db_pass']);
    }
    return $pdo;
}

function connect_db(string $host, string $name, string $user, string $pass): PDO
{
    return new PDO(
        "mysql:host=$host;dbname=$name;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ],
    );
}

function require_method(string ...$methods): string
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        json_out(405, ['error' => 'method_not_allowed']);
    }
    return $method;
}

/** Decodes the request body. With $assoc false, JSON objects stay objects (so {} survives a round trip). */
function read_json_body(bool $assoc = true): array|stdClass
{
    $raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
    if ($raw === false || strlen($raw) > MAX_BODY_BYTES) {
        json_out(413, ['error' => 'too_large']);
    }
    $data = json_decode($raw, $assoc);
    if (!is_array($data) && !($data instanceof stdClass)) {
        json_out(400, ['error' => 'invalid_json']);
    }
    return $data;
}

function client_ip(): string
{
    return substr((string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 45);
}

/** Checks the device's X-Auth-Token header; returns its token row or stops with 401. */
function require_token(): array
{
    $token = (string)($_SERVER['HTTP_X_AUTH_TOKEN'] ?? '');
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
        json_out(401, ['error' => 'unauthorized']);
    }
    $stmt = db()->prepare('SELECT id, device FROM tokens WHERE token_hash = ?');
    $stmt->execute([hash('sha256', $token)]);
    $row = $stmt->fetch();
    if (!$row) {
        json_out(401, ['error' => 'unauthorized']);
    }
    db()->prepare('UPDATE tokens SET last_used = UTC_TIMESTAMP() WHERE id = ?')->execute([$row['id']]);
    return $row;
}

function clean_device_name(mixed $name): string
{
    $name = is_string($name) ? $name : '';
    $name = trim(preg_replace('/[^\p{L}\p{N} ._()\-]/u', '', $name) ?? '');
    return mb_substr($name !== '' ? $name : 'Unknown device', 0, 100);
}

function schema_sql(): array
{
    $opts = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    return [
        "CREATE TABLE IF NOT EXISTS app_state (
            id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
            revision INT UNSIGNED NOT NULL,
            data MEDIUMTEXT NOT NULL,
            updated_at DATETIME NOT NULL,
            device VARCHAR(100) NOT NULL
        ) $opts",
        "CREATE TABLE IF NOT EXISTS state_history (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            revision INT UNSIGNED NOT NULL,
            data MEDIUMTEXT NOT NULL,
            saved_at DATETIME NOT NULL,
            device VARCHAR(100) NOT NULL,
            INDEX (revision)
        ) $opts",
        "CREATE TABLE IF NOT EXISTS tokens (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            token_hash CHAR(64) NOT NULL UNIQUE,
            device VARCHAR(100) NOT NULL,
            created_at DATETIME NOT NULL,
            last_used DATETIME NULL
        ) $opts",
        "CREATE TABLE IF NOT EXISTS login_attempts (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            ip VARCHAR(45) NOT NULL,
            attempted_at DATETIME NOT NULL,
            INDEX (ip, attempted_at)
        ) $opts",
    ];
}
