<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

try {
    $pdo = getDBConnection();
    
    // Préparer les valeurs pour l'insertion
    $date = $data['date'] ?? null;
    $heure = $data['heure'] ?? null;
    $bus_id = isset($data['bus_id']) && $data['bus_id'] !== '' ? (int)$data['bus_id'] : null;
    $chauffeur_id = isset($data['chauffeur_id']) && $data['chauffeur_id'] !== '' ? (int)$data['chauffeur_id'] : null;
    $responsable_id = isset($data['responsable_id']) && $data['responsable_id'] !== '' ? (int)$data['responsable_id'] : null;
    $description = $data['description'] ?? '';
    $degats = $data['degats'] ?? null;
    $lieu = $data['lieu'] ?? null;
    $gravite = $data['gravite'] ?? 'Légère';
    $blesses = isset($data['blesses']) ? (bool)$data['blesses'] : false;
    $nombre_eleves = isset($data['nombre_eleves']) ? (int)$data['nombre_eleves'] : null;
    $nombre_blesses = isset($data['nombre_blesses']) ? (int)$data['nombre_blesses'] : null;
    $photos = isset($data['photos']) ? json_encode($data['photos']) : null;
    
    if (!$date || !$description || !$gravite) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Date, description et gravité sont obligatoires']);
        exit;
    }
    
    // Si pas de bus_id mais qu'on a un responsable_id, essayer de trouver le bus
    if (!$bus_id && $responsable_id) {
        $stmt = $pdo->prepare('SELECT id FROM bus WHERE responsable_id = ? LIMIT 1');
        $stmt->execute([$responsable_id]);
        $bus = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($bus) {
            $bus_id = $bus['id'];
        }
    }
    
    $stmt = $pdo->prepare('
        INSERT INTO accidents (
            date, heure, bus_id, chauffeur_id, description, degats, lieu, gravite, blesses,
            nombre_eleves, nombre_blesses, photos
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $date,
        $heure,
        $bus_id,
        $chauffeur_id,
        $description,
        $degats,
        $lieu,
        $gravite,
        $blesses ? 1 : 0,
        $nombre_eleves,
        $nombre_blesses,
        $photos
    ]);
    
    $accidentId = $pdo->lastInsertId();
    
    // Mettre à jour le compteur d'accidents du chauffeur si un chauffeur est spécifié
    if ($chauffeur_id) {
        $stmt = $pdo->prepare('
            UPDATE chauffeurs 
            SET nombre_accidents = nombre_accidents + 1 
            WHERE id = ?
        ');
        $stmt->execute([$chauffeur_id]);
        
        // Vérifier si le chauffeur a maintenant 3 accidents ou plus
        $stmt = $pdo->prepare('SELECT nombre_accidents FROM chauffeurs WHERE id = ?');
        $stmt->execute([$chauffeur_id]);
        $chauffeur = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($chauffeur && $chauffeur['nombre_accidents'] >= 3) {
            // Mettre le statut à Licencié
            $stmt = $pdo->prepare('UPDATE chauffeurs SET statut = ? WHERE id = ?');
            $stmt->execute(['Licencié', $chauffeur_id]);
            
            // Récupérer l'utilisateur_id du chauffeur pour la notification
            $stmt = $pdo->prepare('SELECT utilisateur_id FROM chauffeurs WHERE id = ?');
            $stmt->execute([$chauffeur_id]);
            $chauffeurData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($chauffeurData) {
                $stmt = $pdo->prepare('
                    INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type)
                    VALUES (?, ?, ?, ?, ?)
                ');
                $stmt->execute([
                    $chauffeurData['utilisateur_id'],
                    'chauffeur',
                    'Licenciement',
                    'Suite à votre 3ème accident, vous êtes licencié avec une amende de 1000 DH conformément au règlement.',
                    'alerte'
                ]);
            }
        }
    }
    
    // Envoyer une notification à tous les admins
    $stmt = $pdo->query('
        SELECT u.id 
        FROM utilisateurs u
        INNER JOIN administrateurs a ON a.utilisateur_id = u.id
    ');
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $busNumero = '';
    if ($bus_id) {
        $stmt = $pdo->prepare('SELECT numero FROM bus WHERE id = ?');
        $stmt->execute([$bus_id]);
        $busData = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($busData) {
            $busNumero = $busData['numero'];
        }
    }
    
    $declarant = '';
    if ($chauffeur_id) {
        $stmt = $pdo->prepare('SELECT nom, prenom FROM chauffeurs WHERE id = ?');
        $stmt->execute([$chauffeur_id]);
        $chauffeurData = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($chauffeurData) {
            $declarant = $chauffeurData['prenom'] . ' ' . $chauffeurData['nom'] . ' (Chauffeur)';
        }
    } elseif ($responsable_id) {
        $stmt = $pdo->prepare('
            SELECT u.nom, u.prenom 
            FROM responsables_bus r
            INNER JOIN utilisateurs u ON r.utilisateur_id = u.id
            WHERE r.id = ?
        ');
        $stmt->execute([$responsable_id]);
        $responsableData = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($responsableData) {
            $declarant = $responsableData['prenom'] . ' ' . $responsableData['nom'] . ' (Responsable)';
        }
    }
    
    foreach ($admins as $admin) {
        $message = "Un nouvel accident a été déclaré.\n\n";
        $message .= "Déclaré par: " . $declarant . "\n";
        $message .= "Date: " . $date . ($heure ? " à " . $heure : "") . "\n";
        if ($busNumero) {
            $message .= "Bus: " . $busNumero . "\n";
        }
        $message .= "Gravité: " . $gravite . "\n";
        $message .= "Description: " . substr($description, 0, 100) . "...";
        
        $stmt = $pdo->prepare('
            INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $admin['id'],
            'admin',
            'Nouvel accident déclaré',
            $message,
            'alerte'
        ]);
    }
    
    // Récupérer l'accident créé
    $stmt = $pdo->prepare('SELECT * FROM accidents WHERE id = ?');
    $stmt->execute([$accidentId]);
    $accident = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Décoder les photos si présentes
    if ($accident['photos']) {
        $accident['photos'] = json_decode($accident['photos'], true);
    }
    
    echo json_encode([
        'success' => true,
        'data' => $accident
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création: ' . $e->getMessage()]);
}
?>

