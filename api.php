<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    $db = Database::getInstance();

    switch ($action) {

        // ── Projects ──────────────────────────────────────────────────────────

        case 'get_projects':
            $stmt = $db->query("SELECT * FROM projects ORDER BY created_at DESC");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
            break;

        case 'create_project':
            $name = trim($_POST['name'] ?? '');
            if ($name === '') throw new InvalidArgumentException('Project name is required');

            $stmt = $db->prepare("INSERT INTO projects (name) VALUES (?)");
            $stmt->execute([$name]);
            $id = (int) $db->lastInsertId();

            $stmt = $db->prepare("SELECT * FROM projects WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
            break;

        case 'update_project':
            $id   = (int) ($_POST['id'] ?? 0);
            $name = trim($_POST['name'] ?? '');
            if (!$id || $name === '') throw new InvalidArgumentException('id and name are required');

            $stmt = $db->prepare("UPDATE projects SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$name, $id]);
            echo json_encode(['success' => true]);
            break;

        case 'delete_project':
            $id = (int) ($_POST['id'] ?? 0);
            if (!$id) throw new InvalidArgumentException('id is required');

            $stmt = $db->prepare("DELETE FROM projects WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;

        // ── Segments ──────────────────────────────────────────────────────────

        case 'get_segments':
            $projectId = (int) ($_GET['project_id'] ?? 0);
            if (!$projectId) throw new InvalidArgumentException('project_id is required');

            $stmt = $db->prepare("SELECT * FROM segments WHERE project_id = ? ORDER BY sort_order ASC, id ASC");
            $stmt->execute([$projectId]);
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
            break;

        case 'get_segment':
            $id = (int) ($_GET['id'] ?? 0);
            if (!$id) throw new InvalidArgumentException('id is required');

            $stmt = $db->prepare("SELECT * FROM segments WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) throw new RuntimeException('Segment not found');
            echo json_encode(['success' => true, 'data' => $row]);
            break;

        case 'create_segment':
            $projectId = (int) ($_POST['project_id'] ?? 0);
            $title     = trim($_POST['title'] ?? '');
            $content   = trim($_POST['content'] ?? '');
            if (!$projectId || $title === '') throw new InvalidArgumentException('project_id and title are required');

            $stmt = $db->prepare("SELECT COALESCE(MAX(sort_order), 0) as max_order FROM segments WHERE project_id = ?");
            $stmt->execute([$projectId]);
            $nextOrder = (int) $stmt->fetch()['max_order'] + 1;

            $stmt = $db->prepare("INSERT INTO segments (project_id, title, content, sort_order) VALUES (?, ?, ?, ?)");
            $stmt->execute([$projectId, $title, $content, $nextOrder]);
            $id = (int) $db->lastInsertId();

            $stmt = $db->prepare("SELECT * FROM segments WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
            break;

        case 'update_segment':
            $id      = (int) ($_POST['id'] ?? 0);
            $title   = trim($_POST['title'] ?? '');
            $content = trim($_POST['content'] ?? '');
            if (!$id || $title === '') throw new InvalidArgumentException('id and title are required');

            $stmt = $db->prepare("UPDATE segments SET title = ?, content = ? WHERE id = ?");
            $stmt->execute([$title, $content, $id]);
            echo json_encode(['success' => true]);
            break;

        case 'delete_segment':
            $id = (int) ($_POST['id'] ?? 0);
            if (!$id) throw new InvalidArgumentException('id is required');

            $stmt = $db->prepare("DELETE FROM segments WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;

        case 'get_segments_by_ids':
            $raw = $_GET['ids'] ?? '';
            $ids = array_values(array_filter(array_map('intval', explode(',', $raw))));
            if (empty($ids)) throw new InvalidArgumentException('ids is required');

            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $db->prepare("SELECT * FROM segments WHERE id IN ($placeholders)");
            $stmt->execute($ids);
            $rows    = $stmt->fetchAll();
            $indexed = array_column($rows, null, 'id');
            $ordered = array_values(array_filter(array_map(fn($id) => $indexed[$id] ?? null, $ids)));
            echo json_encode(['success' => true, 'data' => $ordered]);
            break;

        case 'reorder_segments':
            $raw    = $_POST['orders'] ?? '[]';
            $orders = json_decode($raw, true);
            if (!is_array($orders)) throw new InvalidArgumentException('orders must be a JSON array');

            $stmt = $db->prepare("UPDATE segments SET sort_order = ? WHERE id = ?");
            foreach ($orders as $item) {
                $stmt->execute([(int) $item['order'], (int) $item['id']]);
            }
            echo json_encode(['success' => true]);
            break;

        default:
            throw new InvalidArgumentException('Unknown action: ' . htmlspecialchars($action));
    }

} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
