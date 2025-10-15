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
    console.log('Seite geladen – starte Consent-Modal'); // Debug
    showConsentModal();
});

// Consent-Modal zeigen
function showConsentModal() {
    const modal = document.getElementById('consent-modal');
    if (modal) {
        modal.classList.remove('hidden');
        console.log('Consent-Modal gezeigt'); // Debug
        document.getElementById('consent-yes').addEventListener('click', () => {
            modal.classList.add('hidden');
            console.log('Consent gegeben – starte ID'); // Debug
            generateAndShowId();
        });
        document.getElementById('consent-no').addEventListener('click', () => {
            alert('Ohne Einwilligung können wir die Tests nicht fortsetzen.');
        });
    } else {
        console.log('Consent-Modal nicht gefunden – Fallback zu ID.'); // Debug
        generateAndShowId(); // Fallback
    }
}

// ID generieren und zeigen (mit Fallback für crypto)
function generateAndShowId() {
    // Versuche crypto.randomUUID(), Fallback zu Math.random()
    let id;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID().substring(0, 8).toUpperCase();
    } else {
        id = Math.random().toString(36).substring(2, 10).toUpperCase(); // Fallback-ID
    }
    state.id = id;
    const idDisplay = document.getElementById('id-display');
    if (idDisplay) {
        idDisplay.textContent = id; // Setze die ID
        console.log('ID generiert und gesetzt:', id); // Debug
        document.getElementById('id-modal').classList.remove('hidden');
        console.log('ID-Modal gezeigt'); // Debug
        document.getElementById('id-ok').addEventListener('click', () => {
            document.getElementById('id-modal').classList.add('hidden');
            console.log('ID-OK geklickt – starte Chatbot'); // Debug
            // Starte Chatbot
            document.getElementById('chatbot').classList.add('hidden'); // Verstecke Chatbot
            document.getElementById('userInput').style.display = 'block'; // Zeige Eingabefeld
            document.querySelector('button[onclick="sendMessage()"]').style.display = 'block'; // Zeige Senden-Button
        });
        // NEU: Test-Knopf für Debug
        document.getElementById('test-id-button').addEventListener('click', () => {
            idDisplay.textContent = Math.random().toString(36).substring(2, 10).toUpperCase(); // Test-ID
            console.log('Test-ID gesetzt'); // Debug
        });
    } else {
        console.log('ID-Display nicht gefunden – ID:', id); // Debug
    }
}

