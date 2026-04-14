<?php
/**
 * Endpoint pour enregistrer un lead dans Airtable.
 * Si Airtable échoue, envoie un email de secours.
 */

// Charger les variables d'environnement
require_once __DIR__ . '/load-env.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Seulement POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// --- Configuration : .env ou SetEnv (.htaccess) — sur certains hébergeurs getenv() ne lit pas SetEnv, d'où le fallback $_SERVER
$airtableToken = getenv('AIRTABLE_TOKEN') ?: ($_SERVER['AIRTABLE_TOKEN'] ?? '');
$baseId        = getenv('AIRTABLE_BASE_ID') ?: ($_SERVER['AIRTABLE_BASE_ID'] ?? '');
$tableId       = getenv('AIRTABLE_TABLE_ID') ?: ($_SERVER['AIRTABLE_TABLE_ID'] ?? '');
$backupEmail   = getenv('BACKUP_EMAIL') ?: ($_SERVER['BACKUP_EMAIL'] ?? 'contact@groupe-effinor.fr');

if (!$airtableToken) {
    error_log('[DESTRAT] Missing AIRTABLE_TOKEN. Configurez api/.env sur le serveur (AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID) ou SetEnv dans .htaccess.');
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server misconfigured', 'detail' => 'AIRTABLE_TOKEN manquant. Créez api/.env sur le serveur.']);
    exit;
}
if (!$baseId || !$tableId) {
    error_log('[DESTRAT] Missing AIRTABLE_BASE_ID or AIRTABLE_TABLE_ID');
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server misconfigured', 'detail' => 'BASE_ID ou TABLE_ID manquant dans api/.env']);
    exit;
}

// --- Lecture du body JSON ---
$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON body']);
    exit;
}

// --- Honeypot anti-spam ---
if (!empty($data['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

// --- Mode (step1 create vs full submit / update) ---
$stage = isset($data['stage']) ? (string) $data['stage'] : '';
$isStep1 = ($stage === 'step1');
$recordId = !empty($data['recordId']) ? (string) $data['recordId'] : '';

// --- Validation des champs requis ---
if ($isStep1) {
    // Création du record au passage Step 1 -> Step 2 (pas de téléphone à ce stade)
    $required = ['surface'];
    // On accepte soit postalCode (préféré) soit departement
    if (empty($data['postalCode']) && empty($data['departement'])) {
        $required[] = 'departement';
    }
} else {
    $required = ['telephone', 'surface', 'departement'];
}

$missing = [];
foreach ($required as $field) {
    if (empty($data[$field])) {
        $missing[] = $field;
    }
}
if (count($missing) > 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields: ' . implode(', ', $missing)]);
    exit;
}

// --- Validation email (si fourni) ---
if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email']);
    exit;
}

// --- Validation type client (bloquer particuliers) ---
if (!empty($data['clientType']) && $data['clientType'] === 'Particulier') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Solution réservée aux professionnels']);
    exit;
}

// --- Validation téléphone (hors step1) ---
if (!$isStep1) {
    $phoneDigits = preg_replace('/\D/', '', $data['telephone']);
    if (strlen($phoneDigits) < 8) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid phone number']);
        exit;
    }
}

// --- Fonction de log ---
function logLead($data, $status, $error = '') {
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/leads_' . date('Y-m') . '.log';
    $logEntry = [
        'date' => date('Y-m-d H:i:s'),
        'status' => $status,
        'nom' => $data['nom'] ?? '',
        'email' => $data['email'] ?? '',
        'telephone' => $data['telephone'] ?? '',
        'clientType' => $data['clientType'] ?? '',
        'error' => $error
    ];
    
    file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
}

