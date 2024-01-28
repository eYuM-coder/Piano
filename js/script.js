let keyboard = document.querySelector('.piano__keyboard');
let pianoNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
let keynumber = 0;
let ctx = new AudioContext();
const oscillators = {};
const octaves = 5;
const startingOctave = 2;
const mainOctave = 0;
const numberOfKeys = 61;

function init() {
  keynumber = (6 * (octaves + startingOctave));
  for (let i = mainOctave; i <= octaves; i++) {
    for (let j = 0; j < 7; j++) {
      let sound = createSound('white', pianoNotes[j], i, keynumber);
      if((keynumber - (6*(octaves + startingOctave))) < numberOfKeys){
        let key = createKey('white', pianoNotes[j], (i + startingOctave), keynumber);
        keyboard.appendChild(key);
        key.appendChild(sound);
      }

      if (j != 2 && j != 6) {
        keynumber++;
        sound = createSound('black', pianoNotes[j], i, keynumber);
        let emptySpace = document.createElement('div');
        if((keynumber - (6*(octaves + startingOctave))) < numberOfKeys){
          key = createKey('black', pianoNotes[j], (i + startingOctave), keynumber);
          emptySpace.className = 'empty-space';
          emptySpace.appendChild(key);
          key.appendChild(sound);
          keyboard.appendChild(emptySpace);
        } else {
          keyboard.appendChild(sound);
          keyboard.appendChild(emptySpace);
        }
      }
      keynumber++;
    }
  }
}

function createSound(type, note, octave, keynum) {
  let sound = document.createElement('sound');
  sound.classList.add(keynum);
  sound.dataset.letterNoteFileName = type == 'white' ? note + octave : note + 's' + octave;

  return sound;
}

function createKey(type, note, octave, keynum) {
  let key = document.createElement('button');
  key.className = `piano__key piano__key--${type}`;
  key.classList.add(keynum);
  key.dataset.letterNote = type == 'white' ? note + octave : note + '#' + octave;
  key.dataset.letterNoteFileName = type == 'white' ? note + octave : note + 's' + octave;
  key.textContent = key.dataset.letterNote;

  key.addEventListener('mousedown', () => {
    playSound(key, 127);
    key.classList.add('piano__key--playing');
  })
  key.addEventListener('mouseup', () => {
    //noteOff(keynum);
    key.classList.remove('piano__key--playing');
  })
  key.addEventListener('mouseleave', () => {
    //noteOff(keynum)
    key.classList.remove('piano__key--playing');
  })

  return key;
}

function playSound(key, velocity) {
  let soundSource = 'sounds/' + key.dataset.letterNoteFileName + '.mp3';
  let audio = new Audio(soundSource);
  let volume = velocity / 127;
  audio.volume = volume;
  audio.play();
}

function midiToFreq(number) {
  const a = 440;
  return (a / 32) * 2 ** ((number - 9) / 12);
}

if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then(success, fail);
}

function success(midiAccess) {
  midiAccess.addEventListener("statechange", updateDevices);

  const inputs = midiAccess.inputs;

  inputs.forEach((input) => {
    input.addEventListener("midimessage", handleInput);
  });
}

function getNoteFromMidi(midiNote) {
  const noteLetters = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
  const lowestMidiNote = 12;

  // Ensure the MIDI note is within a valid range
  const normalizedNote = ((midiNote - lowestMidiNote) % 12 + 12) % 12;

  // Calculate the octave based on MIDI note number
  const octave = Math.floor((midiNote - lowestMidiNote) / 12);

  let key = noteLetters[normalizedNote] + octave;

  return key;
}



function handleInput(event) {
  const command = event.data[0];
  const midiNote = event.data[1];
  const velocity = event.data[2];

  const note = getNoteFromMidi(midiNote);

  // Assuming the dataset is attached to the piano key buttons
  const keyon = document.querySelector(`[data-letter-note-file-name="${note}"]`);

  switch (command) {
    case 144:
    case 145:
    case 146:
    case 147:
    case 148:
    case 149:
    case 150:
    case 151:
    case 152:
    case 153:
    case 154:
    case 155:
    case 156:
    case 157:
    case 158:
    case 159:
      playSound(midiNote, velocity);
      keyon.classList.add("piano__key--playing");
      break;
    case 128:
    case 129:
    case 130:
    case 131:
    case 132:
    case 133:
    case 134:
    case 135:
    case 136:
    case 137:
    case 138:
    case 139:
    case 140:
    case 141:
    case 142:
    case 143:
      keyon.classList.remove("piano__key--playing");
      break;
  }
}

function noteOn(note, velocity) {
  const osc = ctx.createOscillator();

  const oscGain = ctx.createGain();
  oscGain.gain.value = 0.33;

  const velocityGainAmount = (1 / 127) * velocity;
  const velocityGain = ctx.createGain();
  velocityGain.gain.value = velocityGainAmount;

  osc.type = "sawtooth";
  osc.frequency.value = midiToFreq(note);

  osc.connect(oscGain);
  oscGain.connect(velocityGain);
  velocityGain.connect(ctx.destination);

  osc.gain = oscGain;

  oscGain.gain.setValueAtTime(oscGain.gain.value, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 10);

  oscillators[note.toString()] = osc;
  console.log(oscillators);
  console.log(note);
  osc.start();
}

function noteOff(note) {
  const osc = oscillators[note.toString()];
  const oscGain = osc.gain;

  oscGain.gain.setValueAtTime(oscGain.gain.value, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);

  setTimeout(() => {
    osc.stop();
    osc.disconnect();
  }, 2000);
  delete oscillators[note.toString()];
  console.log(oscillators);
}


function fail() {
  console.log("Could not connect MIDI");
}

function updateDevices(event) {
  console.log(event);
  console.log(
    `Name: ${event.port.name}, Brand: ${event.port.manufacturer}, State: ${event.port.state}, Type: ${event.port.type}`,
  );
}


init();