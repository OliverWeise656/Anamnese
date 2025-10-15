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
    state.id = crypto.randomUUID().substring(0, 8).toUpperCase();  // Kürzer: Nur 8 Zeichen, z. B. "674C034B"
    document.getElementById('id-display').textContent = state.id;
    document.getElementById('id-modal').classList.remove('hidden');
    document.getElementById('id-ok').addEventListener('click', () => {
        document.getElementById('id-modal').classList.add('hidden');
        // Starte den Chatbot
        document.getElementById('chatbot').classList.add('hidden');
        document.getElementById('messages').classList.remove('hidden');
        document.getElementById('userInput').classList.remove('hidden');
        document.querySelector('button[onclick="sendMessage()"]').classList.remove('hidden');
        addMessageToChat('Doktor', 'Hallo! Wie alt sind Sie?');
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
async function generatePDF() {
    const doc = new jsPDF();
    let yPosition = 10;

    // Bestehender Code für PDF-Inhalt (z. B. Chat-Verlauf)
    conversation.forEach(message => {
        if (message.role !== 'system') {
            doc.setFontSize(12);
            doc.text(`${message.role === 'user' ? 'Sie: ' : 'Doktor: '} ${message.content}`, 10, yPosition);
            yPosition += 10;
        }
    });

    // Anonymisiere (keine Namen, nur ID)
    doc.text('Untersuchungs-ID: ' + state.id, 10, yPosition);
    yPosition += 10;

    // Chart als Bild einfügen (falls vorhanden)
    if (document.getElementById('resultsChart')) {
        const canvas = document.getElementById('resultsChart');
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 10, yPosition, 180, 90);
        yPosition += 100;
    }

    // Zusammenfassung
    const summary = generateSummary();
    doc.text('Zusammenfassung: ' + summary, 10, yPosition);
    yPosition += 10;

    // Speicher in Supabase (als Base64 oder Link, hier als Text-Summary)
    await saveResultsToSupabase(summary);

    // Generiere GDT-Datei
    generateGDTFile(summary);

    // Lokal PDF speichern
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const fileName = `Anamnese_und_Testergebnisse_${dateStr}_${timeStr}.pdf`;
    doc.save(fileName);

    setTimeout(() => {
        if (state.voiceAnalysisRecommended) {
            window.location.href = 'https://voice-handicap-index.glitch.me?id=' + state.id;
        } else if (state.age > 4 && state.age < 16) {
            window.location.href = 'https://mottier-test.glitch.me?id=' + state.id;
        } else {
            setTimeout(() => {
                alert('Herzlichen Dank für Ihre Unterstützung! Ihre Ergebnisse sind gespeichert. Notieren Sie sich die ID: ' + state.id + '. Teilen Sie sie bei Ihrem Termin mit der Praxis.');
            }, 5000);
        }
    }, 5000);
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

// Bestehende Funktionen (unverändert, nur strukturiert)
function addMessageToChat(role, content) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role.toLowerCase());
    messageDiv.textContent = content;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function getDoctorResponse(userInput) {
    // ... (dein OpenAI-Logik hier, unverändert)
    return "Antwort vom Doktor..."; // Placeholder
}

function generateSummary() {
    return conversation.map(m => `${m.role}: ${m.role === 'system' ? '' : m.content}`).join('\n');
}

function startToneSetting() {
    document.getElementById('chatbot').classList.add('hidden');
    document.getElementById('tone-setting').classList.remove('hidden');
    // ... (Rest deiner Funktion)
}

// Weitere Funktionen (unverändert, nur hier strukturiert)
function startInitialTest() {
    // ... (dein Code)
}

function startHearingTest() {
    // ... (dein Code)
}

function startTest(ear) {
    // ... (dein Code)
}

function heardTone() {
    // ... (dein Code)
}
