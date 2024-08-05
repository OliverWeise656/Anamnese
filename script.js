const apiKey = 'sk-proj-JLaB04KZYMjiYFNNXrtwT3BlbkFJvODkrYLU7W9UBiZJ1DU2'; // Ihr API-Schlüssel
const clientId = '1093697496533-5pbn5mgp80hecng0lsemu94dci88oe4g.apps.googleusercontent.com'; // Ihre Google OAuth 2.0 Client ID
const spreadsheetId = '1GRPTS1oa3rAdapYTaCg01ZOHDKKxQJ8T9doeSF_HGrA'; // Ihre Google Sheets ID

let conversation = [
    { role: 'system', content: 'Du bist ein virtueller Assistent für eine HNO-Praxis, der Patienten bei der Anamnese hilft.' }
];

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
    hearingTestScore: 0
};

async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    if (userInput.trim() === '') return;

    addMessageToChat('User', userInput);
    document.getElementById('userInput').value = '';

    conversation.push({ role: 'user', content: userInput });

    const response = await getDoctorResponse(userInput);
    const doctorMessage = response;

    addMessageToChat('Doktor', doctorMessage);
    conversation.push({ role: 'assistant', content: doctorMessage });

    // Hier speichern wir die Anamnese-Daten
    await appendRow([userInput, doctorMessage, new Date().toLocaleString()]);

    // Überprüfen Sie, ob eine Weiterleitung erforderlich ist
    if (state.hearingTestRecommended || state.voiceAnalysisRecommended) {
        setTimeout(() => {
            if (state.hearingTestRecommended) {
                startToneSetting();
            } else if (state.voiceAnalysisRecommended) {
                window.location.href = 'https://classic-broadleaf-blender.glitch.me';
            }
        }, 10000); // 10 Sekunden Verzögerung
    }
}

