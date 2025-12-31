<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID requis']);
    exit;
}

$pdo = getDBConnection();
$stmt = $pdo->prepare('
    SELECT 
        r.*,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.mot_de_passe,
        u.statut as user_statut
    FROM responsables_bus r
    LEFT JOIN utilisateurs u ON r.utilisateur_id = u.id
    WHERE r.id = ?
');
$stmt->execute([$id]);
$responsable = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    'success' => true,
    'data' => $responsable ?: null
]);
?>

