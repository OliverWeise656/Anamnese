// Supabase Konfiguration - Deine Werte aus dem Dashboard
const supabaseUrl = 'https://azjwaomoamkajqqodrvl.supabase.co'; // Deine Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6andhb21vYW1rYWpxcW9kcnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjE2MTYsImV4cCI6MjA3NjAzNzYxNn0.soNTXBgEmF_dFwT6CgeMJSKPJ62EHr9yXPU2U-A20Ec'; // Dein Anon Key
const supabase = createClient(supabaseUrl, supabaseKey);

const apiKey = 'sk-proj-JLaB04KZYMjiYFNNXrtwT3BlbkFJvODkrYLU7W9UBiZJ1DU2'; // Ihr API-Schlüssel
const clientId = '1093697496533-5pbn5mgp80hecng0lsemu94dci88oe4g.apps.googleusercontent.com'; // Ihre Google OAuth 2.0 Client ID
const spreadsheetId = '1GRPTS1oa3rAdapYTaCg01ZOHDKKxQJ8T9doeSF_HGrA'; // Ihre Google Sheets ID

let conversation = [
    { role: 'system', content: 'Alter des Patienten:' }
];
let redirectTimeout; // Variable für den Timeout

let state = {
    age: null,
    isChild: null,
    kindergarten: null,
    school: null,
    schoolType: null,
    integration: null,
    siblings: null,
    siblingsCount: 0,
    currentSibling: 0,
    siblingsAges: [],
    hearingScreening: null,
    hearingScreeningResult: null,
    reason: null,
    referralSource: null,
    painDuration: null,
    painIntensity: null,
    dizzinessDuration: null,
    dizzinessIntensity: null,
    tinnitusDuration: null,
    tinnitusEar: null,
    tinnitusIntensity: null,
    hearingLossDuration: null,
    hearingLossEar: null,
    hearingLossIntensity: null,
    weightLoss: null,
    weightLossAmount: null,
    urgency: 'normal',
    hearingTestRecommended: false,
    voiceAnalysisRecommended: false,
    initialTestScore: 0,
    hearingTestScore: 0,
    id: null // Neue State für ID
};

// Sicherstellen, dass das Consent-Modal zuerst kommt
document.addEventListener('DOMContentLoaded', () => {
    showConsentModal();
});

function showConsentModal() {
    const modal = document.getElementById('consent-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('consent-yes').addEventListener('click', () => {
            modal.classList.add('hidden');
            generateAndShowId();
        });
        document.getElementById('consent-no').addEventListener('click', () => {
            alert('Ohne Einwilligung können wir die Tests nicht fortsetzen.');
            // Optional: Abbruch oder Weiterleitung
        });
    } else {
        console.log('Consent-Modal nicht gefunden – Fallback zu ID.');
        generateAndShowId(); // Fallback, falls Modal fehlt
    }
}

function generateAndShowId() {
    state.id = crypto.randomUUID().substring(0, 8).toUpperCase(); // Einfache UUID-Generierung
    const idDisplay = document.getElementById('id-display');
    if (idDisplay) {
        idDisplay.textContent = state.id; // Sicherstellen, dass die ID angezeigt wird
        document.getElementById('id-modal').classList.remove('hidden');
        document.getElementById('id-ok').addEventListener('click', () => {
            document.getElementById('id-modal').classList.add('hidden');
            // Starte den Chatbot oder nächsten Schritt
            document.getElementById('chatbot').classList.add('hidden'); // Verstecke Chatbot
            document.getElementById('userInput').style.display = 'block'; // Zeige Eingabefeld
            document.querySelector('button[onclick="sendMessage()"]').style.display = 'block'; // Zeige Senden-Button
        });
    } else {
        console.log('ID-Display nicht gefunden – ID:', state.id);
    }
}

