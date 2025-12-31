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
    
    // Vérifier si l'email existe déjà
    $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE email = ?');
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé']);
        exit;
    }
    
    // Stocker le mot de passe en clair (non hashé)
    $motDePasse = $data['mot_de_passe'] ?? '';
    
    // Créer l'utilisateur
    $stmt = $pdo->prepare('
        INSERT INTO utilisateurs (nom, prenom, email, telephone, mot_de_passe, statut)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $data['nom'],
        $data['prenom'],
        $data['email'],
        $data['telephone'] ?? null,
        $motDePasse, // Mot de passe en clair
        $data['statut'] ?? 'Actif'
    ]);
    
    $utilisateurId = $pdo->lastInsertId();
    
    // Créer le responsable
    $stmt = $pdo->prepare('
        INSERT INTO responsables_bus (utilisateur_id, zone_responsabilite, statut)
        VALUES (?, ?, ?)
    ');
    $stmt->execute([
        $utilisateurId,
        $data['zone_responsabilite'] ?? null,
        $data['statut'] ?? 'Actif'
    ]);
    
    $responsableId = $pdo->lastInsertId();
    
    // Récupérer le responsable créé avec les infos utilisateur
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
    $stmt->execute([$responsableId]);
    $responsable = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $responsable
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création: ' . $e->getMessage()]);
}
?>

