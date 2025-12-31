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
    if (isset($data['email'])) {
        $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE email = ?');
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé']);
            exit;
        }
    }
    
    // Créer l'utilisateur si les données sont fournies
    $utilisateurId = null;
    if (isset($data['nom']) && isset($data['prenom']) && isset($data['email'])) {
        // Stocker le mot de passe en clair (non hashé)
        $motDePasse = $data['mot_de_passe'] ?? '';
        
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
    } elseif (isset($data['utilisateur_id'])) {
        $utilisateurId = $data['utilisateur_id'];
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Données utilisateur ou utilisateur_id requis']);
        exit;
    }
    
    // Créer le chauffeur
    $stmt = $pdo->prepare('
        INSERT INTO chauffeurs (utilisateur_id, numero_permis, salaire, date_embauche, statut)
        VALUES (?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $utilisateurId,
        $data['permis'] ?? null,
        $data['salaire'] ?? null,
        $data['date_embauche'] ?? null,
        $data['statut'] ?? 'Actif'
    ]);
    
    $chauffeurId = $pdo->lastInsertId();
    
    // Récupérer le chauffeur créé avec les infos utilisateur
    $stmt = $pdo->prepare('
        SELECT c.*, u.nom, u.prenom, u.email, u.telephone, u.mot_de_passe as user_password
        FROM chauffeurs c
        LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
        WHERE c.id = ?
    ');
    $stmt->execute([$chauffeurId]);
    $chauffeur = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $chauffeur
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création: ' . $e->getMessage()]);
}
?>
