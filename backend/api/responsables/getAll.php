<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$pdo = getDBConnection();
$stmt = $pdo->query('
    SELECT 
        r.*,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.mot_de_passe as user_password,
        u.mot_de_passe_plain,
        u.statut as user_statut
    FROM responsables_bus r
    LEFT JOIN utilisateurs u ON r.utilisateur_id = u.id
    ORDER BY r.date_creation DESC
');
$responsables = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'success' => true,
    'data' => $responsables
]);
?>

