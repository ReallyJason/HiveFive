<?php
require_once __DIR__ . '/helpers.php';

cors();
header('X-Robots-Tag: noindex, nofollow', true);
json_response(['error' => 'Not found'], 404);

