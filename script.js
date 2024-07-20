const frequencies = [1000, 750, 500, 2000, 4000, 6000];
const maxDecibels = 90;
let currentEar = 'right';
let results = { right: [], left: [] };
let audioCtx, oscillator, gainNode;
let buttonPressed = false;

function dbToGain(db) {
    return Math.pow(10, db / 20);
}

async function playTone(frequency, initialGain = 0.0001) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(initialGain, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    console.log(`Playing tone at ${frequency} Hz`);

    let currentGain = initialGain;
    let targetGain = dbToGain(maxDecibels);

    while (currentGain < targetGain && !buttonPressed) {
        currentGain = Math.min(currentGain * 1.5, targetGain); // Schrittweise Erhöhung
        gainNode.gain.setValueAtTime(currentGain, audioCtx.currentTime + 1);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 Sekunde warten
    }

    return currentGain; // Rückgabe der zuletzt erreichten Lautstärke
}

function stopTone() {
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1);
    setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
        console.log('Tone stopped');
    }, 1000);
}

async function testFrequency(frequency) {
    document.getElementById('instructions').innerText = `Frequenz ${frequency} Hz - Drücken Sie die Taste, sobald Sie den Ton hören.`;
    buttonPressed = false;
    document.getElementById('startTestBtn').style.display = 'none';

    let initialGain = await playTone(frequency);

    await new Promise(resolve => {
        document.addEventListener('keydown', () => {
            buttonPressed = true;
            stopTone();
            resolve();
        }, { once: true });
    });

    console.log('Heard first time, resetting volume...');
    let reducedGain = initialGain / 2; // Lautstärke nur halb so stark zurücksetzen
    await playTone(frequency, reducedGain);

    let resultTime = await new Promise(resolve => {
        document.addEventListener('keydown', () => {
            buttonPressed = true;
            stopTone();
            resolve(audioCtx.currentTime);
        }, { once: true });
    });

    return resultTime;
}

async function startTest(ear) {
    currentEar = ear;
    document.getElementById('startTestBtn').style.display = 'none';
    document.getElementById('instructions').innerText = 'Drücken Sie eine Taste, wenn Sie einen Ton hören!';
    for (const frequency of frequencies) {
        const result = await testFrequency(frequency);
        results[currentEar].push({ frequency, result });
    }
    if (ear === 'right') {
        document.getElementById('instructions').innerText = 'Wechseln Sie jetzt auf das linke Ohr und starten Sie den Test erneut.';
        document.getElementById('startTestBtn').innerText = 'Test für linkes Ohr starten';
        document.getElementById('startTestBtn').style.display = 'block';
        document.getElementById('startTestBtn').onclick = () => startTest('left');
    } else {
        displayResults();
    }
}

function displayResults() {
    const ctx = document.getElementById('audiogram').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: frequencies,
            datasets: [
                {
                    label: 'Rechts',
                    data: results.right.map(r => r.result),
                    borderColor: 'red',
                    fill: false
                },
                {
                    label: 'Links',
                    data: results.left.map(r => r.result),
                    borderColor: 'blue',
                    fill: false
                }
            ]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Frequenz (Hz)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Hörschwelle (dB)'
                    }
                }
            }
        }
    });
}

document.getElementById('startTestBtn').onclick = () => startTest('right');