// --- Fonction d'envoi d'email de secours ---
function sendBackupEmail($data, $backupEmail, $errorReason = '') {
    $nomDisplay = $data['nom'] ?? $data['telephone'] ?? 'Sans nom';
    $subject = "=?UTF-8?B?" . base64_encode("🚨 [LEAD DESTRAT] " . $nomDisplay . " - " . $data['departement']) . "?=";
    
    $body = "
═══════════════════════════════════════
🚨 NOUVEAU LEAD DESTRATIFICATEUR
═══════════════════════════════════════

👤 CONTACT
───────────────────────────────────────
Nom      : " . ($data['nom'] ?? 'Non renseigné') . "
Société  : " . ($data['societe'] ?? 'Non renseigné') . "
Email    : " . ($data['email'] ?? 'Non renseigné') . "
Tél      : " . ($data['telephone'] ?? 'Non renseigné') . "
Dépt     : {$data['departement']}
Type     : " . ($data['clientType'] ?? 'Non renseigné') . "
Chauffage: " . ($data['modeChauffage'] ?? 'Non renseigné') . "
Fonction : " . ($data['fonction'] ?? 'Non renseigné') . "

🏭 BÂTIMENT
───────────────────────────────────────
Surface  : {$data['surface']}
" . (!empty($data['hauteur']) ? "Hauteur  : {$data['hauteur']}\n" : "") . 
(!empty($data['chauffe']) ? "Chauffé  : {$data['chauffe']}\n" : "") . "

📐 DONNÉES SIMULATEUR (technique)
───────────────────────────────────────
Consigne : " . ($data['consigne'] ?? '') . "
Puissance chauffage (kW) : " . (isset($data['puissanceChauffage']) ? $data['puissanceChauffage'] : '') . "
Volume (m³) : " . (isset($data['volume']) ? $data['volume'] : '') . "
Taux brassage (vol/h) : " . (isset($data['tauxBrassage']) ? $data['tauxBrassage'] : '') . "
Nb déstratificateurs : " . (isset($data['nbDestratificateurs']) ? $data['nbDestratificateurs'] : '') . "
Consommation annuelle (kWh) : " . (isset($data['consommationKwhAn']) ? $data['consommationKwhAn'] : '') . "
Économie 30% (kWh) : " . (isset($data['economie30Kwh']) ? $data['economie30Kwh'] : '') . "
Économie 30% (€) : " . (isset($data['economie30Euro']) ? $data['economie30Euro'] : (isset($data['economie30EuroMin'], $data['economie30EuroMax']) ? $data['economie30EuroMin'] . ' à ' . $data['economie30EuroMax'] : '') ) . "
Coût annuel estimé (€) : " . (isset($data['coutAnnuelEstime']) ? $data['coutAnnuelEstime'] : (isset($data['coutAnnuelMin'], $data['coutAnnuelMax']) ? $data['coutAnnuelMin'] . ' à ' . $data['coutAnnuelMax'] : '') ) . "

⚠️ STATUT AIRTABLE
───────────────────────────────────────
" . ($errorReason ? "ÉCHEC: $errorReason\n⚠️ CRÉER MANUELLEMENT DANS AIRTABLE" : "Enregistré avec succès") . "

───────────────────────────────────────
Date: " . date('d/m/Y H:i:s') . "
Source: Landing Destratificateur
═══════════════════════════════════════
";

    $replyTo = !empty($data['email']) ? $data['email'] : 'noreply@groupe-effinor.fr';
    $headers = [
        'From: noreply@groupe-effinor.fr',
        'Reply-To: ' . $replyTo,
        'Content-Type: text/plain; charset=UTF-8',
        'X-Mailer: PHP/' . phpversion()
    ];

    return @mail($backupEmail, $subject, $body, implode("\r\n", $headers));
}

// --- Construction du payload Airtable (uniquement les champs non vides) ---
$fields = [];
if (!empty($data['telephone'])) {
    $fields['Téléphone'] = $data['telephone'];
}
if (!empty($data['surface'])) {
    $fields['Surface approximative'] = $data['surface'];
}
// Airtable: la colonne "Département" contient le code postal (selon votre base)
if (!empty($data['postalCode']) || !empty($data['departement'])) {
    $fields['Département'] = !empty($data['postalCode']) ? $data['postalCode'] : $data['departement'];
}

