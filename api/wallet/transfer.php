<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$user_id = require_auth();
$data    = get_json_body();

$amount = isset($data['amount']) ? (float) $data['amount'] : 0;
$action = isset($data['action']) ? trim($data['action']) : null;

// Validate amount
if ($amount <= 0) {
    json_response(['error' => 'Amount must be greater than 0'], 400);
}
if ($amount > 9999.99) {
    json_response(['error' => 'Maximum amount is ⬡ 9,999.99 per transaction'], 400);
}

// --- Deposit ---
if ($action === 'deposit') {
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT hivecoin_balance FROM users WHERE id = ? FOR UPDATE');
        $stmt->execute([$user_id]);
        $row = $stmt->fetch();
        $new_balance = (float)$row['hivecoin_balance'] + $amount;

        $pdo->prepare('UPDATE users SET hivecoin_balance = ? WHERE id = ?')->execute([$new_balance, $user_id]);
        $pdo->prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)')->execute([
            $user_id, 'bonus', $amount, 'HiveCoin deposit'
        ]);
        $pdo->commit();
        json_response(['balance' => $new_balance]);
    } catch (Exception $e) {
        $pdo->rollBack();
        json_response(['error' => 'Deposit failed'], 500);
    }
}

// --- Withdraw ---
if ($action === 'withdraw') {
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT hivecoin_balance FROM users WHERE id = ? FOR UPDATE');
        $stmt->execute([$user_id]);
        $balance = (float)$stmt->fetch()['hivecoin_balance'];
        if ($balance < $amount) {
            $pdo->rollBack();
            json_response(['error' => 'Insufficient balance'], 400);
        }
        $new_balance = $balance - $amount;
        $pdo->prepare('UPDATE users SET hivecoin_balance = ? WHERE id = ?')->execute([$new_balance, $user_id]);
        $pdo->prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)')->execute([
            $user_id, 'spending', -$amount, 'HiveCoin withdrawal'
        ]);
        $pdo->commit();
        json_response(['balance' => $new_balance]);
    } catch (Exception $e) {
        $pdo->rollBack();
        json_response(['error' => 'Withdrawal failed'], 500);
    }
}

// --- Peer Transfer (existing behavior) ---
$recipient_id       = isset($data['recipient_id']) ? (int) $data['recipient_id'] : null;
$recipient_username = isset($data['recipient_username']) ? trim($data['recipient_username']) : null;
$recipient_email    = isset($data['recipient_email']) ? trim($data['recipient_email']) : null;

// Resolve recipient
if (!$recipient_id && !$recipient_username && !$recipient_email) {
    json_response(['error' => 'recipient_id, recipient_username, or recipient_email is required'], 400);
}

if ($recipient_email && !$recipient_id) {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $recipient_email]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['error' => 'Recipient not found'], 404);
    }
    $recipient_id = (int) $row['id'];
}

if ($recipient_username && !$recipient_id) {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = :uname");
    $stmt->execute([':uname' => $recipient_username]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['error' => 'Recipient not found'], 404);
    }
    $recipient_id = (int) $row['id'];
}

// Cannot transfer to self
if ($recipient_id === $user_id) {
    json_response(['error' => 'Cannot transfer to yourself'], 400);
}

// Verify recipient exists
$stmt = $pdo->prepare("SELECT id, username, hivecoin_balance FROM users WHERE id = :id");
$stmt->execute([':id' => $recipient_id]);
$recipient = $stmt->fetch();
if (!$recipient) {
    json_response(['error' => 'Recipient not found'], 404);
}

// Perform transfer inside a database transaction with row locking
$pdo->beginTransaction();

try {
    // Lock and check sender balance atomically
    $stmt = $pdo->prepare("SELECT hivecoin_balance FROM users WHERE id = :id FOR UPDATE");
    $stmt->execute([':id' => $user_id]);
    $sender = $stmt->fetch();

    if ((float) $sender['hivecoin_balance'] < $amount) {
        $pdo->rollBack();
        json_response(['error' => 'Insufficient balance'], 400);
    }

    // Deduct from sender
    $stmt = $pdo->prepare("
        UPDATE users SET hivecoin_balance = hivecoin_balance - :amt WHERE id = :id
    ");
    $stmt->execute([':amt' => $amount, ':id' => $user_id]);

    // Add to recipient
    $stmt = $pdo->prepare("
        UPDATE users SET hivecoin_balance = hivecoin_balance + :amt WHERE id = :id
    ");
    $stmt->execute([':amt' => $amount, ':id' => $recipient_id]);

    // Create spending transaction for sender
    $stmt = $pdo->prepare("
        INSERT INTO transactions (user_id, type, amount, description, created_at)
        VALUES (:uid, 'spending', :amt, :desc, NOW())
    ");
    $stmt->execute([
        ':uid'  => $user_id,
        ':amt'  => $amount,
        ':desc' => "Transfer to @{$recipient['username']}",
    ]);

    // Create earning transaction for recipient
    $stmt = $pdo->prepare("
        INSERT INTO transactions (user_id, type, amount, description, created_at)
        VALUES (:uid, 'earning', :amt, :desc, NOW())
    ");
    // Fetch sender username for the description
    $senderStmt = $pdo->prepare("SELECT username FROM users WHERE id = :id");
    $senderStmt->execute([':id' => $user_id]);
    $senderUsername = $senderStmt->fetchColumn();

    $stmt->execute([
        ':uid'  => $recipient_id,
        ':amt'  => $amount,
        ':desc' => "Transfer from @{$senderUsername}",
    ]);

    $pdo->commit();

    // Notify recipient of the transfer
    create_notification(
        $pdo, $recipient_id, 'payment',
        'HiveCoins received',
        "You received ⬡ {$amount} from @{$senderUsername}",
        '/settings',
        $user_id
    );
} catch (Exception $e) {
    $pdo->rollBack();
    json_response(['error' => 'Transfer failed'], 500);
}

// Fetch updated balances
$stmt = $pdo->prepare("SELECT hivecoin_balance FROM users WHERE id = :id");
$stmt->execute([':id' => $user_id]);
$new_sender_balance = (float) $stmt->fetchColumn();

$stmt->execute([':id' => $recipient_id]);
$new_recipient_balance = (float) $stmt->fetchColumn();

json_response([
    'sender_balance' => $new_sender_balance,
    'amount'         => $amount,
]);
