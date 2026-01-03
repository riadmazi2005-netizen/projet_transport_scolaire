<?php
// Désactiver l'affichage des erreurs pour éviter du HTML dans la réponse JSON
error_reporting(0);
ini_set('display_errors', 0);

require_once '../../config/headers.php';
require_once '../../config/database.php';

try {
    $responsable_id = $_GET['responsable_id'] ?? null;
    if (!$responsable_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'responsable_id requis']);
        exit;
    }

    $pdo = getDBConnection();
    if (!$pdo) {
        throw new Exception('Impossible de se connecter à la base de données');
    }

    // Vérifier si la colonne responsable_id existe
    $columnExists = false;
    try {
        $checkColumn = $pdo->query("SHOW COLUMNS FROM accidents LIKE 'responsable_id'");
        $columnExists = $checkColumn && $checkColumn->rowCount() > 0;
    } catch (PDOException $e) {
        $columnExists = false;
    }

    if ($columnExists) {
        // Si la colonne existe, utiliser responsable_id directement
        $stmt = $pdo->prepare('
            SELECT 
                a.*,
                b.numero as bus_numero,
                u.nom as chauffeur_nom,
                u.prenom as chauffeur_prenom
            FROM accidents a
            LEFT JOIN bus b ON a.bus_id = b.id
            LEFT JOIN chauffeurs c ON a.chauffeur_id = c.id
            LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
            WHERE a.responsable_id = ? OR (a.bus_id IS NOT NULL AND b.responsable_id = ?)
            ORDER BY a.date DESC, a.heure DESC
        ');
        $stmt->execute([$responsable_id, $responsable_id]);
    } else {
        // Sinon, chercher via le bus
        $stmt = $pdo->prepare('
            SELECT 
                a.*,
                b.numero as bus_numero,
                u.nom as chauffeur_nom,
                u.prenom as chauffeur_prenom
            FROM accidents a
            LEFT JOIN bus b ON a.bus_id = b.id
            LEFT JOIN chauffeurs c ON a.chauffeur_id = c.id
            LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
            WHERE b.responsable_id = ?
            ORDER BY a.date DESC, a.heure DESC
        ');
        $stmt->execute([$responsable_id]);
    }
    
    $accidents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Décoder les photos pour chaque accident
    foreach ($accidents as &$accident) {
        if (isset($accident['photos']) && $accident['photos']) {
            $decoded = json_decode($accident['photos'], true);
            if ($decoded !== null) {
                $accident['photos'] = $decoded;
            }
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $accidents
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
?>