async function getDoctorResponse(userInput) {
    if (state.age === null) {
        state.age = parseInt(userInput);
        if (isNaN(state.age)) {
            return 'Bitte geben Sie ein gültiges Alter an.';
        }
        state.isChild = state.age < 18;
        if (state.isChild) {
            if (state.age < 5) {
                return 'Wurde beim Kind als Säugling ein Hörscreening durchgeführt?';
            } else if (state.age < 7) {
                return 'Geht das Kind in den Kindergarten?';
            } else {
                return 'Geht das Kind in die Schule?';
            }
        } else {
            return 'Warum möchten Sie uns besuchen?';
        }
    }

    if (state.isChild !== null && !state.isChild && state.reason === null) {
        state.reason = userInput.toLowerCase();
        if (state.reason.includes('schmerzen')) {
            return 'Wie lange bestehen die Schmerzen schon?';
        } else if (state.reason.includes('schwindel')) {
            return 'Wie lange haben Sie schon Schwindel?';
        } else if (state.reason.includes('ohrgeräusche') || state.reason.includes('tinnitus') || state.reason.includes('ohrrauschen') || state.reason.includes('ohrensausen') || state.reason.includes('geräusche im ohr')) {
            return 'Wie lange haben Sie schon Ohrgeräusche/Tinnitus?';
        } else if (state.reason.includes('hören') || state.reason.includes('hörverlust') || state.reason.includes('hörstörung') || state.reason.includes('hörproblem') || state.reason.includes('schwerhörig') || state.reason.includes('schlechtes hören') || state.reason.includes('höre schlecht')) {
            return 'Wie lange haben Sie schon Hörprobleme?';
        } else if (state.reason.includes('schluckbeschwerden') || state.reason.includes('essstörungen') || state.reason.includes('schlucken') || state.reason.includes('schluckprobleme')|| state.reason.includes('gewichtsverlust')) {
            return 'Haben Sie unfreiwillig Gewicht verloren?';
        } else if (state.reason.includes('stimmstörung') || state.reason.includes('heiserkeit') || state.reason.includes('heiser') || state.reason.includes('rauhe stimme') || state.reason.includes('stimme')|| state.reason.includes('Stimmverlust') || state.reason.includes('Probleme mit dem Singen') ) {
            state.voiceAnalysisRecommended = true;
            return 'Gibt es sonst noch etwas, das Sie uns mitteilen möchten?';
        }
        return 'Gibt es sonst noch etwas, das Sie uns mitteilen möchten?';
    }

    if (state.reason !== null) {
        if (state.reason.includes('schmerzen')) {
            if (state.painDuration === null) {
                state.painDuration = userInput.toLowerCase();
                return 'Wie stark schätzen Sie die Schmerzen auf einer Skala von 1-10 ein?';
            }

            if (state.painIntensity === null) {
                state.painIntensity = parseInt(userInput);
                if (isNaN(state.painIntensity) || state.painIntensity < 1 || state.painIntensity > 10) {
                    return 'Bitte geben Sie eine Zahl zwischen 1 und 10 an.';
                }
                updateUrgency(state.painDuration, state.painIntensity, state.isChild);
                return 'Gibt es sonst noch etwas, das Sie uns mitteilen möchten?';
            }
        } else if (state.reason.includes('schwindel')) {
            if (state.dizzinessDuration === null) {
                state.dizzinessDuration = userInput.toLowerCase();
                return 'Wie stark schätzen Sie den Schwindel auf einer Skala von 1-10 ein?';
            }

            if (state.dizzinessIntensity === null) {
                state.dizzinessIntensity = parseInt(userInput);
                if (isNaN(state.dizzinessIntensity) || state.dizzinessIntensity < 1 || state.dizzinessIntensity > 10) {
                    return 'Bitte geben Sie eine Zahl zwischen 1 und 10 an.';
                }
                updateUrgency(state.dizzinessDuration, state.dizzinessIntensity);
                return 'Gibt es sonst noch etwas, das Sie uns mitteilen möchten?';
            }
        } else if (state.reason.includes('ohrgeräusche') || state.reason.includes('tinnitus') || state.reason.includes('ohrrauschen') || state.reason.includes('ohrensausen') || state.reason.includes('geräusche im ohr')) {
            if (state.tinnitusDuration === null) {
                state.tinnitusDuration = userInput.toLowerCase();
                return 'In welchem Ohr haben Sie die Ohrgeräusche/Tinnitus?';
            }

            if (state.tinnitusEar === null) {
                state.tinnitusEar = userInput.toLowerCase();
                return 'Wie stark schätzen Sie die Ohrgeräusche/Tinnitus auf einer Skala von 1-10 ein?';
            }

            if (state.tinnitusIntensity === null) {
                state.tinnitusIntensity = parseInt(userInput);
                if (isNaN(state.tinnitusIntensity) || state.tinnitusIntensity < 1 || state.tinnitusIntensity > 10) {
                    return 'Bitte geben Sie eine Zahl zwischen 1 und 10 an.';
                }
                updateUrgency(state.tinnitusDuration, state.tinnitusIntensity);
                return 'Gibt es sonst noch etwas, das Sie uns mitteilen möchten?';
            }
        } else if (state.reason.includes('hören') || state.reason.includes('hörverlust') || state.reason.includes('hörstörung') || state.reason.includes('hörproblem') || state.reason.includes('schwerhörig') || state.reason.includes('schlechtes hören') || state.reason.includes('höre schlecht')) {
            state.hearingTestRecommended = true;
            if (state.hearingLossDuration === null) {
                state.hearingLossDuration = userInput.toLowerCase();
                return 'In welchem Ohr haben Sie die Hörprobleme?';
            }

            if (state.hearingLossEar === null) {
                state.hearingLossEar = userInput.toLowerCase();
                return 'Wie stark schätzen Sie die Hörprobleme auf einer Skala von 1-10 ein?';
            }

            if (state.hearingLossIntensity === null) {
                state.hearingLossIntensity = parseInt(userInput);
                if (isNaN(state.hearingLossIntensity) || state.hearingLossIntensity < 1 || state.hearingLossIntensity > 10) {
                    return 'Bitte geben Sie eine Zahl zwischen 1 und 10 an.';
                }
                updateUrgency(state.hearingLossDuration, state.hearingLossIntensity);
                return 'Gibt es sonst noch etwas, das Sie uns mitteilen möchten?';
            }
        } else if (state.reason.includes('schluckbeschwerden') || state.reason.includes('essstörungen') || state.reason.includes('schlucken') || state.reason.includes('schluckprobleme') || state.reason.includes('gewichtsverlust')) {
            if (state.weightLoss === null) {
                state.weightLoss = userInput.toLowerCase();
                if (state.weightLoss === 'ja') {
                    return 'Wie viel Gewicht haben Sie in welchem Zeitraum unfreiwillig verloren?';
                }
                state.weightLoss = 'nein';
                return 'Gibt es sonst noch etwas, das Sie uns mitteilen möchten?';
            }
            if (state.weightLoss === 'ja' && state.weightLossAmount === null) {
                state.weightLossAmount = userInput.toLowerCase();
                checkWeightLossUrgency(state.weightLossAmount);
                return 'Gibt es sonst noch etwas, das Sie uns mitteilen möchten?';
            }
        }
    }

    if (state.isChild !== null && state.isChild) {
        if (state.age < 5 && state.hearingScreening === null) {
            state.hearingScreening = userInput.toLowerCase();
            if (state.hearingScreening === 'ja') {
                return 'Wie war das Ergebnis des Hörscreenings?';
            } else {
                state.urgency = 'schnell'; // Wenn kein Hörscreening durchgeführt wurde
                return 'Geht das Kind in den Kindergarten?';
            }
        }

        if (state.age < 5 && state.hearingScreeningResult === null && state.hearingScreening === 'ja') {
            state.hearingScreeningResult = userInput.toLowerCase();
            if (state.hearingScreeningResult.includes('auffällig')) {
                state.urgency = 'schnell'; // Wenn das Hörscreening auffällig war
            }
            return 'Geht das Kind in den Kindergarten?';
        }

        if (state.age < 7 && state.kindergarten === null) {
            state.kindergarten = userInput.toLowerCase();
            if (state.kindergarten === 'ja') {
                return 'Ist dies eine Regeleinrichtung oder SBBZ?';
            } else {
                state.kindergarten = 'nein';
                return 'Hat das Kind Geschwister?';
            }
        }

        if (state.age >= 7 && state.school === null) {
            state.school = userInput.toLowerCase();
            return 'Was für eine Art von Schule besucht das Kind?';
        }

        if (state.school !== null && state.schoolType === null) {
            state.schoolType = userInput.toLowerCase();
            return 'Ist das Kind dort gut integriert?';
        }

        if ((state.kindergarten === 'ja' || state.schoolType !== null) && state.integration === null) {
            state.integration = userInput.toLowerCase();
            return 'Hat das Kind Geschwister?';
        }

        if (state.siblings === null) {
            if (userInput.toLowerCase() === 'ja') {
                state.siblings = true;
                return 'Wie viele Geschwister hat das Kind?';
            } else {
                state.siblings = false;
                return 'Wer hat die Familie geschickt?';
            }
        }

        if (state.siblings && state.siblingsCount === 0) {
            state.siblingsCount = parseInt(userInput);
            if (isNaN(state.siblingsCount) || state.siblingsCount <= 0) {
                return 'Bitte geben Sie eine gültige Anzahl von Geschwistern an.';
            }
            return `Wie alt ist Geschwisterkind ${state.currentSibling + 1}?`;
        }

        if (state.siblings && state.currentSibling < state.siblingsCount) {
            const siblingAge = parseInt(userInput);
            if (isNaN(siblingAge)) {
                return `Bitte geben Sie ein gültiges Alter für Geschwisterkind ${state.currentSibling + 1} an.`;
            }
            state.siblingsAges.push(siblingAge);
            state.currentSibling++;
            if (state.currentSibling < state.siblingsCount) {
                return `Wie alt ist Geschwisterkind ${state.currentSibling + 1}?`;
            }
            return 'Wer hat die Familie geschickt?';
        }

        if (state.referralSource === null) {
            state.referralSource = userInput.toLowerCase();
            return 'Warum wurde die Familie geschickt?';
        }

        if (state.reason === null) {
            state.reason = userInput.toLowerCase();
            if (state.reason.includes('schmerzen')) {
                return 'Wie lange bestehen die Schmerzen schon?';
            }
            const anamnesis = createAnamnesis();
            const additionalRecommendation = getAdditionalRecommendations(state.reason, state.age);
            return `Vielen Dank für die Informationen. Basierend auf Ihrer Schilderung empfehlen wir, dass Sie ${state.urgency} in die Praxis kommen.\n\nAnamnese:\n${anamnesis}${additionalRecommendation}`;
        }

        if (state.reason.includes('schmerzen')) {
            if (state.painDuration === null) {
                state.painDuration = userInput.toLowerCase();
                return 'Wie stark schätzen Sie die Schmerzen auf einer Skala von 1-10 ein?';
            }

            if (state.painIntensity === null) {
                state.painIntensity = parseInt(userInput);
                if (isNaN(state.painIntensity) || state.painIntensity < 1 || state.painIntensity > 10) {
                    return 'Bitte geben Sie eine Zahl zwischen 1 und 10 an.';
                }
                updateUrgency(state.painDuration, state.painIntensity, state.isChild);
            }
        }
    }

    const anamnesis = createAnamnesis();
    const additionalRecommendation = getAdditionalRecommendations(state.reason, state.age);
    return `Vielen Dank für die Informationen. Basierend auf Ihrer Schilderung empfehlen wir, dass Sie ${state.urgency} in die Praxis kommen.\n\nAnamnese:\n${anamnesis}${additionalRecommendation}`;
}

