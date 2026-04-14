# Instructions pour connecter votre formulaire à Google Sheets

Suivez attentivement ces étapes pour que les données de votre formulaire soient automatiquement ajoutées à votre feuille de calcul Google.

### Étape 1 : Créer votre Google Sheet

1.  Ouvrez [Google Sheets](https://sheets.new) et créez une nouvelle feuille de calcul.
2.  Nommez-la "Leads Déshumidificateur Serre".
3.  Dans la première ligne (la ligne d'en-tête), copiez et collez **exactement** les noms de colonnes suivants, chacun dans une cellule séparée :
    `Timestamp`, `Type de culture`, `Surface des serres`, `Chauffage`, `Ordinateur climatique`, `Problème principal`, `Financement CEE`, `Calendrier du projet`, `Nom complet`, `Nom de l'exploitation`, `Téléphone`, `Email`, `Département`

### Étape 2 : Configurer le Script Google Apps

1.  Dans votre Google Sheet, cliquez sur **Extensions** > **Apps Script**. Un nouvel éditeur s'ouvrira.
2.  Effacez tout le code par défaut qui s'y trouve (`function myFunction() {...}`).
3.  Copiez l'intégralité du code ci-dessous et collez-le dans l'éditeur Apps Script.

```javascript
// Script pour recevoir les données du formulaire et les ajouter à la feuille de calcul
const sheetName = 'Feuille 1'; // Assurez-vous que cela correspond au nom de votre onglet
const scriptProp = PropertiesService.getScriptProperties();

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(sheetName);

    // Les en-têtes doivent correspondre EXACTEMENT à ceux de votre Google Sheet
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const nextRow = sheet.getLastRow() + 1;

    const newRow = headers.map(function(header) {
      if (header === 'Timestamp') {
        return new Date();
      }
      // Le paramètre 'e.parameter' correspond aux clés envoyées depuis le formulaire
      return e.parameter[header] || ''; 
    });

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}
```

### Étape 3 : Déployer le Script comme Application Web

1.  Cliquez sur le bouton bleu **Déployer** en haut à droite, puis sur **Nouveau déploiement**.
2.  Cliquez sur l'icône d'engrenage (⚙️) à côté de "Sélectionner le type" et choisissez **Application web**.
3.  Dans la configuration :
    *   **Description** : Mettez "API pour formulaire de contact".
    *   **Exécuter en tant que** : Laissez "Moi".
    *   **Qui a accès** : Choisissez **Tout le monde**. C'est **crucial** pour que votre site puisse communiquer avec le script.
4.  Cliquez sur **Déployer**.
5.  Google vous demandera d'autoriser le script. Cliquez sur **Autoriser l'accès**.
6.  Choisissez votre compte Google.
7.  Vous verrez peut-être un avertissement "Google n'a pas validé cette application". Cliquez sur **Paramètres avancés** (ou "Advanced"), puis sur **Accéder à [Nom de votre projet] (non sécurisé)**.
8.  Cliquez sur **Autoriser** dans la dernière fenêtre.
9.  Une fois le déploiement terminé, une fenêtre apparaîtra avec une **URL de l'application web**. **Copiez cette URL !** Elle ressemble à `https://script.google.com/macros/s/.../exec`.

### Étape 4 : Fournir l'URL

Maintenant, **donnez-moi cette URL que vous venez de copier**. Je l'intégrerai dans le code de votre formulaire pour finaliser la connexion !