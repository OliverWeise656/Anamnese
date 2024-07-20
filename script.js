let frequencies = [500, 750, 1000, 2000, 4000, 6000];
let currentFrequencyIndex = 0;
let currentDb = -10;
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
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);

  // Set the panner to the appropriate side
  panner.pan.setValueAtTime(currentSide === 'right' ? 1 : -1, audioContext.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(panner);
  panner.connect(audioContext.destination);

  oscillator.start();

  increaseVolume();
}

function increaseVolume() {
  currentDb = -10;
  let increaseInterval = setInterval(() => {
    if (currentDb < 90) {
      currentDb += 0.5;
      gainNode.gain.setValueAtTime(Math.pow(10, currentDb / 20), audioContext.currentTime);
    } else {
      clearInterval(increaseInterval);
    }
  }, 1000);  // Increase interval to 1 second
}

function heardTone() {
  results[currentSide][frequencies[currentFrequencyIndex]] = currentDb;
  stopTone();

  if (currentFrequencyIndex < frequencies.length - 1) {
    currentFrequencyIndex++;
    setTimeout(startTone, Math.random() * (3000 - 250) + 250);
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
