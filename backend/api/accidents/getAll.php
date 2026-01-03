<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once '../../config/headers.php';
require_once '../../config/database.php';

$pdo = getDBConnection();
$stmt = $pdo->query('
    SELECT 
        a.*,
        b.numero as bus_numero,
        u_chauffeur.nom as chauffeur_nom,
        u_chauffeur.prenom as chauffeur_prenom,
        r.id as responsable_id,
        r.zone_responsabilite,
        u_responsable.nom as responsable_nom,
        u_responsable.prenom as responsable_prenom
    FROM accidents a
    LEFT JOIN bus b ON a.bus_id = b.id
    LEFT JOIN chauffeurs c ON a.chauffeur_id = c.id
    LEFT JOIN utilisateurs u_chauffeur ON c.utilisateur_id = u_chauffeur.id
    LEFT JOIN responsables_bus r ON b.responsable_id = r.id OR a.responsable_id = r.id
    LEFT JOIN utilisateurs u_responsable ON r.utilisateur_id = u_responsable.id
    ORDER BY a.date DESC, a.heure DESC
');
$accidents = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Décoder les champs JSON pour chaque accident
foreach ($accidents as &$accident) {
    if (isset($accident['photos']) && $accident['photos']) {
        try {
            $decoded = json_decode($accident['photos'], true);
            if ($decoded !== null) {
                $accident['photos'] = $decoded;
            }
        } catch (Exception $e) {
            // Garder la valeur originale si le décodage échoue
        }
    }
    if (isset($accident['eleves_concernees']) && $accident['eleves_concernees']) {
        try {
            $decoded = json_decode($accident['eleves_concernees'], true);
            if ($decoded !== null) {
                $accident['eleves_concernees'] = $decoded;
            }
        } catch (Exception $e) {
            // Garder la valeur originale si le décodage échoue
        }
    }
}

echo json_encode([
    'success' => true,
    'data' => $accidents
]);
?>