// Champs optionnels (ajoutés seulement s'ils ne sont pas vides)
if (!empty($data['nom'])) {
    $fields['Nom complet'] = $data['nom'];
}
if (!empty($data['societe'])) {
    $fields['Société'] = $data['societe'];
}
if (!empty($data['email'])) {
    $fields['Email'] = $data['email'];
}
if (!empty($data['clientType'])) {
    $fields['Type de local'] = $data['clientType'];
}
if (!empty($data['modeChauffage'])) {
    $fields['Mode de chauffage'] = $data['modeChauffage'];
}
if (!empty($data['fonction'])) {
    $fields['Fonction'] = $data['fonction'];
}
if (!empty($data['gclid'])) {
    $fields['gclid'] = $data['gclid'];
}
if (!empty($data['utm_source'])) {
    $fields['utm_source'] = $data['utm_source'];
}
if (!empty($data['utm_campaign'])) {
    $fields['utm_campaign'] = $data['utm_campaign'];
}
// Note: certains Airtable n'ont pas la colonne "Créneau rappel" → on le conserve dans le rapport Consigne.

// Champ "Consigne" : texte enrichi et explicatif (données simulateur + calculs)
$puissance = isset($data['puissanceChauffage']) && $data['puissanceChauffage'] !== '' && $data['puissanceChauffage'] !== null
    ? (float) $data['puissanceChauffage'] : null;
$isIndustriel = !empty($data['clientType']) && $data['clientType'] === 'Site industriel / logistique';
$calculFormule = null;
if ($puissance !== null) {
    $calculFormule = $isIndustriel ? round(7.1 * $puissance * 7.3, 2) : round(3.9 * $puissance * 7.3, 2);
}
$fmt = function ($n) { return $n !== null && $n !== '' ? number_format((float) $n, 0, ',', ' ') : '—'; };
$fmtDec = function ($n) { return $n !== null && $n !== '' ? number_format((float) $n, 2, ',', ' ') : '—'; };

// Coût d'installation (calculé en amont pour scoring et Consigne)
$prixUnitaire = 0;
if (!empty($data['consigne'])) {
    if (strpos($data['consigne'], 'ONSEN-DS3') !== false) {
        $prixUnitaire = 1250;
    } elseif (strpos($data['consigne'], 'ONSEN-DS7') !== false) {
        $prixUnitaire = 1350;
    } elseif (strpos($data['consigne'], 'GENERFEU') !== false) {
        $prixUnitaire = 2150;
    }
}
$nbDestrat = isset($data['nbDestratificateurs']) && $data['nbDestratificateurs'] !== '' && $data['nbDestratificateurs'] !== null
    ? (int) $data['nbDestratificateurs'] : 0;
$coutInstallTotal = $prixUnitaire > 0 && $nbDestrat > 0 ? $prixUnitaire * $nbDestrat : 0;

