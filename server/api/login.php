<?php
// POST {passcode, device} -> {token}. Each device gets its own long random token;
// only a hash of it is stored. Repeated wrong passcodes lock out that IP for a while.
declare(strict_types=1);
require __DIR__ . '/lib.php';

require_method('POST');
$body = read_json_body();
$cfg = config();
$pdo = db();
$ip = client_ip();

$pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < UTC_TIMESTAMP() - INTERVAL 1 DAY')->execute();

$stmt = $pdo->prepare(
    'SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND attempted_at > UTC_TIMESTAMP() - INTERVAL ' . LOGIN_WINDOW_MINUTES . ' MINUTE'
);
$stmt->execute([$ip]);
if ((int)$stmt->fetchColumn() >= LOGIN_MAX_FAILURES) {
    json_out(429, ['error' => 'locked', 'minutes' => LOGIN_WINDOW_MINUTES]);
}

$passcode = $body['passcode'] ?? '';
if (!is_string($passcode) || !password_verify($passcode, $cfg['passcode_hash'])) {
    $pdo->prepare('INSERT INTO login_attempts (ip, attempted_at) VALUES (?, UTC_TIMESTAMP())')->execute([$ip]);
    sleep(1);
    json_out(401, ['error' => 'wrong_passcode']);
}

$pdo->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$ip]);

$token = bin2hex(random_bytes(32));
$pdo->prepare('INSERT INTO tokens (token_hash, device, created_at) VALUES (?, ?, UTC_TIMESTAMP())')
    ->execute([hash('sha256', $token), clean_device_name($body['device'] ?? '')]);

json_out(200, ['token' => $token]);