function updateUrgency(duration, intensity, isChild = false) {
    const days = parseInt(duration.split(' ')[0]); // Annahme, dass die Eingabe im Format "X Tage" erfolgt
    if (isChild) {
        if (days < 4 && intensity > 5) {
            state.urgency = 'regulär';
        } else if (days <= 2) {
            state.urgency = intensity > 6 ? 'schnell' : 'regulär';
        } else if (days <= 5) {
            state.urgency = intensity > 6 ? 'schnell' : 'regulär';
        } else {
            state.urgency = intensity > 8 ? 'regulär' : 'regulär';
        }
    } else {
        if (days <= 2) {
            state.urgency = intensity > 6 ? 'schnell' : 'regulär';
        } else if (days <= 5) {
            state.urgency = intensity > 6 ? 'schnell' : 'regulär';
        } else {
            state.urgency = intensity > 8 ? 'regulär' : 'regulär';
        }
    }
}

function checkWeightLossUrgency(weightLossAmount) {
    const weightLoss = weightLossAmount.match(/(\d+)\s*k[gG]/);
    const timePeriod = weightLossAmount.match(/(\d+)\s*(woche|wochen)/i);

    if (weightLoss && timePeriod) {
        const weight = parseInt(weightLoss[1]);
        const weeks = parseInt(timePeriod[1]);

           if (weight / weeks > 1) {
            state.urgency = 'direkt';
        } else {
            state.urgency = 'regulär';
        }
    }
}