// Dein Original-SendMessage mit Anpassungen für ID und Supabase
async function sendMessage() {
    const userInput = document.getElementById('userInput').value;

    // Wenn keine Eingabe: Direkt zu Tests leiten, aber mit ID anonym speichern
    if (userInput.trim() === '') {
        const lastDoctorMessage = conversation.findLast(c => c.role === 'assistant')?.content || '';

        // Anonym speichern in Supabase
        await appendRow(['[leer]', lastDoctorMessage, new Date().toLocaleString()]);

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

// Speichern in Supabase
async function saveToSupabase(userInput, doctorMessage, timestamp) {
    const { data, error } = await supabase
        .from('untersuchungen')
        .upsert([
            { id: state.id, user_input: userInput, doctor_message: doctorMessage, timestamp: timestamp }
        ]);

    if (error) console.error('Supabase Error:', error);
}

// Dein Original für Google Sheets (appendRow)
async function appendRow(values) {
    try {
        const accessToken = gapi.auth.getToken().access_token;
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1:append?valueInputOption=RAW`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [values]
            })
        });
        if (!response.ok) throw new Error('Fehler beim Hinzufügen zur Google Sheets');
    } catch (error) {
        console.error('Error appending to Google Sheets:', error);
    }
}

// Dein Original für getDoctorResponse (erweitert)
async function getDoctorResponse(userInput) {
    // Deine Original-API-Logik (OpenAI oder so)
    // Placeholder: Einfache Antwort basierend auf Alter
    if (userInput.match(/\d+/)) {
        state.age = parseInt(userInput);
        return state.age > 16 ? 'Bitte geben Sie an, ob Sie Schmerzen haben.' : 'Gehen Sie in den Kindergarten?';
    }
    return 'Bitte geben Sie Ihr Alter ein.';
}

// Dein Original für addMessageToChat
function addMessageToChat(role, content) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role === 'User' ? 'user' : 'doktor');
    messageDiv.textContent = content;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Dein Original für startToneSetting
function startToneSetting() {
    document.getElementById('chatbot').classList.add('hidden');
    document.getElementById('tone-setting').classList.remove('hidden');
    const audio = new Audio('assets/tone.mp3'); // Passe Pfad an
    audio.play();
    document.getElementById('startButton').disabled = true;
    document.getElementById('stopButton').disabled = false;
    audio.onended = () => {
        document.getElementById('startButton').disabled = false;
    };
    document.getElementById('stopButton').addEventListener('click', () => {
        audio.pause();
        document.getElementById('tone-setting').classList.add('hidden');
        document.getElementById('initial-test').classList.remove('hidden');
    });
}

// Dein Original für startInitialTest
function startInitialTest() {
    document.getElementById('initial-instructions').classList.add('hidden');
    document.getElementById('test-area').style.display = 'block';
    const words = ['Haus', 'Baum', 'Auto']; // Erweitere Liste
    let currentWordIndex = 0;
    const audioInstruction = document.getElementById('audio-instruction');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-initial-test-button');

    function playWord() {
        if (currentWordIndex < words.length) {
            audioInstruction.textContent = `Hören Sie das Wort: ${words[currentWordIndex]}`;
            const audio = new Audio(`assets/${words[currentWordIndex]}.mp3`);
            audio.play();
            currentWordIndex++;
        } else {
            calculateInitialScore();
        }
    }

    submitButton.addEventListener('click', () => {
        const userAnswer = answerInput.value.trim().toLowerCase();
        if (userAnswer === words[currentWordIndex - 1].toLowerCase()) state.initialTestScore++;
        answerInput.value = '';
        playWord();
    });

    playWord();
}

// Dein Original für calculateInitialScore
function calculateInitialScore() {
    document.getElementById('test-area').style.display = 'none';
    document.getElementById('initial-test-result').classList.remove('hidden');
    document.getElementById('initial-test-result').textContent = `Ihr Ergebnis: ${state.initialTestScore}/${words.length} Punkte`;
    if (state.initialTestScore < 2) {
        state.hearingTestRecommended = true;
        setTimeout(() => {
            document.getElementById('initial-test').classList.add('hidden');
            document.getElementById('hearing-test-info').classList.remove('hidden');
        }, 2000);
    } else {
        setTimeout(() => {
            document.getElementById('initial-test').classList.add('hidden');
            document.getElementById('thank-you').classList.remove('hidden');
        }, 2000);
    }
}

// Dein Original für startHearingTest
function startHearingTest() {
    document.getElementById('hearing-test-info').classList.add('hidden');
    document.getElementById('test').classList.remove('hidden');
    const words = ['Haus', 'Baum', 'Auto']; // Erweitere Liste
    let currentWordIndex = 0;
    const audioPlayer = document.getElementById('audioPlayer');
    const responseInput = document.getElementById('response');
    const nextButton = document.getElementById('nextButton');

    function playWord() {
        if (currentWordIndex < words.length) {
            audioPlayer.src = `assets/${words[currentWordIndex]}_noise.mp3`; // Mit Rauschen
            audioPlayer.play();
            currentWordIndex++;
        } else {
            calculateHearingTestScore();
        }
    }

    nextButton.addEventListener('click', () => {
        const userAnswer = responseInput.value.trim().toLowerCase();
        if (userAnswer === words[currentWordIndex - 1].toLowerCase()) state.hearingTestScore++;
        responseInput.value = '';
        playWord();
    });

    playWord();
}

// Dein Original für calculateHearingTestScore
function calculateHearingTestScore() {
    document.getElementById('test').classList.add('hidden');
    document.getElementById('hearing-test').classList.remove('hidden');
    state.hearingTestRecommended = state.hearingTestScore < 1;
}

// Dein Original für startTest
function startTest(ear) {
    document.getElementById('instructions').classList.add('hidden');
    document.getElementById('test-area').style.display = 'block';
    let tonesHeard = 0;
    const totalTones = 6;

    function playTone() {
        if (tonesHeard < totalTones) {
            const audio = new Audio(`assets/tone_${ear}.mp3`); // Passe Pfad an
            audio.play();
            tonesHeard++;
            setTimeout(playTone, 2000); // Nächster Ton nach 2 Sek.
        } else {
            document.getElementById('test-area').style.display = 'none';
            document.getElementById('right-test-done').classList.remove('hidden');
        }
    }

    playTone();
}

// Dein Original für heardTone
function heardTone() {
    console.log('Ton gehört!');
}

// Dein Original für generatePDF mit neuen Ergänzungen
async function generatePDF() {
    const doc = new jsPDF();
    let yPosition = 10;

    doc.setFontSize(16);
    doc.text('Anamnese und Testergebnisse', 10, yPosition);
    yPosition += 10;

    // Anonymisiere (keine Namen, nur ID)
    doc.setFontSize(12);
    doc.text('Untersuchungs-ID: ' + state.id, 10, yPosition);
    yPosition += 10;

    doc.text('Alter: ' + (state.age || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    if (state.isChild) {
        doc.text('Kindergarten: ' + (state.kindergarten || 'Nicht angegeben'), 10, yPosition);
        yPosition += 10;
        doc.text('Schule: ' + (state.school || 'Nicht angegeben'), 10, yPosition);
        yPosition += 10;
        doc.text('Schultyp: ' + (state.schoolType || 'Nicht angegeben'), 10, yPosition);
        yPosition += 10;
        doc.text('Integration: ' + (state.integration || 'Nicht angegeben'), 10, yPosition);
        yPosition += 10;
    }
    doc.text('Geschwister: ' + (state.siblings || 'Nicht angegeben') + ' (' + state.siblingsCount + ')', 10, yPosition);
    yPosition += 10;
    if (state.siblingsAges.length > 0) {
        doc.text('Geschwisteralter: ' + state.siblingsAges.join(', '), 10, yPosition);
        yPosition += 10;
    }
    doc.text('Hörscreening: ' + (state.hearingScreening || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Hörscreening-Ergebnis: ' + (state.hearingScreeningResult || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Grund: ' + (state.reason || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Überweisungsquelle: ' + (state.referralSource || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Schmerz-Dauer: ' + (state.painDuration || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Schmerz-Intensität: ' + (state.painIntensity || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Schwindel-Dauer: ' + (state.dizzinessDuration || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Schwindel-Intensität: ' + (state.dizzinessIntensity || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Tinnitus-Dauer: ' + (state.tinnitusDuration || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Tinnitus-Ohr: ' + (state.tinnitusEar || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Tinnitus-Intensität: ' + (state.tinnitusIntensity || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Hörverlust-Dauer: ' + (state.hearingLossDuration || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Hörverlust-Ohr: ' + (state.hearingLossEar || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Hörverlust-Intensität: ' + (state.hearingLossIntensity || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Gewichtsverlust: ' + (state.weightLoss || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Gewichtsverlust-Menge: ' + (state.weightLossAmount || 'Nicht angegeben'), 10, yPosition);
    yPosition += 10;
    doc.text('Dringlichkeit: ' + state.urgency, 10, yPosition);
    yPosition += 10;
    doc.text('Sprachverständnis-Score: ' + state.initialTestScore, 10, yPosition);
    yPosition += 10;
    doc.text('Hörtest-Score: ' + state.hearingTestScore, 10, yPosition);
    yPosition += 20;

    doc.setFontSize(10);
    doc.text('Hinweis: Diese Ergebnisse sind anonymisiert und ausschließlich von unserer Praxis ausgewertet.', 10, yPosition);
    yPosition += 5;
    doc.text('Eine Weitergabe an und Nutzung durch Dritte ist nicht gestattet.', 10, yPosition);
    yPosition += 5;
    doc.text('Es kann nicht direkt verwendet werden.', 10, yPosition);
    yPosition += 10;

    doc.setTextColor(255, 0, 0); // Rot
    doc.text('Bitte prüfen Sie, ob in einem anderen Fenster noch weitere Hörtests durchzuführen sind.', 10, yPosition);
    yPosition += 10;

    doc.setTextColor(0, 0, 0); // Schwarz
    doc.text('Chatbot-Konversation', 10, yPosition);
    yPosition += 10;
    doc.text(generateSummary(), 10, yPosition);

    // Speicher in Supabase
    await saveResultsToSupabase(generateSummary());

    // Generiere GDT-Datei
    generateGDTFile(generateSummary());

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
                alert('Herzlichen Dank für Ihre Unterstützung! Eine PDF wurde erstellt: ' + fileName + '. Ihre Ergebnisse sind automatisch in unserer Cloud gespeichert.');
            }, 5000);
        }
    }, 5000);
}

// Hilfsfunktion für Summary
function generateSummary() {
    let summary = 'Konversation:\n';
    conversation.forEach(msg => {
        summary += `${msg.role}: ${msg.content}\n`;
    });
    return summary;
}

// Speichern der Ergebnisse in Supabase
async function saveResultsToSupabase(summary) {
    const { data, error } = await supabase
        .from('ergebnisse')
        .insert([
            { id: state.id, summary: summary, timestamp: new Date().toLocaleString() }
        ]);

    if (error) console.error('Supabase Results Error:', error);
}

// Generiere GDT-Datei
function generateGDTFile(summary) {
    const gdtContent = `6301${state.id}\n${summary.replace(/\n/g, '\\n')}`; // Einfache GDT-Struktur
    const blob = new Blob([gdtContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${state.id}-hoertest.gdt`;
    link.click();
}

// Dein Original für startButton und stopButton
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    if (startButton) {
        startButton.addEventListener('click', () => {
            const audio = new Audio('assets/tone.mp3'); // Passe Pfad an
            audio.play();
            startButton.disabled = true;
            stopButton.disabled = false;
            audio.onended = () => {
                startButton.disabled = false;
            };
        });
    }
    if (stopButton) {
        stopButton.addEventListener('click', () => {
            // Pause Audio (falls nötig)
            document.getElementById('tone-setting').classList.add('hidden');
            document.getElementById('initial-test').classList.remove('hidden');
        });
    }

    const startInitialTestButton = document.getElementById('start-initial-test-button');
    if (startInitialTestButton) {
        startInitialTestButton.addEventListener('click', startInitialTest);
    }

    const startHearingTestButton = document.getElementById('start-hearing-test-button');
    if (startHearingTestButton) {
        startHearingTestButton.addEventListener('click', startHearingTest);
    }

    const nextButton = document.getElementById('nextButton');
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            // Deine Original-Logik für Nächstes Wort
        });
    }
});

// Dein Original für Chart
function createResultsChart() {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1kHz', '2kHz', '4kHz'],
            datasets: [{
                label: 'Rechtes Ohr',
                data: [20, 25, 30],
                borderColor: 'red'
            }, {
                label: 'Linkes Ohr',
                data: [15, 20, 25],
                borderColor: 'blue'
            }]
        }
    });
}
