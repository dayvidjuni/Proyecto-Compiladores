/*
================================================================================
 main.js - VISUAL NOVEL STUDIO IDE
 - Sistema de navegación entre vistas
 - Editor con números de línea
 - Gestor de Audio avanzado
================================================================================
*/

// --- SISTEMA DE NAVEGACIÓN ENTRE VISTAS ---
document.addEventListener('DOMContentLoaded', () => {
    // Obtener todos los botones de navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewName = button.getAttribute('data-view');
            switchView(viewName);
            
            // Actualizar estado activo de los botones
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
    
    // Inicializar el editor con números de línea
    initializeCodeEditor();
});

function switchView(viewName) {
    // Ocultar todas las vistas
    const allViews = document.querySelectorAll('.view');
    allViews.forEach(view => view.classList.remove('view-active'));
    
    // Mostrar la vista seleccionada
    const selectedView = document.getElementById(`view-${viewName}`);
    if (selectedView) {
        selectedView.classList.add('view-active');
    }
}

// --- EDITOR CON NÚMEROS DE LÍNEA ---
function initializeCodeEditor() {
    const scriptInput = document.getElementById('script-input');
    const lineNumbers = document.getElementById('line-numbers');
    
    if (!scriptInput || !lineNumbers) return;
    
    function updateLineNumbers() {
        const lines = scriptInput.value.split('\n').length;
        let lineNumbersHTML = '';
        
        for (let i = 1; i <= lines; i++) {
            lineNumbersHTML += i + '\n';
        }
        
        lineNumbers.innerText = lineNumbersHTML;
    }
    
    // Actualizar números al escribir
    scriptInput.addEventListener('input', updateLineNumbers);
    
    // Sincronizar scroll vertical
    scriptInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = scriptInput.scrollTop;
    });
    
    // Inicializar con números de línea
    updateLineNumbers();
}

// --- Gestor de Audio (requiere Howler.js en tu HTML) ---

// --- Gestor de Audio (requiere Howler.js en tu HTML) ---
const audioManager = {
    // 3 Canales separados
    channels: {
        music: null,    // Solo una pista de música a la vez
        ambient: null,  // Solo una pista de ambiente a la vez
        sfx: []         // Un "pool" de efectos de sonido
    },
    
    // Función de 'crossfade'
    playMusic: (track, options = {}) => {
        const newTrack = new Howl({
            src: [track],
            loop: true,
            volume: 0, // Empezar en silencio
            format: ['mp3']
        });

        const oldTrack = audioManager.channels.music;
        const fadeTime = (options.fade || 1.0) * 1000; // default 1 seg
        
        newTrack.play();
        newTrack.fade(0, (options.volume || 0.5), fadeTime); // Fade In
        
        if (oldTrack) {
            oldTrack.fade((oldTrack.volume() || 0.5), 0, fadeTime, () => {
                oldTrack.stop(); // Detener después del Fade Out
            });
        }
        
        audioManager.channels.music = newTrack;
    },
    
    playSfx: (sound, options = {}) => {
        const sfx = new Howl({
            src: [sound],
            volume: options.volume || 0.8,
            format: ['mp3']
        });
        sfx.play();
        audioManager.channels.sfx.push(sfx);
    },

    playAmbient: (track, options = {}) => {
        // Lógica idéntica a playMusic, pero en otro canal
        const newTrack = new Howl({
            src: [track],
            loop: true,
            volume: 0,
            format: ['mp3']
        });

        const oldTrack = audioManager.channels.ambient;
        const fadeTime = (options.fade || 1.0) * 1000;
        
        newTrack.play();
        newTrack.fade(0, (options.volume || 0.4), fadeTime);
        
        if (oldTrack) {
            oldTrack.fade((oldTrack.volume() || 0.4), 0, fadeTime, () => {
                oldTrack.stop();
            });
        }
        
        audioManager.channels.ambient = newTrack;
    },

    stopMusic: (options = {}) => {
        const oldTrack = audioManager.channels.music;
        const fadeTime = (options.fade || 1.0) * 1000;

        if (oldTrack) {
            oldTrack.fade(oldTrack.volume(), 0, fadeTime, () => {
                oldTrack.stop();
                audioManager.channels.music = null;
            });
        }
    },

    // ★ LÓGICA DE SETVOLUME IMPLEMENTADA ★
    setVolume: (channel, volume) => {
        console.log(`Setting volume for channel '${channel}' to ${volume}`);
        const track = audioManager.channels[channel]; // 'music' o 'ambient'
        if (track) {
            track.volume(volume);
        } else if (channel === 'sfx') {
            // Howler no tiene un "volumen global de sfx" fácil,
            // esto es una simplificación.
            console.warn("Setting global SFX volume is not yet implemented.");
        }
    }
};

