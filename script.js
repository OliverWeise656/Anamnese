const frequencies = [1000, 750, 500, 2000, 4000, 6000];
let currentEar = 'right';
let results = { right: [], left: [] };

async function playTone(frequency) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();

    return new Promise((resolve) => {
        console.log(`Playing tone at ${frequency} Hz`);
        let startTime = audioCtx.currentTime;
        gainNode.gain.linearRampToValueAtTime(1, startTime + 2);
        gainNode.gain.linearRampToValueAtTime(0, startTime + 4);
        setTimeout(() => {
            resolve(audioCtx.currentTime);
            oscillator.stop();
            audioCtx.close();
        }, 4000);
    });
}

async function testFrequency(frequency) {
    document.getElementById('instructions').innerText = `Frequenz ${frequency} Hz - Drücken Sie die Taste, sobald Sie den Ton hören.`;
    const heard = await new Promise((resolve) => {
        document.getElementById('startTestBtn').onclick = () => resolve(true);
    });
    if (heard) {
        const heardTime = await playTone(frequency);
        return heardTime;
    }
}

async function startTest(ear) {
    currentEar = ear;
    document.getElementById('startTestBtn').style.display = 'none';
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
