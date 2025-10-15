// Supabase Konfiguration - Ersetze mit deinen Werten aus Supabase Dashboard (API > Project URL und Anon Key)
const supabaseUrl = 'https://dein-projekt.supabase.co';  // Deine Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycG5sc3F6eGt6a3V2d2FvdmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg5OTc4OTksImV4cCI6MjA0NDU3Mzg5OX0.qeS6aTv1W5b_6M7I8u6X9k2s2p3cH0aL1xY0O5iYk';  // Dein Anon Key
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
    id: null  // Neue State für ID
};

document.addEventListener('DOMContentLoaded', () => {
    showConsentModal();
});

function showConsentModal() {
    document.getElementById('consent-modal').classList.remove('hidden');
    document.getElementById('consent-yes').addEventListener('click', () => {
        document.getElementById('consent-modal').classList.add('hidden');
        generateAndShowId();
    });
    document.getElementById('consent-no').addEventListener('click', () => {
        alert('Ohne Einwilligung können wir die Tests nicht fortsetzen.');
        // Optional: Weiterleitung oder Abbruch
    });
}

function generateAndShowId() {
    state.id = crypto.randomUUID().substring(0, 8).toUpperCase();  // Einfache UUID-Generierung
    document.getElementById('id-display').textContent = state.id;
    document.getElementById('id-modal').classList.remove('hidden');
    document.getElementById('id-ok').addEventListener('click', () => {
        document.getElementById('id-modal').classList.add('hidden');
        // Starte den Chatbot
    });
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
                window.location.href = 'https://voice-handicap-index.glitch.me?id=' + state.id;  // ID mitgeben
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

    // ... (bestehender Code für PDF-Inhalt)

    // Anonymisiere (keine Namen, nur ID)
    doc.text('Untersuchungs-ID: ' + state.id, 10, yPosition);
    yPosition += 10;

    // ... (Rest des Inhalts)

    // Speicher in Supabase (als Base64 oder Link, hier als Text-Summary)
    const summary = generateSummary();
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

// Der Rest des Codes bleibt, aber ich habe Duplikate vermieden, Code strukturiert (async/await) und UI-Modals hinzugefügt für Eleganz.