// --- Interfaz de UI (El objeto que GameEngine controlará) ---
// ★ ESTA ES LA PARTE CORREGIDA ★
// Ahora todas las funciones de la UI simplemente "llaman"
// al audioManager principal, pasando las 'options'.
const uiInterface = {
    characterLayerEl: document.getElementById('character-layer'),

    showCharacter: (spriteUrl, position) => {
        const solutionStyle = 'mix-blend-mode: multiply;';
        let imgId = `char-${position}`;
        let imgEl = document.getElementById(imgId);
        if (!imgEl) {
            imgEl = document.createElement('img');
            imgEl.id = imgId;
            // (Asegúrate de tener los estilos CSS aquí, no '...')
            imgEl.style.cssText = ` 
                position: absolute;
                bottom: 0;
                height: 90%;
                max-width: 40%;
                transition: all 0.5s ease-out;
                ${solutionStyle}
            `;
            uiInterface.characterLayerEl.appendChild(imgEl);
        }
        
        // (Asegúrate de tener la lógica de posición aquí)
        if (position === 'left') {
            imgEl.style.transform = 'translateX(0%)';
            imgEl.style.left = '5%';
        } else if (position === 'center') {
            imgEl.style.transform = 'translateX(-50%)';
            imgEl.style.left = '50%';
        } else if (position === 'right') {
            imgEl.style.transform = 'translateX(-100%)';
            imgEl.style.left = '95%';
        }

        imgEl.src = spriteUrl;
    },

    setBackground: (imageUrl) => {
        const gameScreenEl = document.getElementById('game-screen');
        if (imageUrl) {
            gameScreenEl.style.backgroundImage = `url(${imageUrl})`;
        } else {
            gameScreenEl.style.backgroundImage = 'none';
        }
    },

    // --- Funciones de Audio "Conectadas" ---
    playMusic: (track, options) => {
        audioManager.playMusic(track, options);
    },

    playSfx: (sound, options) => {
        audioManager.playSfx(sound, options);
    },

    playAmbient: (track, options) => {
        audioManager.playAmbient(track, options);
    },

    stopMusic: (options) => {
        audioManager.stopMusic(options); 
    },

    setVolume: (channel, volume) => {
        audioManager.setVolume(channel, volume);
    }
};


