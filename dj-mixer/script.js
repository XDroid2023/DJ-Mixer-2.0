class DJDeck {
    constructor(deckNumber) {
        this.audio = new Audio();
        this.isPlaying = false;
        this.volume = document.getElementById(`volume${deckNumber}`);
        this.playButton = document.querySelector(`[data-deck="${deckNumber}"]`);
        this.fileInput = document.getElementById(`audio${deckNumber}`);
        this.record = document.querySelector(`#deck${deckNumber} .record`);
        this.deck = document.querySelector(`#deck${deckNumber}`);

        // Set up audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);

        // Initialize audio source
        this.source = null;

        // Event listeners
        this.playButton.addEventListener('click', () => this.togglePlay());
        this.volume.addEventListener('input', () => this.updateVolume());
        this.fileInput.addEventListener('change', (e) => this.loadTrack(e));

        // Initial volume
        this.updateVolume();
    }

    async loadTrack(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Disconnect and clean up old source if it exists
            if (this.source) {
                this.source.disconnect();
            }

            // Create and configure new source
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = audioBuffer;
            this.source.connect(this.gainNode);
            this.source.loop = true;

            // Update UI
            this.playButton.textContent = 'Play';
            this.isPlaying = false;
            this.deck.classList.remove('playing');
            
            console.log('Track loaded successfully');
        } catch (error) {
            console.error('Error loading track:', error);
            alert('Error loading audio file. Please try another file.');
        }
    }

    togglePlay() {
        if (!this.source) {
            alert('Please load a track first');
            return;
        }

        if (this.isPlaying) {
            this.source.stop();
            this.playButton.textContent = 'Play';
            this.deck.classList.remove('playing');
        } else {
            // Create and configure new source for playback
            const newSource = this.audioContext.createBufferSource();
            newSource.buffer = this.source.buffer;
            newSource.connect(this.gainNode);
            newSource.loop = true;
            newSource.start();
            this.source = newSource;
            this.playButton.textContent = 'Stop';
            this.deck.classList.add('playing');
        }
        this.isPlaying = !this.isPlaying;
    }

    updateVolume() {
        this.gainNode.gain.value = this.volume.value / 100;
    }
}

class DJMixer {
    constructor() {
        // Initialize decks
        this.deck1 = new DJDeck(1);
        this.deck2 = new DJDeck(2);
        this.crossfader = document.getElementById('crossfader');
        this.effectVolume = document.getElementById('effectVolume');
        
        // Set up audio context for effects
        this.effectsContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Initialize effects
        this.initializeEffects();
        
        // Add crossfader event listener
        this.crossfader.addEventListener('input', () => this.updateCrossfade());
    }

    initializeEffects() {
        // Pre-load all sound effects
        this.effects = {
            scratch: { audio: new Audio('sounds/scratch.wav'), playing: false },
            airhorn: { audio: new Audio('sounds/airhorn.wav'), playing: false },
            drum: { audio: new Audio('sounds/drumroll.wav'), playing: false },
            transition: { audio: new Audio('sounds/transition.wav'), playing: false },
            bass: { audio: new Audio('sounds/bassdrop.wav'), playing: false },
            cymbal: { audio: new Audio('sounds/cymbal.wav'), playing: false }
        };

        // Set initial volumes
        Object.values(this.effects).forEach(effect => {
            effect.audio.volume = this.effectVolume.value / 100;
        });

        // Update volumes when slider changes
        this.effectVolume.addEventListener('input', () => {
            const volume = this.effectVolume.value / 100;
            Object.values(this.effects).forEach(effect => {
                effect.audio.volume = volume;
            });
        });

        // Add click handlers to effect buttons
        document.querySelectorAll('.effect-btn').forEach(button => {
            button.addEventListener('click', () => {
                const effectName = button.dataset.sound;
                const effect = this.effects[effectName];
                
                if (effect) {
                    // If the effect is already playing, reset it
                    if (effect.playing) {
                        effect.audio.currentTime = 0;
                    } else {
                        effect.audio.play().catch(error => {
                            console.error(`Error playing ${effectName}:`, error);
                        });
                    }

                    // Visual feedback
                    button.style.background = 'var(--primary-color)';
                    button.style.color = 'var(--bg-dark)';
                    setTimeout(() => {
                        button.style.background = '';
                        button.style.color = '';
                    }, 200);

                    // Update playing state
                    effect.playing = true;
                    effect.audio.onended = () => {
                        effect.playing = false;
                    };
                }
            });
        });

        // Log when effects are loaded
        Object.entries(this.effects).forEach(([name, effect]) => {
            effect.audio.addEventListener('canplaythrough', () => {
                console.log(`${name} sound effect loaded successfully`);
            });
            
            effect.audio.addEventListener('error', (e) => {
                console.error(`Error loading ${name} sound effect:`, e);
            });
        });
    }

    updateCrossfade() {
        const value = this.crossfader.value / 100;
        this.deck1.gainNode.gain.value = this.deck1.volume.value / 100 * (1 - value);
        this.deck2.gainNode.gain.value = this.deck2.volume.value / 100 * value;
    }
}

// Initialize the mixer when the page loads
window.addEventListener('load', () => {
    const mixer = new DJMixer();
});
