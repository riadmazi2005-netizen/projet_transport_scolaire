<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$userId = $_GET['user_id'] ?? null;
$userType = $_GET['user_type'] ?? null;

if (!$userId || !$userType) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id et user_type sont requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    // Si le type est 'tuteur', on veut récupérer les notifications envoyées au tuteur_id (table tuteurs)
    // ET celles envoyées au user_id (table utilisateurs) car l'admin utilise souvent l'ID utilisateur
    $idsToCheck = [$userId];
    
    if ($userType === 'tuteur') {
        // Vérifier si l'ID fourni est un ID tuteur
        $stmt = $pdo->prepare('SELECT id, utilisateur_id FROM tuteurs WHERE id = ?');
        $stmt->execute([$userId]);
        $tuteur = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($tuteur && $tuteur['utilisateur_id']) {
            // C'est un ID tuteur, on ajoute l'ID utilisateur associé
            if (!in_array($tuteur['utilisateur_id'], $idsToCheck)) {
                $idsToCheck[] = $tuteur['utilisateur_id'];
            }
        } else {
            // Ce n'est peut-être pas un ID tuteur, vérifions si c'est un ID utilisateur
            $stmt = $pdo->prepare('SELECT id, utilisateur_id FROM tuteurs WHERE utilisateur_id = ?');
            $stmt->execute([$userId]);
            $tuteur = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($tuteur) {
                // C'est un ID utilisateur, on ajoute l'ID tuteur
                if (!in_array($tuteur['id'], $idsToCheck)) {
                    $idsToCheck[] = $tuteur['id'];
                }
            }
        }
    }
    
    // Construire la requête pour chercher dans tous les IDs identifiés
    $placeholders = implode(',', array_fill(0, count($idsToCheck), '?'));
    
    // Nous devons passer le type pour chaque ID car destinataire_type est constant ('tuteur')
    // MAIS attendez, si l'admin envoie avec type 'tuteur' vers l'ID utilisateur, c'est bon.
    // L'important est que destinataire_type soit toujours le même ('tuteur').
    
    $sql = "SELECT * FROM notifications 
            WHERE destinataire_type = ? 
            AND destinataire_id IN ($placeholders) 
            ORDER BY date DESC";
            
    $params = array_merge([$userType], $idsToCheck);
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $notifications
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des notifications']);
}



