<?php
require_once __DIR__ . '/../helpers.php';
cors();

// AI features are currently disabled
json_response(['error' => 'AI features are currently disabled'], 503);

/*
require_once __DIR__ . '/../db_config.php';
... rest of the code ...
*/