function createAnamnesis() {
    let anamnesis = `Alter des Patienten: ${state.age} Jahre\n`;
    if (state.isChild) {
        if (state.age < 5) {
            anamnesis += `Hörscreening als Säugling: ${state.hearingScreening ? 'Ja' : 'Nein'}\n`;
            if (state.hearingScreening) {
                anamnesis += `Ergebnis des Hörscreenings: ${state.hearingScreeningResult}\n`;
            }
        }
        if (state.age < 7) {
            anamnesis += `Kindergarten: ${state.kindergarten ? 'Ja' : 'Nein'}\n`;
            if (state.kindergarten) {
                anamnesis += `Einrichtung: ${state.kindergarten}\n`;
            }
        } else {
            anamnesis += `Schule: ${state.school}\nSchulart: ${state.schoolType}\nIntegration: ${state.integration}\n`;
        }
        anamnesis += `Geschwister: ${state.siblings ? 'Ja' : 'Nein'}\n`;
        if (state.siblings) {
            anamnesis += `Anzahl der Geschwister: ${state.siblingsCount}\n`;
            anamnesis += `Alter der Geschwister: ${state.siblingsAges.join(', ')}\n`;
        }
    }
    anamnesis += `Grund des Besuchs: ${state.reason}\n`;
    if (state.painDuration) {
        anamnesis += `Schmerzen seit: ${state.painDuration}\nSchmerzintensität: ${state.painIntensity}\n`;
    }
    if (state.dizzinessDuration) {
        anamnesis += `Schwindel seit: ${state.dizzinessDuration}\nSchwindelintensität: ${state.dizzinessIntensity}\n`;
    }
    if (state.tinnitusDuration) {
        anamnesis += `Ohrgeräusche/Tinnitus seit: ${state.tinnitusDuration}\nOhr: ${state.tinnitusEar}\nTinnitusintensität: ${state.tinnitusIntensity}\n`;
    }
    if (state.hearingLossDuration) {
        anamnesis += `Hörprobleme seit: ${state.hearingLossDuration}\nOhr: ${state.hearingLossEar}\nHörproblemeintensität: ${state.hearingLossIntensity}\n`;
    }
    if (state.weightLoss !== null && state.weightLoss !== 'nein') {
        anamnesis += `Unfreiwilliger Gewichtsverlust: ${state.weightLoss}\n`;
        if (state.weightLossAmount !== null) {
            anamnesis += `Details zum Gewichtsverlust: ${state.weightLossAmount}\n`;
        }
    }
    return anamnesis;
}

