<?php
// One-time setup: you enter the database details and choose your sync passcode here.
// It creates the tables and writes config.php (passcode stored only as a hash), then
// refuses to run again. To change the passcode later, delete api/config.php in Plesk's
// File Manager and open this page again — your saved data is kept.
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('Content-Type: text/html; charset=utf-8');

$done = is_file(CONFIG_FILE);
$error = null;
$success = false;
$v = ['db_host' => 'localhost', 'db_name' => '', 'db_user' => ''];

if (!$done && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    foreach ($v as $k => $_) {
        $v[$k] = trim((string)($_POST[$k] ?? ''));
    }
    $dbPass = (string)($_POST['db_pass'] ?? '');
    $pass = (string)($_POST['passcode'] ?? '');
    $pass2 = (string)($_POST['passcode2'] ?? '');

    if ($v['db_name'] === '' || $v['db_user'] === '') {
        $error = 'Please fill in the database name and user.';
    } elseif (mb_strlen($pass) < 8) {
        $error = 'Please choose a passcode of at least 8 characters.';
    } elseif ($pass !== $pass2) {
        $error = "The two passcodes don't match.";
    } else {
        try {
            $pdo = connect_db($v['db_host'], $v['db_name'], $v['db_user'], $dbPass);
            foreach (schema_sql() as $sql) {
                $pdo->exec($sql);
            }
            $config = [
                'db_host' => $v['db_host'],
                'db_name' => $v['db_name'],
                'db_user' => $v['db_user'],
                'db_pass' => $dbPass,
                'passcode_hash' => password_hash($pass, PASSWORD_DEFAULT),
            ];
            $php = "<?php\n// Written by setup.php. Keep private.\nreturn " . var_export($config, true) . ";\n";
            if (file_put_contents(CONFIG_FILE, $php, LOCK_EX) === false) {
                throw new RuntimeException('Could not write config.php (folder not writable).');
            }
            @chmod(CONFIG_FILE, 0600);
            $success = true;
        } catch (PDOException $e) {
            $error = "Couldn't connect to the database. Check the name, user and password. ("
                . $e->getCode() . ')';
        } catch (Throwable $e) {
            $error = $e->getMessage();
        }
    }
}

function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>StrongLifts sync setup</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #030712; color: #e5e7eb; font: 16px/1.5 -apple-system, system-ui, sans-serif; }
  main { max-width: 28rem; margin: 0 auto; padding: 2rem 1rem; }
  h1 { font-size: 1.4rem; margin: 0 0 .25rem; }
  h2 { font-size: 1rem; margin: 1.5rem 0 .5rem; color: #47c23f; }
  p { color: #9ca3af; margin: .25rem 0 1rem; }
  label { display: block; margin: .75rem 0 .25rem; font-size: .9rem; }
  input { box-sizing: border-box; width: 100%; padding: .6rem .7rem; border-radius: .5rem; border: 1px solid #374151; background: #111827; color: #f9fafb; font-size: 1rem; }
  input:focus { outline: none; border-color: #47c23f; }
  button { margin-top: 1.5rem; width: 100%; padding: .8rem; border: 0; border-radius: .6rem; background: #3da836; color: #fff; font-size: 1rem; font-weight: 600; }
  .box { padding: .8rem 1rem; border-radius: .6rem; margin: 1rem 0; }
  .err { background: #450a0a; color: #fecaca; }
  .ok { background: #14361a; color: #bbf7d0; }
  small { color: #6b7280; }
</style>
</head>
<body>
<main>
  <h1>StrongLifts sync setup</h1>
<?php if ($success): ?>
  <div class="box ok"><strong>All set.</strong> The database is ready and your passcode is saved.</div>
  <p>Open the app, go to <strong>Settings → Sync</strong> and enter your passcode on each device.
     This page is now switched off.</p>
<?php elseif ($done): ?>
  <div class="box ok">Sync is already set up.</div>
  <p>To change the passcode, delete <code>api/config.php</code> in Plesk's File Manager and reload this page.</p>
<?php else: ?>
  <p>This runs once. Nothing you enter here is shown to anyone; the passcode is stored only in scrambled (hashed) form.</p>
  <?php if ($error): ?><div class="box err"><?= h($error) ?></div><?php endif; ?>
  <form method="post" autocomplete="off">
    <h2>Database (from Plesk → Databases)</h2>
    <label for="db_name">Database name</label>
    <input id="db_name" name="db_name" value="<?= h($v['db_name']) ?>" required>
    <label for="db_user">Database user</label>
    <input id="db_user" name="db_user" value="<?= h($v['db_user']) ?>" required>
    <label for="db_pass">Database user's password</label>
    <input id="db_pass" name="db_pass" type="password" required>
    <label for="db_host">Database server</label>
    <input id="db_host" name="db_host" value="<?= h($v['db_host']) ?>" required>
    <small>Leave as "localhost" unless Plesk shows something different.</small>

    <h2>Your sync passcode</h2>
    <p>You'll type this once on each device. At least 8 characters.</p>
    <label for="passcode">Passcode</label>
    <input id="passcode" name="passcode" type="password" minlength="8" required autocomplete="new-password">
    <label for="passcode2">Passcode again</label>
    <input id="passcode2" name="passcode2" type="password" minlength="8" required autocomplete="new-password">

    <button type="submit">Set up sync</button>
  </form>
<?php endif; ?>
</main>
</body>
</html>