// Scoring lead (0-100) : surface, hauteur, type, économie
$score = 0;
$surfaceNum = isset($data['surface']) ? (int) preg_replace('/\D/', '', $data['surface']) : 0;
if ($surfaceNum >= 5000) $score += 25;
elseif ($surfaceNum >= 2000) $score += 20;
elseif ($surfaceNum >= 1000) $score += 15;
elseif ($surfaceNum >= 800) $score += 10;
$hauteurNum = isset($data['hauteur']) ? (float) str_replace([',', ' m', 'm'], ['.', '', ''], $data['hauteur']) : 0;
if ($hauteurNum >= 10) $score += 20;
elseif ($hauteurNum >= 7) $score += 15;
elseif ($hauteurNum >= 5) $score += 10;
if (!empty($data['clientType'])) {
    if ($data['clientType'] === 'Site industriel / logistique') $score += 25;
    elseif ($data['clientType'] === 'Collectivité') $score += 15;
    else $score += 10;
}
$economieEuro = isset($data['economie30Euro']) && $data['economie30Euro'] !== '' ? (int) $data['economie30Euro'] : (isset($data['economie30EuroMax']) ? (int) $data['economie30EuroMax'] : 0);
if ($economieEuro >= 50000) $score += 30;
elseif ($economieEuro >= 20000) $score += 25;
elseif ($economieEuro >= 10000) $score += 20;
elseif ($economieEuro >= 5000) $score += 15;
elseif ($economieEuro > 0) $score += 10;
// Bonus rentabilité : Prime CEE (calculFormule) vs coût installation — reste à charge bas = bon score
$primeCee = $calculFormule !== null ? (float) $calculFormule : 0;
$resteCharge = $coutInstallTotal > 0 && $primeCee >= 0 ? $coutInstallTotal - $primeCee : null;
if ($resteCharge !== null) {
    if ($resteCharge <= 0) $score += 20;       // Prime couvre tout → excellent
    elseif ($resteCharge < 3000) $score += 15; // Faible reste à charge
    elseif ($resteCharge < 10000) $score += 10; // Reste à charge modéré
    else $score += 0;                           // Reste à charge élevé
}
$score = min(100, $score);

$isEligibilityForm = !empty($data['sourceForm']) && $data['sourceForm'] === 'eligibility';