// --- Simulación de API de IA (Idéntica) ---
async function callImageAPI(prompt) {
    console.log(`Llamando a la API de IA para: ${prompt}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `https://picsum.photos/seed/${encodeURI(prompt)}/1024/768`;
}


// --- Lógica Principal (main.js) ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Elementos de la Interfaz ---
    const speakerNameEl = document.getElementById('speaker-name');
    const dialogueTextEl = document.getElementById('dialogue-text');
    const continueBtn = document.getElementById('continue-btn');
    const choiceButtonsEl = document.getElementById('choice-buttons');
    const scriptInputEl = document.getElementById('script-input');
    const loadScriptBtn = document.getElementById('load-script-btn');
    const gameScreenEl = document.getElementById('game-screen');
    
    // --- Instancia del Motor ---
    const engine = new GameEngine();
    let gameIsRunning = false;

    // --- Función de Reset ---
    function resetGameUI() {
        console.log("Reiniciando UI del juego...");
        
        // Detiene la música (y ambiente)
        audioManager.stopMusic({ fade: 0.5 }); // Fade out rápido
        if (audioManager.channels.ambient) {
            audioManager.channels.ambient.stop();
            audioManager.channels.ambient = null;
        }

        // Limpia el estado visual
        speakerNameEl.textContent = "";
        dialogueTextEl.textContent = "";
        choiceButtonsEl.innerHTML = "";
        uiInterface.characterLayerEl.innerHTML = ""; // Limpia personajes
        gameScreenEl.style.backgroundImage = 'none'; // Limpia fondo
        
        continueBtn.style.display = 'block';
        continueBtn.disabled = false;
        choiceButtonsEl.innerHTML = "";
    }


    // --- Funciones de UI ---
    function updateUI(result) {
        if (!result) return;
        
        if (!gameIsRunning && result.type !== 'error') return;

        switch (result.type) {
            case 'dialogue':
                clearDialogue(); 
                speakerNameEl.textContent = result.hablante;
                dialogueTextEl.textContent = result.texto;
                break;
                
            case 'waiting_choice':
                clearDialogue(); 
                speakerNameEl.textContent = "Elige una opción:";
                continueBtn.style.display = 'none'; 

                result.options.forEach((optionText, index) => {
                    const button = document.createElement('button');
                    button.textContent = optionText;
                    button.classList.add('choice-btn');
                    button.addEventListener('click', () => {
                        if (!gameIsRunning) return;
                        const choiceResult = engine.makeChoice(index);
                        updateUI(choiceResult);
                    });
                    choiceButtonsEl.appendChild(button);
                });
                break;

            case 'loading':
                clearDialogue();
                speakerNameEl.textContent = "Generando Escenario...";
                dialogueTextEl.textContent = result.message;
                continueBtn.disabled = true;
                break;

            case 'fin':
                clearDialogue();
                speakerNameEl.textContent = "Sistema";
                dialogueTextEl.textContent = result.message;
                continueBtn.disabled = true;
                gameIsRunning = false;
                break;
                
            case 'error':
                clearDialogue();
                speakerNameEl.textContent = "Error";
                dialogueTextEl.textContent = result.message;
                continueBtn.disabled = true;
                gameIsRunning = false;
                break;
        }
    }
    
    function clearDialogue() {
        speakerNameEl.textContent = "";
        dialogueTextEl.textContent = "";
        choiceButtonsEl.innerHTML = "";
        continueBtn.style.display = 'block';
        continueBtn.disabled = false;
    }

    async function advanceGame() {
        if (!gameIsRunning) return;
        try {
            const result = engine.advance();
            if (result.type === 'load_background') {
                updateUI({ type: 'loading', message: `Creando: "${result.prompt}"` });
                const imageUrl = await callImageAPI(result.prompt);
                uiInterface.setBackground(imageUrl);
                const nextResult = engine.finishSceneLoad(result.sceneId);
                updateUI(nextResult);
            } else {
                updateUI(result);
            }
        } catch (error) {
            updateUI({ type: 'error', message: `Error en tiempo de ejecución: ${error.message}` });
        }
    }

    // --- Lógica de "Compilar y Ejecutar" ---
    loadScriptBtn.addEventListener('click', () => {
        if (Howler.ctx && Howler.ctx.state !== 'running') {
            Howler.ctx.resume().then(() => {
                console.log('AudioContext desbloqueado exitosamente.');
            }).catch(e => {
                console.error('Error al reanudar el AudioContext:', e);
            });
        }
        resetGameUI();

        const scriptText = scriptInputEl.value;
        if (!scriptText.trim()) {
            updateUI({ type: 'error', message: 'No hay script para cargar.' });
            return;
        }

        try {
            engine.setUiInterface(uiInterface); // Conecta el motor con la UI
            const loadResult = engine.loadGame(scriptText);

            if (loadResult.type === 'error') {
                updateUI(loadResult);
                return;
            }

            gameIsRunning = true;
            
            continueBtn.removeEventListener('click', advanceGame);
            continueBtn.addEventListener('click', advanceGame);
            
            advanceGame();

        } catch (error) {
            updateUI({ type: 'error', message: `Error al cargar/analizar: ${error.message}` });
        }
    });


    // --- Gestor de Assets (Sin cambios) ---
    
    const assetUrlInput = document.getElementById('asset-url-input');
    const assetUrlBtn = document.getElementById('asset-url-btn');
    const assetFileInput = document.getElementById('asset-file-input');
    const assetOutputContainer = document.getElementById('asset-output-container');
    const assetOutputText = document.getElementById('asset-output-text');

    function showAndCopyAsset(url) {
        const textToCopy = `"${url}"`;
        assetOutputText.textContent = textToCopy;
        assetOutputContainer.style.display = 'block';
        
        navigator.clipboard.writeText(url).then(() => {
            console.log('URL de asset copiada al portapapeles');
        }).catch(err => {
            console.error('No se pudo copiar: ', err);
        });
    }

    assetUrlBtn.addEventListener('click', () => {
        const url = assetUrlInput.value.trim();
        if (url) {
            showAndCopyAsset(url);
        }
    });

    assetFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const blobUrl = URL.createObjectURL(file);  
            showAndCopyAsset(blobUrl);
            assetFileInput.value = null;
        }
    });

});