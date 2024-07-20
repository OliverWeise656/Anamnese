let frequencies = [1000, 750, 500, 2000, 4000, 6000];
let currentFreqIndex = 0;
let side = 'right';
let results = { right: [], left: [] };
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let oscillator, gainNode;

document.getElementById('start-btn').addEventListener('click', startTest);

function startTest() {
  if (currentFreqIndex < frequencies.length) {
    playTone(frequencies[currentFreqIndex]);
    document.getElementById('instruction').innerText = `Testet ${frequencies[currentFreqIndex]} Hz auf der ${side}-Seite. Klicken Sie, sobald Sie den Ton hören.`;
  } else if (side === 'right') {
    side = 'left';
    currentFreqIndex = 0;
    document.getElementById('instruction').innerText = 'Wechseln Sie die Seite und klicken Sie auf den Button, um den Test auf der linken Seite zu starten.';
    document.getElementById('start-btn').innerText = 'Test links starten';
  } else {
    displayResults();
  }
}

function playTone(frequency) {
  oscillator = audioContext.createOscillator();
  gainNode = audioContext.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 3);
  
  oscillator.start();
  
  document.addEventListener('click', confirmHearing, { once: true });
}

function confirmHearing() {
  oscillator.stop();
  oscillator.disconnect();
  gainNode.disconnect();
  
  results[side].push(frequencies[currentFreqIndex]);
  currentFreqIndex++;
  startTest();
}

function displayResults() {
  document.getElementById('instruction').innerText = 'Der Hörtest ist abgeschlossen. Hier ist Ihr Audiogramm:';
  document.getElementById('start-btn').style.display = 'none';
  
  let audiogram = document.getElementById('audiogram');
  let table = '<table border="1"><tr><th>Frequenz (Hz)</th><th>Rechts</th><th>Links</th></tr>';
  
  frequencies.forEach((freq, index) => {
    table += `<tr><td>${freq}</td><td>${results.right[index] !== undefined ? 'Hört' : 'Hört nicht'}</td><td>${results.left[index] !== undefined ? 'Hört' : 'Hört nicht'}</td></tr>`;
  });
  
  table += '</table>';
  audiogram.innerHTML = table;
}