if ($isEligibilityForm) {
    // Rapport dédié pour les leads issus du formulaire éligibilité (2 étapes)
    $lines = [];
    $lines[] = '——— RAPPORT FORMULAIRE ÉLIGIBILITÉ ———';
    $lines[] = '';
    $lines[] = 'SOURCE : Formulaire éligibilité (2 étapes) — Données à dimensionner après étude / simulation.';
    $lines[] = '';
    $lines[] = 'SCORING LEAD : ' . $score . '/100';
    $lines[] = '';
    $lines[] = 'CONTACT';
    $lines[] = '  Nom : ' . (!empty($data['nom']) ? $data['nom'] : '—');
    $lines[] = '  Société : ' . (!empty($data['societe']) ? $data['societe'] : '—');
    $lines[] = '  Email : ' . (!empty($data['email']) ? $data['email'] : '—');
    $lines[] = '  Téléphone : ' . ($data['telephone'] ?? '—');
    $lines[] = '  Créneau rappel : ' . (!empty($data['creneau']) ? $data['creneau'] : '—');
    $lines[] = '';
    $lines[] = 'CONTEXTE BÂTIMENT';
    $lines[] = '  Type de local : ' . (!empty($data['clientType']) ? $data['clientType'] : '—');
    $lines[] = '  Mode de chauffage : ' . (!empty($data['modeChauffage']) ? $data['modeChauffage'] : '—');
    $lines[] = '  Surface : ' . (!empty($data['surface']) ? $data['surface'] : '—');
    $lines[] = '  Hauteur sous plafond : ' . (!empty($data['hauteur']) ? $data['hauteur'] : '—');
    $lines[] = '  Code postal (complet) : ' . (!empty($data['postalCode']) ? $data['postalCode'] : '—');
    $lines[] = '  Département (2 premiers chiffres) : ' . (!empty($data['departement']) ? $data['departement'] : '—');
    $lines[] = '';
    $lines[] = 'Suite à donner : dimensionnement (volume, puissance, nombre de déstratificateurs, économies et prime CEE) après simulation ou visite.';
    $lines[] = '';
    $lines[] = '————————————————————————————';
} else {
    $lines = [];
    $lines[] = '——— RÉSULTAT SIMULATEUR DÉSTRATIFICATEUR ———';
    $lines[] = '';
    $lines[] = 'SCORING LEAD : ' . $score . '/100';
    $lines[] = '';
    $lines[] = 'CONTEXTE';
    $lines[] = '  Type de local : ' . (!empty($data['clientType']) ? $data['clientType'] : '—');
    $lines[] = '  Mode de chauffage : ' . (!empty($data['modeChauffage']) ? $data['modeChauffage'] : '—');
    $lines[] = '  Fonction : ' . (!empty($data['fonction']) ? $data['fonction'] : '—');
    $lines[] = '';
    $lines[] = 'Modèle déstratificateur retenu : ' . (!empty($data['consigne']) ? $data['consigne'] : '—');
    $lines[] = '';
    $lines[] = 'BESOIN DE CHAUFFAGE';
    $lines[] = '  Puissance chauffage estimée : ' . ($puissance !== null ? $fmtDec($puissance) . ' kW' : '—') . ' (ΔT = 25 °C)';
    $lines[] = '';
    $lines[] = 'DONNÉES DU LOCAL';
    $lines[] = '  Volume chauffé : ' . $fmt($data['volume'] ?? null) . ' m³';
    $lines[] = '  Taux de brassage : ' . $fmt($data['tauxBrassage'] ?? null) . ' vol/h';
    $lines[] = '  Nombre de déstratificateurs nécessaires : ' . $fmt($data['nbDestratificateurs'] ?? null);
    $lines[] = '';
    $lines[] = 'CONSOMMATION ET COÛT ANNUELS ESTIMÉS';
    $lines[] = '  Consommation annuelle : ' . $fmt($data['consommationKwhAn'] ?? null) . ' kWh/an';
    $lines[] = '  Coût annuel estimé : ' . $fmt($data['coutAnnuelEstime'] ?? null) . ' €/an';
    if (!empty($data['coutAnnuelMin']) || !empty($data['coutAnnuelMax'])) {
        $lines[] = '  Fourchette selon mode chauffage : ' . $fmt($data['coutAnnuelMin'] ?? null) . ' € à ' . $fmt($data['coutAnnuelMax'] ?? null) . ' €/an';
    }
    $lines[] = '';
    $lines[] = 'ÉCONOMIES 30 % (DÉSTRATIFICATION)';
    $lines[] = '  Économie énergétique : ' . $fmt($data['economie30Kwh'] ?? null) . ' kWh/an';
    $lines[] = '  Économie en euros : ' . $fmt($data['economie30Euro'] ?? null) . ' €/an';
    if (!empty($data['economie30EuroMin']) || !empty($data['economie30EuroMax'])) {
        $lines[] = '  Fourchette : ' . $fmt($data['economie30EuroMin'] ?? null) . ' € à ' . $fmt($data['economie30EuroMax'] ?? null) . ' €/an';
    }
    $lines[] = '';
    $lines[] = 'COÛT D\'INSTALLATION';
    $lines[] = '  Modèle : ' . (!empty($data['consigne']) ? $data['consigne'] : '—');
    $lines[] = '  Prix unitaire TTC : ' . ($prixUnitaire > 0 ? number_format($prixUnitaire, 0, ',', ' ') . ' €' : '—');
    $lines[] = '  Nombre de déstratificateurs : ' . ($nbDestrat > 0 ? $nbDestrat : '—');
    $lines[] = '  Coût total installation : ' . ($coutInstallTotal > 0 ? number_format($coutInstallTotal, 0, ',', ' ') . ' € TTC' : '—');
    $lines[] = '';
    $lines[] = 'CALCUL INDICATEUR (formule CEE) — Prime CEE estimée après vérification puissance';
    $lines[] = '  ' . ($isIndustriel ? 'Industriel : 7,1 × Puissance × 7,3' : 'Tertiaire / Collectivité : 3,9 × Puissance × 7,3');
    $lines[] = '  Résultat (Prime CEE estimée) : ' . ($calculFormule !== null ? $fmtDec($calculFormule) . ' €' : '—');
    $lines[] = '';
    $lines[] = 'RENTABILITÉ';
    if ($calculFormule !== null && $coutInstallTotal > 0) {
        $resteChargeConsigne = $coutInstallTotal - $calculFormule;
        if ($resteChargeConsigne <= 0) {
            $lines[] = '  Prime CEE couvre l\'installation. Excédent : ' . number_format(abs($resteChargeConsigne), 0, ',', ' ') . ' €';
        } else {
            $lines[] = '  Reste à charge estimé : ' . number_format($resteChargeConsigne, 0, ',', ' ') . ' € (Coût ' . number_format($coutInstallTotal, 0, ',', ' ') . ' € − Prime ' . $fmtDec($calculFormule) . ' €)';
        }
    } else {
        $lines[] = '  —';
    }
    $lines[] = '';
    $lines[] = '————————————————————————————';
}

