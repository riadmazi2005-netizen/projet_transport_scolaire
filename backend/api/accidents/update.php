<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de l\'accident requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier que l'accident existe
    $stmt = $pdo->prepare('SELECT * FROM accidents WHERE id = ?');
    $stmt->execute([$data['id']]);
    $existingAccident = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existingAccident) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Accident non trouvé']);
        exit;
    }
    
    // Préparer les valeurs pour la mise à jour
    $date = $data['date'] ?? $existingAccident['date'];
    $heure = $data['heure'] ?? $existingAccident['heure'];
    $bus_id = isset($data['bus_id']) && $data['bus_id'] !== '' ? (int)$data['bus_id'] : $existingAccident['bus_id'];
    $description = $data['description'] ?? $existingAccident['description'];
    $degats = $data['degats'] ?? $existingAccident['degats'];
    $lieu = $data['lieu'] ?? $existingAccident['lieu'];
    $gravite = $data['gravite'] ?? $existingAccident['gravite'];
    $blesses = isset($data['blesses']) ? (bool)$data['blesses'] : ($existingAccident['blesses'] ?? false);
    $nombre_eleves = isset($data['nombre_eleves']) && $data['nombre_eleves'] !== '' ? (int)$data['nombre_eleves'] : $existingAccident['nombre_eleves'];
    $nombre_blesses = isset($data['nombre_blesses']) && $data['nombre_blesses'] !== '' ? (int)$data['nombre_blesses'] : ($existingAccident['nombre_blesses'] ?? 0);
    
    // Gérer les photos
    $photos = null;
    if (isset($data['photos']) && is_array($data['photos']) && count($data['photos']) > 0) {
        $photos = json_encode($data['photos']);
    } elseif (isset($data['photos']) && $data['photos'] !== null) {
        // Si les photos existent déjà, les garder
        $photos = $existingAccident['photos'];
    } else {
        $photos = $existingAccident['photos'];
    }
    
    $elevesConcernees = isset($data['eleves_concernees']) ? json_encode($data['eleves_concernees']) : $existingAccident['eleves_concernees'];
    
    // Vérifier quelles colonnes existent dans la table accidents
    $checkResponsable = $pdo->query("SHOW COLUMNS FROM accidents LIKE 'responsable_id'");
    $hasResponsable = $checkResponsable->rowCount() > 0;
    
    // Construire la requête de mise à jour
    $updateFields = [
        'date = ?',
        'heure = ?',
        'bus_id = ?',
        'description = ?',
        'degats = ?',
        'lieu = ?',
        'gravite = ?',
        'blesses = ?',
        'nombre_eleves = ?',
        'nombre_blesses = ?',
        'photos = ?',
        'eleves_concernees = ?'
    ];
    
    $updateValues = [
        $date,
        $heure,
        $bus_id,
        $description,
        $degats,
        $lieu,
        $gravite,
        $blesses ? 1 : 0,
        $nombre_eleves,
        $nombre_blesses,
        $photos,
        $elevesConcernees
    ];
    
    if ($hasResponsable && isset($data['responsable_id'])) {
        $updateFields[] = 'responsable_id = ?';
        $updateValues[] = isset($data['responsable_id']) && $data['responsable_id'] !== '' ? (int)$data['responsable_id'] : $existingAccident['responsable_id'];
    }
    
    if (isset($data['chauffeur_id'])) {
        $updateFields[] = 'chauffeur_id = ?';
        $updateValues[] = isset($data['chauffeur_id']) && $data['chauffeur_id'] !== '' ? (int)$data['chauffeur_id'] : $existingAccident['chauffeur_id'];
    }
    
    $updateValues[] = $data['id'];
    
    $sql = 'UPDATE accidents SET ' . implode(', ', $updateFields) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($updateValues);
    
    // Récupérer l'accident mis à jour
    $stmt = $pdo->prepare('SELECT * FROM accidents WHERE id = ?');
    $stmt->execute([$data['id']]);
    $updatedAccident = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Décoder les photos si présentes
    if ($updatedAccident['photos']) {
        try {
            $updatedAccident['photos'] = json_decode($updatedAccident['photos'], true);
        } catch (Exception $e) {
            // Garder la valeur originale si le décodage échoue
        }
    }
    
    // Décoder les élèves concernés si présents
    if ($updatedAccident['eleves_concernees']) {
        try {
            $updatedAccident['eleves_concernees'] = json_decode($updatedAccident['eleves_concernees'], true);
        } catch (Exception $e) {
            // Garder la valeur originale si le décodage échoue
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Accident mis à jour avec succès',
        'data' => $updatedAccident
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>

