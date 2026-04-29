<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

// Check real user is admin via session role directly,
// NOT via require_admin() since that might use the impersonated session
if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'Unauthorized'], 401);
}

if (empty($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    json_response(['error' => 'Not found'], 404);
}

unset($_SESSION['impersonating_user_id']);

json_response(['success' => true]);
