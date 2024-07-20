let frequencies = [1000, 750, 500, 2000, 4000, 6000];
let currentFrequencyIndex = 0;
let currentDb = 0;
let results = { right: {}, left: {} };
let currentSide = '';
let audioContext;
let oscillator;
let gainNode;

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

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequencies[currentFrequencyIndex], audioContext.currentTime);
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();

  increaseVolume();
}

function increaseVolume() {
  currentDb = 0;
  let increaseInterval = setInterval(() => {
    if (currentDb < 90) {
      currentDb += 1;
      gainNode.gain.setValueAtTime(currentDb / 100, audioContext.currentTime);
    } else {
      clearInterval(increaseInterval);
    }
  }, 500);
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
      drawChart();
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
  document.getElementById('instructions').classList.remove('hidden');
}

function drawChart() {
  const ctx = document.getElementById('resultsChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: frequencies,
      datasets: [
        {
          label: 'Rechts',
          data: frequencies.map(freq => results.right[freq] || null),
          borderColor: 'red',
          fill: false
        },
        {
          label: 'Links',
          data: frequencies.map(freq => results.left[freq] || null),
          borderColor: 'blue',
          fill: false
        }
      ]
    },
    options: {
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Frequenz (Hz)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Lautstärke (dB)'
          },
          suggestedMin: 0,
          suggestedMax: 90
        }
      }
    }
  });
}
