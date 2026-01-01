<?php
/**
 * Script de diagnostic pour vérifier l'état du compte administrateur
 * Exécutez ce script: http://localhost/backend/check_admin_account.php
 * 
 * Ce script:
 * 1. Vérifie si le compte admin existe
 * 2. Vérifie le format du mot de passe (bcrypt ou clair)
 * 3. Vérifie si l'entrée dans la table administrateurs existe
 * 4. Vérifie le statut du compte
 * 5. Propose des solutions automatiques
 */

require_once 'config/database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = getDBConnection();
    $email = 'admin@transport.ma';
    $password = 'test123';
    
    $diagnostic = [
        'email' => $email,
        'password_test' => $password,
        'checks' => [],
        'issues' => [],
        'fixes' => []
    ];
    
    // Vérification 1: Le compte existe-t-il dans utilisateurs?
    $stmt = $pdo->prepare('SELECT * FROM utilisateurs WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        $diagnostic['checks']['user_exists'] = false;
        $diagnostic['issues'][] = 'Le compte utilisateur n\'existe pas dans la table utilisateurs';
        $diagnostic['fixes'][] = 'Créer le compte utilisateur';
    } else {
        $diagnostic['checks']['user_exists'] = true;
        $diagnostic['user_id'] = $user['id'];
        $diagnostic['user_statut'] = $user['statut'];
        
        // Vérification 2: Le statut est-il "Actif"?
        if ($user['statut'] !== 'Actif') {
            $diagnostic['checks']['user_active'] = false;
            $diagnostic['issues'][] = 'Le statut du compte n\'est pas "Actif" (actuel: ' . $user['statut'] . ')';
            $diagnostic['fixes'][] = 'Mettre à jour le statut à "Actif"';
        } else {
            $diagnostic['checks']['user_active'] = true;
        }
        
        // Vérification 3: Le mot de passe est-il correct?
        $passwordValid = false;
        $passwordFormat = 'unknown';
        
        if (strpos($user['mot_de_passe'], '$2y$') === 0) {
            $passwordFormat = 'bcrypt';
            $passwordValid = password_verify($password, $user['mot_de_passe']);
        } else {
            $passwordFormat = 'plain';
            $passwordValid = ($password === $user['mot_de_passe']);
        }
        
        $diagnostic['checks']['password_format'] = $passwordFormat;
        $diagnostic['checks']['password_valid'] = $passwordValid;
        
        if (!$passwordValid) {
            $diagnostic['issues'][] = 'Le mot de passe ne correspond pas (format: ' . $passwordFormat . ')';
            $diagnostic['fixes'][] = 'Mettre à jour le mot de passe avec le hash bcrypt correct';
        }
        
        // Vérification 4: L'entrée dans administrateurs existe-t-elle?
        $stmt = $pdo->prepare('SELECT * FROM administrateurs WHERE utilisateur_id = ?');
        $stmt->execute([$user['id']]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$admin) {
            $diagnostic['checks']['admin_entry_exists'] = false;
            $diagnostic['issues'][] = 'L\'entrée dans la table administrateurs n\'existe pas';
            $diagnostic['fixes'][] = 'Créer l\'entrée dans la table administrateurs';
        } else {
            $diagnostic['checks']['admin_entry_exists'] = true;
            $diagnostic['admin_id'] = $admin['id'];
        }
    }
    
    // Résumé
    $allChecksPass = 
        ($diagnostic['checks']['user_exists'] ?? false) &&
        ($diagnostic['checks']['user_active'] ?? false) &&
        ($diagnostic['checks']['password_valid'] ?? false) &&
        ($diagnostic['checks']['admin_entry_exists'] ?? false);
    
    $diagnostic['all_checks_pass'] = $allChecksPass;
    
    // Si des problèmes sont détectés, proposer une correction automatique
    if (!$allChecksPass && isset($_GET['fix']) && $_GET['fix'] === 'true') {
        $fixesApplied = [];
        
        // Fix 1: Créer le compte s'il n'existe pas
        if (!($diagnostic['checks']['user_exists'] ?? false)) {
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare('INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute(['Admin', 'Système', $email, $password_hash, '0612345678', 'Actif']);
            $userId = $pdo->lastInsertId();
            $fixesApplied[] = 'Compte utilisateur créé (ID: ' . $userId . ')';
            $diagnostic['user_id'] = $userId;
        } else {
            $userId = $user['id'];
        }
        
        // Fix 2: Mettre à jour le statut
        if (!($diagnostic['checks']['user_active'] ?? false)) {
            $stmt = $pdo->prepare('UPDATE utilisateurs SET statut = ? WHERE id = ?');
            $stmt->execute(['Actif', $userId]);
            $fixesApplied[] = 'Statut mis à jour à "Actif"';
        }
        
        // Fix 3: Mettre à jour le mot de passe
        if (!($diagnostic['checks']['password_valid'] ?? false)) {
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare('UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?');
            $stmt->execute([$password_hash, $userId]);
            $fixesApplied[] = 'Mot de passe mis à jour avec hash bcrypt';
        }
        
        // Fix 4: Créer l'entrée dans administrateurs
        if (!($diagnostic['checks']['admin_entry_exists'] ?? false)) {
            $stmt = $pdo->prepare('INSERT INTO administrateurs (utilisateur_id) VALUES (?)');
            $stmt->execute([$userId]);
            $adminId = $pdo->lastInsertId();
            $fixesApplied[] = 'Entrée créée dans la table administrateurs (ID: ' . $adminId . ')';
        }
        
        $diagnostic['fixes_applied'] = $fixesApplied;
        $diagnostic['message'] = 'Corrections appliquées avec succès!';
    } else if (!$allChecksPass) {
        $diagnostic['message'] = 'Des problèmes ont été détectés. Ajoutez ?fix=true à l\'URL pour les corriger automatiquement.';
    } else {
        $diagnostic['message'] = 'Tous les checks sont passés! Le compte admin est correctement configuré.';
    }
    
    echo json_encode($diagnostic, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>

