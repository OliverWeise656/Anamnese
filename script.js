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
    voiceAnalysisRecommended: false
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
        }, 3000); // 3 Sekunden Verzögerung
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
        } else if (state.reason.includes('schluckbeschwerden') || state.reason.includes('essstörungen') || state.reason.includes('schlucken') || state.reason.includes('schluckprobleme')) {
            return 'Haben Sie unfreiwillig Gewicht verloren?';
        } else if (state.reason.includes('stimmstörung') || state.reason.includes('heiserkeit') || state.reason.includes('heiser') || state.reason.includes('rauhe stimme') || state.reason.includes('stimme')) {
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
        } else if (state.reason.includes('schluckbeschwerden') || state.reason.includes('essstörungen') || state.reason.includes('schlucken') || state.reason.includes('schluckprobleme')) {
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
            state.urgency = 'direkt';
        } else if (days <= 2) {
            state.urgency = intensity > 6 ? 'direkt' : 'schnell';
        } else if (days <= 5) {
            state.urgency = intensity > 6 ? 'direkt' : 'schnell';
        } else {
            state.urgency = intensity > 8 ? 'schnell' : 'normal';
        }
    } else {
        if (days <= 2) {
            state.urgency = intensity > 6 ? 'direkt' : 'schnell';
        } else if (days <= 5) {
            state.urgency = intensity > 6 ? 'direkt' : 'schnell';
        } else {
            state.urgency = intensity > 8 ? 'schnell' : 'normal';
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
            state.urgency = 'schnell';
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
        recommendation += ' Wir empfehlen Ihnen, einen Hörtest zu machen.';
    }
    if (reason.includes('stimmstörung') || reason.includes('heiserkeit') || reason.includes('heiser') || reason.includes('rauhe stimme') || reason.includes('stimme')) {
        state.voiceAnalysisRecommended = true;
        recommendation += ' Wir empfehlen Ihnen, eine Stimmanalyse zu machen.';
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
    document.getElementById("stopButton").disabled = false; // Aktiviert den "Stopp"-Button
}

function stopTone() {
    if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
    }
    if (audioContext) {
        audioContext.close();
    }
    document.getElementById("startButton").disabled = false;
    document.getElementById("stopButton").disabled = true;
    setTimeout(startToneTest, 5000);  // Nach 5 Sekunden zum Hörtest weiterleiten
}
document.getElementById("startButton").addEventListener("click", startTone);
document.getElementById("stopButton").addEventListener("click", stopTone);


// Hörtest Funktionen
let frequencies = [500, 750, 1000, 2000, 4000, 6000];
let currentFrequencyIndex = 0;
let currentDb = -40; // Startlautstärke auf -40 dB setzen
let results = { right: {}, left: {} };
let currentSide = '';
let audioContext;
let oscillator;
let gainNode;
let panner;

function startToneTest() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Leiser Ton
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
}

function stopToneTest() {
    if (oscillator) {
        oscillator.stop();
        audioContext.close();
    }
    proceedToHearingTest();
}

function proceedToHearingTest() {
    document.getElementById('tone-setting').style.display = 'none';
    document.getElementById('tone-test').style.display = 'block';
}

function startTest(side) {
  currentSide = side;
  currentFrequencyIndex = 0;
  document.getElementById('instructions').style.display = 'none';
  document.getElementById('results').style.display = 'none';
  document.getElementById('leftTestButton').style.display = 'none';
  document.getElementById('test').style.display = 'block';
  startTone();
}

function startTone() {
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
  currentDb = -40; // Startlautstärke auf -40 dB setzen
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
  stopTone();

  if (currentFrequencyIndex < frequencies.length - 1) {
    currentFrequencyIndex++;
    setTimeout(startTone, Math.random() * (1000 - 250) + 250);
  } else {
    if (currentSide === 'right') {
      document.getElementById('test').style.display = 'none';
      document.getElementById('results').style.display = 'block';
      document.getElementById('leftTestButton').style.display = 'block';
    } else {
      document.getElementById('test').style.display = 'none';
      displayResults();
      renderChart();
    }
  }
}

function stopTone() {
  oscillator.stop();
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

  document.getElementById('results').style.display = 'block';
}

function renderChart() {
  const ctx = document.getElementById('resultsChart').getContext('2d');
  const rightData = frequencies.map(freq => -results.right[freq] || -90);
  const leftData = frequencies.map(freq => -results.left[freq] || -90);

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
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value + ' dB';
            }
          },
          title: {
            display: true,
            text: 'Hörschwelle (dB)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Frequenz (Hz)'
          }
        }
      }
    }
  });

  document.getElementById('resultsChart').style.display = 'block';
}

// Sprachverständnis-Test Funktionen
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
let score = 0;