$fields['Consigne'] = implode("\n", $lines);
// Score envoyé en chaîne pour compatibilité avec un champ Airtable de type Texte
$fields['Score'] = (string) $score;

// Champs legacy (si présents, on les garde pour compatibilité)
if (!empty($data['hauteur'])) {
    $fields['Hauteur sous plafond'] = $data['hauteur'];
}
if (!empty($data['chauffe'])) {
    $fields['Bâtiment chauffé ?'] = $data['chauffe'];
}

$payload = json_encode([
    'records' => [
        ['fields' => $fields]
    ],
    'typecast' => true
]);

// --- Appel Airtable API ---
$url = $recordId
    ? "https://api.airtable.com/v0/{$baseId}/{$tableId}/{$recordId}"
    : "https://api.airtable.com/v0/{$baseId}/{$tableId}";

$ch = curl_init($url);
if ($recordId) {
    // Update: PATCH record
    $patchPayload = json_encode([
        'fields' => $fields,
        'typecast' => true,
    ]);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => 'PATCH',
        CURLOPT_POSTFIELDS     => $patchPayload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $airtableToken,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT        => 15,
    ]);
} else {
    // Create: POST records
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $airtableToken,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT        => 15,
    ]);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
// curl_close() déprécié depuis PHP 8.5 (la ressource est libérée à la fin du scope)

// --- Gestion du résultat ---
$airtableSuccess = false;
$errorReason = '';
$createdRecordId = '';

if ($curlError) {
    $errorReason = 'CURL Error: ' . $curlError;
} elseif ($httpCode >= 200 && $httpCode < 300) {
    $airtableSuccess = true;
    $decoded = json_decode($response, true);
    if (!$recordId && isset($decoded['records'][0]['id'])) {
        $createdRecordId = (string) $decoded['records'][0]['id'];
    } elseif ($recordId && isset($decoded['id'])) {
        $createdRecordId = (string) $decoded['id'];
    }
} else {
    $airtableError = json_decode($response, true);
    $errorReason = 'HTTP ' . $httpCode . ': ' . ($airtableError['error']['message'] ?? 'Unknown error');
}

// --- Log du lead ---
logLead($data, $airtableSuccess ? 'SUCCESS' : 'FAILED', $errorReason);

// --- Envoi email de secours si Airtable a échoué ---
$emailSent = false;
if (!$airtableSuccess && !$isStep1) {
    $emailSent = sendBackupEmail($data, $backupEmail, $errorReason);
    $emailDisplay = $data['email'] ?? $data['telephone'] ?? 'unknown';
    error_log("[DESTRAT] Airtable FAILED for $emailDisplay: $errorReason - Email backup: " . ($emailSent ? 'OK' : 'FAILED'));
}

// --- Réponse ---
if ($airtableSuccess) {
    echo json_encode(['ok' => true, 'method' => $recordId ? 'airtable_patch' : 'airtable', 'recordId' => $createdRecordId ?: null]);
    exit;
}

if ($emailSent) {
    // Airtable KO mais email envoyé → succès pour l'utilisateur
    echo json_encode(['ok' => true, 'method' => 'email_backup', 'error' => $errorReason]);
    exit;
}

// Tout a échoué : renvoyer le détail pour diagnostic (ex. noms de champs Airtable incorrects)
http_response_code(500);
echo json_encode(['ok' => false, 'error' => 'Failed to save lead', 'detail' => $errorReason]);
