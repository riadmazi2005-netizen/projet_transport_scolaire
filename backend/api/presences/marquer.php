<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['eleve_id']) || !isset($data['date'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'eleve_id et date requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier si une présence existe déjà pour cet élève et cette date
    $stmt = $pdo->prepare('SELECT * FROM presences WHERE eleve_id = ? AND date = ?');
    $stmt->execute([$data['eleve_id'], $data['date']]);
    $existingPresence = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingPresence) {
        // Mettre à jour la présence existante
        $updateFields = [];
        $updateValues = [];
        
        if (isset($data['present_matin'])) {
            $updateFields[] = 'present_matin = ?';
            $updateValues[] = $data['present_matin'] ? 1 : 0;
        }
        
        if (isset($data['present_soir'])) {
            $updateFields[] = 'present_soir = ?';
            $updateValues[] = $data['present_soir'] ? 1 : 0;
        }
        
        if (isset($data['bus_id'])) {
            $updateFields[] = 'bus_id = ?';
            $updateValues[] = $data['bus_id'];
        }
        
        if (isset($data['responsable_id'])) {
            $updateFields[] = 'responsable_id = ?';
            $updateValues[] = $data['responsable_id'];
        }
        
        if (isset($data['chauffeur_id'])) {
            $updateFields[] = 'chauffeur_id = ?';
            $updateValues[] = $data['chauffeur_id'];
        }
        
        if (isset($data['remarque'])) {
            $updateFields[] = 'remarque = ?';
            $updateValues[] = $data['remarque'];
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Aucune donnée à mettre à jour']);
            exit;
        }
        
        $updateValues[] = $existingPresence['id'];
        $sql = 'UPDATE presences SET ' . implode(', ', $updateFields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($updateValues);
        
        // Récupérer la présence mise à jour
        $stmt = $pdo->prepare('SELECT * FROM presences WHERE id = ?');
        $stmt->execute([$existingPresence['id']]);
        $presence = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $presence,
            'message' => 'Présence mise à jour avec succès'
        ]);
    } else {
        // Créer une nouvelle présence
        $stmt = $pdo->prepare('
            INSERT INTO presences (
                eleve_id, 
                date, 
                present_matin, 
                present_soir, 
                bus_id, 
                responsable_id, 
                chauffeur_id, 
                remarque
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $data['eleve_id'],
            $data['date'],
            isset($data['present_matin']) ? ($data['present_matin'] ? 1 : 0) : 0,
            isset($data['present_soir']) ? ($data['present_soir'] ? 1 : 0) : 0,
            $data['bus_id'] ?? null,
            $data['responsable_id'] ?? null,
            $data['chauffeur_id'] ?? null,
            $data['remarque'] ?? null
        ]);
        
        $presenceId = $pdo->lastInsertId();
        
        // Récupérer la présence créée
        $stmt = $pdo->prepare('SELECT * FROM presences WHERE id = ?');
        $stmt->execute([$presenceId]);
        $presence = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $presence,
            'message' => 'Présence créée avec succès'
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur lors de la sauvegarde de la présence: ' . $e->getMessage()
    ]);
}
?>

