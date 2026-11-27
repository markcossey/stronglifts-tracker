<?php
// GET  -> {revision, updatedAt, device, state}   (revision 0 and state null when empty)
// POST {baseRevision, state} -> {revision} or 409 {error: "conflict", revision}
//
// The whole app state is stored as one JSON document with a revision number.
// A save only succeeds if the device saw the latest revision, so one device can't
// silently overwrite another's changes. Every replaced version is kept in
// state_history (the latest HISTORY_KEEP of them) so nothing is ever lost.
declare(strict_types=1);
require __DIR__ . '/lib.php';

$method = require_method('GET', 'POST');
$auth = require_token();
$pdo = db();

if ($method === 'GET') {
    $row = $pdo->query('SELECT revision, data, updated_at, device FROM app_state WHERE id = 1')->fetch();
    header('Content-Type: application/json; charset=utf-8');
    if (!$row) {
        echo '{"revision":0,"state":null}';
        exit;
    }
    // data is stored already validated as JSON, so it is embedded as-is.
    echo '{"revision":' . (int)$row['revision']
        . ',"updatedAt":' . json_encode(str_replace(' ', 'T', $row['updated_at']) . 'Z')
        . ',"device":' . json_encode($row['device'])
        . ',"state":' . $row['data'] . '}';
    exit;
}

$body = read_json_body(false);
$base = $body->baseRevision ?? null;
$state = $body->state ?? null;
if (!is_int($base) || $base < 0) {
    json_out(400, ['error' => 'invalid_base_revision']);
}
if (!($state instanceof stdClass) || !isset($state->lifts, $state->workouts) || !is_array($state->workouts)) {
    json_out(400, ['error' => 'invalid_state']);
}
$data = json_encode($state, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
if ($data === false) {
    json_out(400, ['error' => 'invalid_state']);
}

$pdo->beginTransaction();
$row = $pdo->query('SELECT revision, data, updated_at, device FROM app_state WHERE id = 1 FOR UPDATE')->fetch();
$current = $row ? (int)$row['revision'] : 0;

if ($base !== $current) {
    $pdo->rollBack();
    json_out(409, ['error' => 'conflict', 'revision' => $current]);
}

$next = $current + 1;
if ($row) {
    $pdo->prepare('INSERT INTO state_history (revision, data, saved_at, device) VALUES (?, ?, ?, ?)')
        ->execute([$current, $row['data'], $row['updated_at'], $row['device']]);
    $pdo->prepare('UPDATE app_state SET revision = ?, data = ?, updated_at = UTC_TIMESTAMP(), device = ? WHERE id = 1')
        ->execute([$next, $data, $auth['device']]);
    $pdo->prepare('DELETE FROM state_history WHERE revision <= ?')->execute([$next - HISTORY_KEEP - 1]);
} else {
    $pdo->prepare('INSERT INTO app_state (id, revision, data, updated_at, device) VALUES (1, ?, ?, UTC_TIMESTAMP(), ?)')
        ->execute([$next, $data, $auth['device']]);
}
$pdo->commit();

json_out(200, ['revision' => $next]);
