<?php
require_once __DIR__ . '/../helpers.php';
cors();
require_method('POST');

$_SESSION = [];
session_destroy();

json_response(['ok' => true]);