function getAdditionalRecommendations(reason, age) {
    let recommendation = '';
    if (age > 4) {
        state.hearingTestRecommended = true;
        recommendation += ' Wir empfehlen Ihnen, einen Hörtest durchzuführen.';
    }
    if (reason.includes('stimmstörung') || reason.includes('heiserkeit') || reason.includes('heiser') || reason.includes('rauhe stimme') || reason.includes('stimme')|| reason.includes('singen')) {
        state.voiceAnalysisRecommended = true;
        recommendation += ' Wir empfehlen Ihnen, eine Stimmanalyse durchzuführen.';
    }
    return recommendation;
}

function addMessageToChat(sender, message) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender.toLowerCase());
    messageDiv.textContent = `${sender}: ${message}`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    console.log(`${sender}: ${message}`); // Debugging
}

function initializeChat() {
    console.log('Chat initialized'); // Debugging
    const initialMessage = 'Wie alt ist der Patient?';
    addMessageToChat('Doktor', initialMessage);
    conversation.push({ role: 'assistant', content: initialMessage });
    console.log('Initial message sent:', initialMessage); // Debugging
}

// Initialisiere den Chat, wenn die Seite geladen wird
window.onload = function() {
    gapi.load('client:auth2', initClient);
    initializeChat();
};

function initClient() {
    gapi.client.init({
        apiKey: apiKey,
        clientId: clientId,
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        scope: "https://www.googleapis.com/auth/spreadsheets"
    }).then(function () {
        console.log('GAPI client initialized');
    }, function(error) {
        console.error('Error initializing GAPI client', error);
    });
}

async function appendRow(values) {
    const params = {
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A:C',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS'
    };

    const valueRangeBody = {
        majorDimension: 'ROWS',
        values: [values]
    };

    try {
        const response = await gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
        console.log('Append response:', response.result); // Debugging
    } catch (error) {
        console.error('Error appending row', error);
    }
}

// Tone setting functions
let audioContext;
let oscillator;
let gainNode;

document.getElementById("startButton").addEventListener("click", startTone);
document.getElementById("stopButton").addEventListener("click", stopTone);

function startTone() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  oscillator = audioContext.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
  gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  document.getElementById("startButton").disabled = true;
  document.getElementById("stopButton").disabled = false;
}

function stopTone() {
  oscillator.stop();
  audioContext.close();
  document.getElementById("startButton").disabled = false;
  document.getElementById("stopButton").disabled = true;
  startInitialTest();
}

function startToneSetting() {
    document.getElementById('chatbot').style.display = 'none';
    document.getElementById('tone-setting').style.display = 'block';
}

function startInitialTest() {
    document.getElementById('tone-setting').style.display = 'none';
    document.getElementById('initial-test').style.display = 'block';
}

const words = ["haus", "baum", "hund", "katze", "fisch", "vogel", "blume", "tisch", "stuhl", "auto", 
               "rad", "uhr", "buch", "glas", "fenster", "tür", "weg", "licht", "bild", "zug", 
               "boot", "stadt", "dorf", "berg", "fluss", "meer", "insel", "sonne", "mond", "stern", 
               "gold", "geld", "hand", "kopf", "bein", "fuß", "ohr", "mund", "nase", "auge", 
               "brot", "kuchen", "salz", "zucker", "milch", "kaffee", "tee", "wein", "bier", "wasser",
               "rock", "hose", "hemd", "jacke", "schuh", "ring", "kette", "hut", "schirm", "uhr", 
               "zug", "bus", "flugzeug", "schiff", "fahrrad", "wagen", "bahn", "straße", "brücke", "garten", 
               "baum", "strauch", "blume", "wiese", "feld", "wald", "park", "teich", "fluss", "bach"];
const selectedWords = [];
const numWords = 10;
let currentWordIndex = 0;
let initialVolume = 1.0; // Start volume at 100%
const volumeDecrement = 0.1; // Decrease volume by 10% each step

// Shuffle array and select first 20 unique words
while (selectedWords.length < numWords) {
    const randomIndex = Math.floor(Math.random() * words.length);
    const word = words[randomIndex];
    if (!selectedWords.includes(word)) {
        selectedWords.push(word);
    }
}

document.getElementById('start-initial-test-button').addEventListener('click', startInitialTestSequence);
document.getElementById('submit-initial-test-button').addEventListener('click', checkAnswer);

function startInitialTestSequence() {
    document.getElementById('initial-test-heading').style.display = 'none';
    document.getElementById('initial-instructions').style.display = 'none';
    document.getElementById('start-initial-test-button').style.display = 'none';
    document.getElementById('test-area').style.display = 'block';
    playWord();
}