async function sendMessage() {
    const userInput = document.getElementById('userInput').value;

    // Wenn keine Eingabe: Direkt zu Tests leiten, aber mit ID anonym speichern
    if (userInput.trim() === '') {
        const lastDoctorMessage = conversation.findLast(c => c.role === 'assistant')?.content || '';

        // Anonym speichern in Supabase
        await saveToSupabase('[leer]', lastDoctorMessage, new Date().toLocaleString());

        document.getElementById('userInput').style.display = 'none';
        document.querySelector('button[onclick="sendMessage()"]').style.display = 'none';

        const messagesDiv = document.getElementById('messages');
        const hint = document.createElement('div');
        hint.classList.add('message', 'doktor');
        hint.textContent = 'Sie haben keine Angaben gemacht. Wir leiten Sie direkt zu den Tests weiter.';
        messagesDiv.appendChild(hint);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        setTimeout(() => {
            if (state.hearingTestRecommended) {
                startToneSetting();
            } else if (state.voiceAnalysisRecommended) {
                window.location.href = 'https://voice-handicap-index.glitch.me?id=' + state.id; // ID mitgeben
            } else {
                startToneSetting(); // Fallback
            }
        }, 3000);
        return;
    }

    addMessageToChat('User', userInput);
    document.getElementById('userInput').value = '';

    conversation.push({ role: 'user', content: userInput });

    const response = await getDoctorResponse(userInput);
    const doctorMessage = response;

    addMessageToChat('Doktor', doctorMessage);
    conversation.push({ role: 'assistant', content: doctorMessage });

    await saveToSupabase(userInput, doctorMessage, new Date().toLocaleString());

    if (state.hearingTestRecommended || state.voiceAnalysisRecommended) {
        const proceedToNextStep = () => {
            if (state.hearingTestRecommended) {
                startToneSetting();
            } else if (state.voiceAnalysisRecommended) {
                window.location.href = 'https://voice-handicap-index.glitch.me?id=' + state.id;
            }
        };

        redirectTimeout = setTimeout(proceedToNextStep, 10000);

        const skipButton = document.getElementById('skipButton');
        if (skipButton) {
            skipButton.addEventListener('click', () => {
                clearTimeout(redirectTimeout);
                proceedToNextStep();
            });
        }
    }
}

// Neue Funktion für Supabase-Speicherung (anonym mit ID)
async function saveToSupabase(userInput, doctorMessage, timestamp) {
    const { data, error } = await supabase
        .from('untersuchungen')
        .upsert([
            { id: state.id, user_input: userInput, doctor_message: doctorMessage, timestamp: timestamp }
        ]);

    if (error) console.error('Supabase Error:', error);
}

// Der Rest des script.js bleibt ähnlich, aber bei Ergebnissen (PDF-Generierung) speichern wir in Supabase
// Beispielsweise in generatePDF():
async function generatePDF() {
    const doc = new jsPDF();
    let yPosition = 10;

    // ... (bestehender Code für PDF-Inhalt, hier nur Beispiel)
    doc.text('Anamnese und Testergebnisse', 10, yPosition);
    yPosition += 10;

    // Anonymisiere (keine Namen, nur ID)
    doc.text('Untersuchungs-ID: ' + state.id, 10, yPosition);
    yPosition += 10;

    // ... (Rest des Inhalts, z. B. Summary)
    const summary = generateSummary(); // Angenommen, diese Funktion existiert
    doc.text(summary, 10, yPosition);

    // Speicher in Supabase (als Base64 oder Link, hier als Text-Summary)
    await saveResultsToSupabase(summary);

    // Generiere GDT-Datei (einfache Text-Datei)
    generateGDTFile(summary);

    // Lokal PDF speichern (wie vorher)
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const fileName = `Anamnese_und_Testergebnisse_${dateStr}_${timeStr}.pdf`;
    doc.save(fileName);
}

async function saveResultsToSupabase(summary) {
    const { data, error } = await supabase
        .from('ergebnisse')
        .insert([
            { id: state.id, summary: summary, timestamp: new Date().toLocaleString() }
        ]);

    if (error) console.error('Supabase Results Error:', error);
}

// Einfache GDT-Generierung (als Text-File, basierend auf Spec)
function generateGDTFile(summary) {
    const gdtContent = `6301${state.id}\n${summary.replace(/\n/g, '\\n')}`;  // Einfache GDT-Struktur, passe an Spec an
    const blob = new Blob([gdtContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${state.id}-hoertest.gdt`;
    link.click();
}

// Restliche Funktionen (getDoctorResponse, addMessageToChat, etc.) bleiben wie im Original, nur hier nicht dupliziert.
// Beispiel für getDoctorResponse (falls nicht definiert):
async function getDoctorResponse(userInput) {
    // Hier müsste deine Logik für die API-Antwort sein (z. B. mit fetch)
    return "Antwort des Doktors..."; // Placeholder
}

function addMessageToChat(role, content) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role === 'User' ? 'user' : 'doktor');
    messageDiv.textContent = content;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
