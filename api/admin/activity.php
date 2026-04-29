<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_admin();
require_method('GET');

$sql = "
    (SELECT 'signup' AS type,
            u.id AS user_id,
            u.username,
            u.first_name,
            u.profile_image,
            CONCAT(u.first_name, ' joined HiveFive') AS description,
            u.created_at AS event_at
     FROM users u
     WHERE u.role = 'user'
     ORDER BY u.created_at DESC
     LIMIT 5)

    UNION ALL

    (SELECT 'order_completed' AS type,
            c.id AS user_id,
            c.username,
            c.first_name,
            c.profile_image,
            CONCAT(c.first_name, ' completed an order') AS description,
            o.completed_at AS event_at
     FROM orders o
     JOIN users c ON c.id = o.client_id
     WHERE o.status = 'completed'
     ORDER BY o.completed_at DESC
     LIMIT 5)

    UNION ALL

    (SELECT 'report' AS type,
            reporter.id AS user_id,
            reporter.username,
            reporter.first_name,
            reporter.profile_image,
            CONCAT(reporter.first_name, ' filed a report') AS description,
            r.created_at AS event_at
     FROM reports r
     JOIN users reporter ON reporter.id = r.reporter_id
     ORDER BY r.created_at DESC
     LIMIT 5)

    UNION ALL

    (SELECT 'shop_purchase' AS type,
            u.id AS user_id,
            u.username,
            u.first_name,
            u.profile_image,
            CONCAT(u.first_name, ' purchased ', si.name) AS description,
            sp.created_at AS event_at
     FROM shop_purchases sp
     JOIN users u ON u.id = sp.user_id
     JOIN shop_items si ON si.id = sp.item_id
     ORDER BY sp.created_at DESC
     LIMIT 5)

    ORDER BY event_at DESC
    LIMIT 10
";

$stmt = $pdo->query($sql);
$activity = $stmt->fetchAll();

json_response(['events' => $activity]);
