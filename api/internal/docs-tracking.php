<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';

cors();

const DOCS_TRACKING_ALLOWED_DOCS = [
    'mirror-rebuild-guide',
];

const DOCS_TRACKING_ALLOWED_USERS = [
    'intesarjawad',
    'yo-melo',
    'ReallyJason',
    'Shenal121',
    'jecortes7',
];

const DOCS_TRACKING_SERVER_NAME = 'team.random()';
const DOCS_TRACKING_SPRINT_TAGS = [
    'Sprint 1',
    'Sprint 2',
    'Sprint 3',
    'Sprint 4',
];

function docs_tracking_normalize_username($value): string {
    $username = is_string($value) ? trim($value) : '';
    if ($username === '') {
        return '';
    }

    foreach (DOCS_TRACKING_ALLOWED_USERS as $allowedUsername) {
        if (strcasecmp($username, $allowedUsername) === 0) {
            return $allowedUsername;
        }
    }

    return '';
}

function docs_tracking_doc_slug_from_query(): string {
    $slug = trim((string) ($_GET['doc_slug'] ?? 'mirror-rebuild-guide'));
    if ($slug === '' || !in_array($slug, DOCS_TRACKING_ALLOWED_DOCS, true)) {
        json_response(['error' => 'Unsupported docs tracking target'], 400);
    }
    return $slug;
}

function docs_tracking_require_private_access(array $payload): string {
    $username = docs_tracking_normalize_username($payload['username'] ?? null);
    $serverName = isset($payload['server_name']) && is_string($payload['server_name'])
        ? trim($payload['server_name'])
        : '';

    if ($username === '') {
        json_response(['error' => 'Unknown GitHub username'], 403);
    }
    if ($serverName !== DOCS_TRACKING_SERVER_NAME) {
        json_response(['error' => 'Wrong team server name'], 403);
    }

    return $username;
}

function docs_tracking_sanitize_state(array $tracking): array {
    $clean = [];

    foreach ($tracking as $sectionId => $state) {
        if (!is_string($sectionId)) {
            continue;
        }
        $sectionId = trim($sectionId);
        if ($sectionId === '' || strlen($sectionId) > 120) {
            continue;
        }
        if (!is_array($state)) {
            continue;
        }

        $done = !empty($state['done']);
        $frontendDone = !empty($state['frontendDone']);
        $backendDone = !empty($state['backendDone']);

        $frontendOwner = docs_tracking_normalize_username($state['frontendOwner'] ?? null);
        $backendOwner = docs_tracking_normalize_username($state['backendOwner'] ?? null);
        $sprintTag = isset($state['sprintTag']) && is_string($state['sprintTag'])
            ? trim($state['sprintTag'])
            : '';

        if (isset($state['frontendOwner']) && $state['frontendOwner'] !== null && $frontendOwner === '') {
            json_response(['error' => 'Invalid frontend owner'], 400);
        }
        if (isset($state['backendOwner']) && $state['backendOwner'] !== null && $backendOwner === '') {
            json_response(['error' => 'Invalid backend owner'], 400);
        }
        if ($sprintTag !== '' && !in_array($sprintTag, DOCS_TRACKING_SPRINT_TAGS, true)) {
            json_response(['error' => 'Invalid sprint tag'], 400);
        }

        if (!$done && !$frontendDone && !$backendDone && $frontendOwner === '' && $backendOwner === '' && $sprintTag === '') {
            continue;
        }

        $clean[$sectionId] = [
            'done' => $done,
            'frontendOwner' => $frontendOwner !== '' ? $frontendOwner : null,
            'backendOwner' => $backendOwner !== '' ? $backendOwner : null,
            'frontendDone' => $frontendDone,
            'backendDone' => $backendDone,
            'sprintTag' => $sprintTag !== '' ? $sprintTag : null,
        ];
    }

    return $clean;
}

function docs_tracking_load(PDO $pdo, string $docSlug): array {
    $stmt = $pdo->prepare('SELECT tracking_json FROM internal_docs_tracking WHERE doc_slug = ? LIMIT 1');
    $stmt->execute([$docSlug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || !isset($row['tracking_json'])) {
        return [];
    }

    $decoded = json_decode((string) $row['tracking_json'], true);
    if (!is_array($decoded)) {
        return [];
    }

    return docs_tracking_sanitize_state($decoded);
}

function docs_tracking_save(PDO $pdo, string $docSlug, array $tracking, string $updatedByUsername): array {
    $clean = docs_tracking_sanitize_state($tracking);
    $encoded = json_encode($clean, JSON_UNESCAPED_SLASHES);
    if ($encoded === false) {
        json_response(['error' => 'Failed to encode docs tracking state'], 500);
    }

    $stmt = $pdo->prepare('
        INSERT INTO internal_docs_tracking (doc_slug, tracking_json, updated_by_username)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            tracking_json = VALUES(tracking_json),
            updated_by_username = VALUES(updated_by_username)
    ');
    $stmt->execute([$docSlug, $encoded, $updatedByUsername]);

    return $clean;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $username = docs_tracking_require_private_access($_GET);
    $docSlug = docs_tracking_doc_slug_from_query();
    json_response([
        'tracking' => docs_tracking_load($pdo, $docSlug),
        'viewer' => $username,
        'assignees' => array_values(DOCS_TRACKING_ALLOWED_USERS),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $body = get_json_body();
    if (!is_array($body)) {
        json_response(['error' => 'Request body must be a JSON object'], 400);
    }

    $username = docs_tracking_require_private_access($body);
    $docSlug = trim((string) ($body['doc_slug'] ?? 'mirror-rebuild-guide'));
    if ($docSlug === '' || !in_array($docSlug, DOCS_TRACKING_ALLOWED_DOCS, true)) {
        json_response(['error' => 'Unsupported docs tracking target'], 400);
    }

    if (!isset($body['tracking']) || !is_array($body['tracking'])) {
        json_response(['error' => 'tracking must be an object keyed by section id'], 400);
    }

    json_response([
        'tracking' => docs_tracking_save($pdo, $docSlug, $body['tracking'], $username),
    ]);
}

json_response(['error' => 'Method not allowed'], 405);