function playWord() {
    const word = selectedWords[currentWordIndex];
    const audio = new SpeechSynthesisUtterance(word);
    audio.volume = initialVolume;
    window.speechSynthesis.speak(audio);
}

function checkAnswer() {
    const userAnswer = document.getElementById('answer-input').value.trim().toLowerCase();
    const correctAnswer = selectedWords[currentWordIndex];
    if (userAnswer === correctAnswer) {
        state.initialTestScore++;
    }
    currentWordIndex++;
    initialVolume -= volumeDecrement; // Decrease volume
    document.getElementById('answer-input').value = '';
    if (currentWordIndex < numWords) {
        playWord();
    } else {
        showInitialResult();
    }
}

function showInitialResult() {
    document.getElementById('test-area').style.display = 'none';
    document.getElementById('initial-test-result').style.display = 'block';
    document.getElementById('initial-test-result').innerText = 'Test beendet! Deine Punktzahl: ' + state.initialTestScore + ' von ' + numWords;
    setTimeout(startHearingTest, 3000);
}

// --- Ab hier ist der Hörtest im Störschall Teil ---
// Vorheriger Code bleibt unverändert

// Sprachverständnis im Störschall Test
const audioFiles = [
  {name: 'Schuh', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/Schuh.mp3?v=1722797065553'},
  {name: 'Sohn', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/Sohn.mp3?v=1722797065853'},
  {name: 'weiß', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/wei%C3%9F.mp3?v=1722797067705'},
  {name: 'Zahn', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/Zahn.mp3?v=1722797068016'},
  {name: 'brav', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/brav.mp3?v=1722797061079'},
  {name: 'Baum', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/Baum.mp3?v=1722797060707'},
  {name: 'Dach', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/Dach.mp3?v=1722797061903'},
  {name: 'Fass', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/Fass.mp3?v=1722797062217'},
  {name: 'Hund', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/Hund.mp3?v=1722797062618'},
  {name: 'klein', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/klein.mp3?v=1722797062953'},
  {name: 'laut', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/laut.mp3?v=1722797063534'},
  {name: 'Mann', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/Mann.mp3?v=1722797063863'},
  {name: 'nass', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/nass.mp3?v=1722797064447'},
  {name: 'Raum', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/Raum.mp3?v=1722797064765'},
  {name: 'Saal', url: 'https://cdn.glitch.global/277d0540-fab3-4721-89e5-e493d6206e82/Saal.mp3?v=1722797065252'}
];

let testWords = [];
let currentHearingWordIndex = 0;

document.getElementById('start-hearing-test-button').addEventListener('click', startHearingTest);

function showHearingTestInfo() {
    document.getElementById('initial-test').style.display = 'none';
    document.getElementById('hearing-test-info').style.display = 'block';
}

function startHearingTest() {
    document.getElementById('hearing-test-info').style.display = 'none';
    document.getElementById('test').style.display = 'block';
    startHearingTestSequence();
}

function startHearingTestSequence() {
  testWords = audioFiles.sort(() => 0.5 - Math.random()).slice(0, 10);
  currentHearingWordIndex = 0;
  playHearingWord();
}

function playHearingWord() {
  const audioPlayer = document.getElementById('audioPlayer');
  audioPlayer.src = testWords[currentHearingWordIndex].url;
  audioPlayer.play();
}

document.getElementById('nextButton').addEventListener('click', nextHearingWord);

function nextHearingWord() {
  const response = document.getElementById('response').value.trim();
  if (response.toLowerCase() === testWords[currentHearingWordIndex].name.toLowerCase()) {
    state.hearingTestScore++;
  }
  document.getElementById('response').value = '';
  currentHearingWordIndex++;
  if (currentHearingWordIndex < testWords.length) {
    playHearingWord();
  } else {
    showFinalResult();
  }
}

function showFinalResult() {
  document.getElementById('test').style.display = 'none';
  document.getElementById('final-result').style.display = 'block';
  document.getElementById('final-result').innerText = 'Test beendet! Deine Gesamtpunktzahl: ' + state.hearingTestScore + ' von ' + testWords.length;
  setTimeout(() => {
    document.getElementById('final-result').style.display = 'none';
    startHearingTestProcess();
  }, 3000);
}

function startHearingTestProcess() {
  document.getElementById('hearing-test').style.display = 'block';
}

// Call showHearingTestInfo() after the initial test is completed
function showInitialResult() {
    document.getElementById('test-area').style.display = 'none';
    document.getElementById('initial-test-result').style.display = 'block';
    document.getElementById('initial-test-result').innerText = 'Test beendet! Deine Punktzahl: ' + state.initialTestScore + ' von ' + numWords;
    setTimeout(showHearingTestInfo, 3000);
}


function startHearingTestProcess() {
  document.getElementById('hearing-test').style.display = 'block';
}

let frequencies = [500, 750, 1000, 2000, 4000, 6000];
let currentFrequencyIndex = 0;
let currentDb = -60; // Startlautstärke auf -40 dB setzen
let results = { right: {}, left: {} };
let currentSide = '';

function startTest(side) {
  currentSide = side;
  currentFrequencyIndex = 0;
  document.getElementById('instructions').classList.add('hidden');
  document.getElementById('right-test-done').classList.add('hidden');
  document.getElementById('test-area').classList.remove('hidden');
  startToneHearingTest();
}

function startToneHearingTest() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  oscillator = audioContext.createOscillator();
  gainNode = audioContext.createGain();
  panner = audioContext.createStereoPanner();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequencies[currentFrequencyIndex], audioContext.currentTime);
  gainNode.gain.setValueAtTime(Math.pow(10, currentDb / 20), audioContext.currentTime);

  // Set the panner to the appropriate side
  panner.pan.setValueAtTime(currentSide === 'right' ? 1 : -1, audioContext.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(panner);
  panner.connect(audioContext.destination);

  oscillator.start();

  increaseVolume();
}

function increaseVolume() {
  currentDb = -60; // Startlautstärke auf -40 dB setzen
  let increaseInterval = setInterval(() => {
    if (currentDb < 90) {
      currentDb += 0.5; // Schrittweise Erhöhung um 0.5 dB
      gainNode.gain.setValueAtTime(Math.pow(10, currentDb / 20), audioContext.currentTime);
    } else {
      clearInterval(increaseInterval);
    }
  }, 1000);  // Erhöhungsintervall auf 1 Sekunde setzen
}

function heardTone() {
  results[currentSide][frequencies[currentFrequencyIndex]] = currentDb;
  stopToneHearingTest();

  if (currentFrequencyIndex < frequencies.length - 1) {
    currentFrequencyIndex++;
    setTimeout(startToneHearingTest, Math.random() * (5000 - 250) + 250);
  } else {
    if (currentSide === 'right') {
      document.getElementById('test-area').classList.add('hidden');
      document.getElementById('right-test-done').classList.remove('hidden');
    } else {
      document.getElementById('test-area').classList.add('hidden');
      displayResults();
      renderChart();
      saveResultsAsPDF();
    }
  }
}

function stopToneHearingTest() {
  oscillator.stop();
  oscillator.disconnect();
  gainNode.disconnect();
  audioContext.close();
}

function displayResults() {
  let tableBody = document.getElementById('resultsTableBody');
  tableBody.innerHTML = '';

  frequencies.forEach(freq => {
    let row = document.createElement('tr');
    let freqCell = document.createElement('td');
    let rightCell = document.createElement('td');
    let leftCell = document.createElement('td');

    freqCell.textContent = freq;
    rightCell.textContent = results.right[freq] || 'N/A';
    leftCell.textContent = results.left[freq] || 'N/A';

    row.appendChild(freqCell);
    row.appendChild(rightCell);
    row.appendChild(leftCell);
    tableBody.appendChild(row);
  });

  document.getElementById('results').classList.remove('hidden');
}

function renderChart() {
  const ctx = document.getElementById('resultsChart').getContext('2d');
  const rightData = frequencies.map(freq => results.right[freq] !== undefined ? results.right[freq] + 60 : null);
  const leftData = frequencies.map(freq => results.left[freq] !== undefined ? results.left[freq] + 60 : null);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: frequencies,
      datasets: [
        {
          label: 'Rechts',
          data: rightData,
          borderColor: 'red',
          fill: false,
          tension: 0.1
        },
        {
          label: 'Links',
          data: leftData,
          borderColor: 'blue',
          fill: false,
          tension: 0.1
        }
      ]
    },
    options: {
      scales: {
        y: {
          reverse: true,
          min: 0,
          max: 150, // -60 dB to 90 dB
          ticks: {
            callback: function(value) {
              // Adjust the displayed value to match the desired dB scale
              if (value === 0) return '0 dB';
              if (value === 20) return '-20 dB';
              if (value === 40) return '-40 dB';
              if (value === 60) return '-60 dB';
              if (value === 80) return '-80 dB';
              if (value === 100) return '-100 dB';
              if (value === 120) return '-120 dB';
              if (value === 140) return '-140 dB';
              if (value === 150) return '-150 dB';
              return (value - 60) + ' dB';
            }
          },
          title: {
            display: true,
            text: 'Hörschwelle (dB HL)'
          }
        },
        x: {
          position: 'top',
          title: {
            display: true,
            text: 'Frequenz (Hz)'
          }
        }
      }
    }
  });

  document.getElementById('resultsChart').classList.remove('hidden');
}

function saveResultsAsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text('Anamnese und Testergebnisse', 10, 10);
  doc.text('Alter des Patienten: ' + state.age, 10, 20);
  doc.text('Grund des Besuchs: ' + state.reason, 10, 30);

  let yPosition = 40;

  if (state.painDuration) {
    doc.text('Schmerzen seit: ' + state.painDuration, 10, yPosition);
    yPosition += 10;
    doc.text('Schmerzintensität: ' + state.painIntensity, 10, yPosition);
    yPosition += 10;
  }

  if (state.dizzinessDuration) {
    doc.text('Schwindel seit: ' + state.dizzinessDuration, 10, yPosition);
    yPosition += 10;
    doc.text('Schwindelintensität: ' + state.dizzinessIntensity, 10, yPosition);
    yPosition += 10;
  }

  if (state.tinnitusDuration) {
    doc.text('Ohrgeräusche/Tinnitus seit: ' + state.tinnitusDuration, 10, yPosition);
    yPosition += 10;
    doc.text('Ohr: ' + state.tinnitusEar, 10, yPosition);
    yPosition += 10;
    doc.text('Tinnitusintensität: ' + state.tinnitusIntensity, 10, yPosition);
    yPosition += 10;
  }

  if (state.hearingLossDuration) {
    doc.text('Hörprobleme seit: ' + state.hearingLossDuration, 10, yPosition);
    yPosition += 10;
    doc.text('Ohr: ' + state.hearingLossEar, 10, yPosition);
    yPosition += 10;
    doc.text('Hörproblemeintensität: ' + state.hearingLossIntensity, 10, yPosition);
    yPosition += 10;
  }

  if (state.weightLoss !== null && state.weightLoss !== 'nein') {
    doc.text('Unfreiwilliger Gewichtsverlust: ' + state.weightLoss, 10, yPosition);
    yPosition += 10;
    if (state.weightLossAmount !== null) {
      doc.text('Details zum Gewichtsverlust: ' + state.weightLossAmount, 10, yPosition);
      yPosition += 10;
    }
  }

  doc.text('Testergebnisse:', 10, yPosition);
  yPosition += 10;

  frequencies.forEach(freq => {
    doc.text(`Frequenz ${freq} Hz - Rechts: ${results.right[freq] || 'N/A'} dB, Links: ${results.left[freq] || 'N/A'} dB`, 10, yPosition);
    yPosition += 10;
  });

  doc.text('Sprachverständnis-Test Punktzahl: ' + state.initialTestScore + ' von ' + numWords, 10, yPosition);
  yPosition += 10;
  doc.text('Sprachverständnis im Störschall Punktzahl: ' + state.hearingTestScore + ' von ' + testWords.length, 10, yPosition);
  yPosition += 20;

  // Add the chart as an image to the PDF
  const canvas = document.getElementById('resultsChart');
  const imgData = canvas.toDataURL('image/png');
  doc.addImage(imgData, 'PNG', 10, yPosition, 180, 100);

  // Add the conversation to the PDF
  yPosition += 110;
  doc.text('Chatbot Konversation:', 10, yPosition);
  yPosition += 10;
  conversation.forEach((msg, index) => {
      const text = `${msg.role === 'user' ? 'User' : 'Doktor'}: ${msg.content}`;
      doc.text(text, 10, yPosition);
      yPosition += 10;
      if (yPosition > 280) { // Add new page if the content is too long
          doc.addPage();
          yPosition = 10;
      }
  });

  doc.save('Anamnese_und_Testergebnisse.pdf');

  // Weiterleitungen basierend auf den Ergebnissen
  setTimeout(() => {
    if (state.voiceAnalysisRecommended) {
      window.location.href = 'https://classic-broadleaf-blender.glitch.me';
    } else if (state.age > 6 && state.age < 16) {
      window.location.href = 'https://sulky-equal-cinnamon.glitch.me';
    } else {
      setTimeout(() => {
        alert('Herzlichen Dank für Ihre Mitarbeit. Auf dem Desktop wurden ihre Ergebnisse abgelegt. Bitte leiten sie diese an uns weiter!');
      }, 5000);
    }
  }, 5000);
}