// Shuffle array and select first 20 unique words
while (selectedWords.length < numWords) {
    const randomIndex = Math.floor(Math.random() * words.length);
    const word = words[randomIndex];
    if (!selectedWords.includes(word)) {
        selectedWords.push(word);
    }
}

document.getElementById('start-button').addEventListener('click', startInitialTest);
document.getElementById('submit-button').addEventListener('click', checkAnswer);

function startInitialTest() {
    document.getElementById('start-button').style.display = 'none';
    document.getElementById('test-area').style.display = 'block';
    playWord();
}

function playWord() {
    const word = selectedWords[currentWordIndex];
    const audio = new SpeechSynthesisUtterance(word);
    window.speechSynthesis.speak(audio);
}

function checkAnswer() {
    const userAnswer = document.getElementById('answer-input').value.trim().toLowerCase();
    const correctAnswer = selectedWords[currentWordIndex];
    if (userAnswer === correctAnswer) {
        score++;
    }
    currentWordIndex++;
    document.getElementById('answer-input').value = '';
    if (currentWordIndex < numWords) {
        playWord();
    } else {
        showInitialResult();
    }
}

function showInitialResult() {
    document.getElementById('test-area').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('result').innerText = 'Test beendet! Deine Punktzahl: ' + score + ' von ' + numWords;
    setTimeout(startHearingTest, 3000);
}

// Hörtest im Störschall Funktionen
const audioFiles = [
  {name: 'Schuh', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/Schuh.m4a?v=1720614938001'},
  {name: 'Sohn', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/Sohn.m4a?v=1720614938455'},
  {name: 'weiß', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/wei%C3%9F.m4a?v=1720614938967'},
  {name: 'Zahn', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/Zahn.m4a?v=1720614939437'},
  {name: 'brav', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/brav.m4a?v=1720614939817'},
  {name: 'Baum', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/Baum.m4a?v=1720614940236'},
  {name: 'Dach', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/Dach.m4a?v=1720614940678'},
  {name: 'Fass', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/Fass.m4a?v=1720614941077'},
  {name: 'Hund', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/Hund.m4a?v=1720614941430'},
  {name: 'klein', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/klein.m4a?v=1720614941788'},
  {name: 'laut', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/laut.m4a?v=1720614942187'},
  {name: 'Mann', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/Mann.m4a?v=1720614942555'},
  {name: 'nass', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/nass.m4a?v=1720614942946'},
  {name: 'Raum', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/Raum.m4a?v=1720614943371'},
  {name: 'Saal', url: 'https://cdn.glitch.global/1208bf51-3981-40d2-906e-24c39a0af93f/Saal.m4a?v=1720614943788'}
];

let testWords = [];
let currentHearingWordIndex = 0;

function startHearingTest() {
    document.getElementById('result').style.display = 'none';
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
    score++;
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
  document.getElementById('final-result').innerText = 'Test beendet! Deine Gesamtpunktzahl: ' + score + ' von ' + (numWords + testWords.length);
  setTimeout(() => {
    let frequencies = [500, 750, 1000, 2000, 4000, 6000];
let currentFrequencyIndex = 0;
let currentDb = -40; // Startlautstärke auf -40 dB setzen
let results = { right: {}, left: {} };
let currentSide = '';
let audioContext;
let oscillator;
let gainNode;
let panner;

function startTest(side) {
  currentSide = side;
  currentFrequencyIndex = 0;
  document.getElementById('instructions').classList.add('hidden');
  document.getElementById('results').classList.add('hidden');
  document.getElementById('leftTestButton').classList.add('hidden');
  document.getElementById('test').classList.remove('hidden');
  startTone();
}

function startTone() {
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
  currentDb = -40; // Startlautstärke auf -40 dB setzen
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
  stopTone();

  if (currentFrequencyIndex < frequencies.length - 1) {
    currentFrequencyIndex++;
    setTimeout(startTone, Math.random() * (1000 - 250) + 250);
  } else {
    if (currentSide === 'right') {
      document.getElementById('test').classList.add('hidden');
      document.getElementById('results').classList.remove('hidden');
      document.getElementById('leftTestButton').classList.remove('hidden');
    } else {
      document.getElementById('test').classList.add('hidden');
      displayResults();
      renderChart();
    }
  }
}

function stopTone() {
  oscillator.stop();
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
  const rightData = frequencies.map(freq => -results.right[freq] || -90);
  const leftData = frequencies.map(freq => -results.left[freq] || -90);

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
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value + ' dB';
            }
          },
          title: {
            display: true,
            text: 'Hörschwelle (dB)'
          }
        },
        x: {
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

    if (state.age > 6 && state.age < 16) {
      window.location.href = 'https://sulky-equal-cinnamon.glitch.me';
    } else if (state.voiceAnalysisRecommended) {
      window.location.href = 'https://classic-broadleaf-blender.glitch.me';
    }
  }, 3000);
}
