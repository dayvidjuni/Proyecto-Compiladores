/*
================================================================================
 main.js - VISUAL NOVEL STUDIO IDE
 - Navegación, Editor, Audio, Juego (Engine), Time Machine y Robot IA
================================================================================
*/

// --- SISTEMA DE NAVEGACIÓN ENTRE VISTAS ---
document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewName = button.getAttribute('data-view');
            switchView(viewName);
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
    
    initializeCodeEditor();
});

function switchView(viewName) {
    const allViews = document.querySelectorAll('.view');
    allViews.forEach(view => view.classList.remove('view-active'));
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
    
    scriptInput.addEventListener('input', updateLineNumbers);
    scriptInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = scriptInput.scrollTop;
    });
    updateLineNumbers();
}

// --- GESTOR DE AUDIO ---
const audioManager = {
    channels: { music: null, ambient: null, sfx: [] },
    
    playMusic: (track, options = {}) => {
        const newTrack = new Howl({ src: [track], loop: true, volume: 0, format: ['mp3'] });
        const oldTrack = audioManager.channels.music;
        const fadeTime = (options.fade || 1.0) * 1000; 
        
        newTrack.play();
        newTrack.fade(0, (options.volume || 0.5), fadeTime);
        if (oldTrack) {
            oldTrack.fade((oldTrack.volume() || 0.5), 0, fadeTime, () => oldTrack.stop());
        }
        audioManager.channels.music = newTrack;
    },
    
    playSfx: (sound, options = {}) => {
        const sfx = new Howl({ src: [sound], volume: options.volume || 0.8, format: ['mp3'] });
        sfx.play();
        audioManager.channels.sfx.push(sfx);
    },

    playAmbient: (track, options = {}) => {
        const newTrack = new Howl({ src: [track], loop: true, volume: 0, format: ['mp3'] });
        const oldTrack = audioManager.channels.ambient;
        const fadeTime = (options.fade || 1.0) * 1000;
        
        newTrack.play();
        newTrack.fade(0, (options.volume || 0.4), fadeTime);
        if (oldTrack) {
            oldTrack.fade((oldTrack.volume() || 0.4), 0, fadeTime, () => oldTrack.stop());
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

    setVolume: (channel, volume) => {
        const track = audioManager.channels[channel];
        if (track) track.volume(volume);
    }
};

// --- INTERFAZ UI (Puente Engine -> DOM) ---
const uiInterface = {
    characterLayerEl: document.getElementById('character-layer'),

    showCharacter: (spriteUrl, position) => {
        const solutionStyle = 'mix-blend-mode: multiply;';
        let imgId = `char-${position}`;
        let imgEl = document.getElementById(imgId);
        if (!imgEl) {
            imgEl = document.createElement('img');
            imgEl.id = imgId;
            imgEl.style.cssText = ` 
                position: absolute; bottom: 0; height: 90%; max-width: 40%;
                transition: all 0.5s ease-out; ${solutionStyle}
            `;
            uiInterface.characterLayerEl.appendChild(imgEl);
        }
        
        if (position === 'left') { imgEl.style.transform = 'translateX(0%)'; imgEl.style.left = '5%'; }
        else if (position === 'center') { imgEl.style.transform = 'translateX(-50%)'; imgEl.style.left = '50%'; }
        else if (position === 'right') { imgEl.style.transform = 'translateX(-100%)'; imgEl.style.left = '95%'; }
        imgEl.src = spriteUrl;
    },

    setBackground: (imageUrl) => {
        const gameScreenEl = document.getElementById('game-screen');
        if (imageUrl) gameScreenEl.style.backgroundImage = `url(${imageUrl})`;
        else gameScreenEl.style.backgroundImage = 'none';
    },

    playMusic: (track, options) => audioManager.playMusic(track, options),
    playSfx: (sound, options) => audioManager.playSfx(sound, options),
    playAmbient: (track, options) => audioManager.playAmbient(track, options),
    stopMusic: (options) => audioManager.stopMusic(options),
    setVolume: (channel, volume) => audioManager.setVolume(channel, volume)
};

// --- MOCK DE IA ---
async function callImageAPI(prompt) {
    console.log(`Llamando a la API de IA para: ${prompt}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `https://picsum.photos/seed/${encodeURI(prompt)}/1024/768`;
}


// --- LÓGICA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {

    // Elementos DOM
    const speakerNameEl = document.getElementById('speaker-name');
    const dialogueTextEl = document.getElementById('dialogue-text');
    const continueBtn = document.getElementById('continue-btn');
    const choiceButtonsEl = document.getElementById('choice-buttons');
    const scriptInputEl = document.getElementById('script-input');
    const loadScriptBtn = document.getElementById('load-script-btn');
    const gameScreenEl = document.getElementById('game-screen');
    
    // Botones Time Machine
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    
    // Botón Robot IA
    const btnRunAnalysis = document.getElementById('btn-run-analysis');
    
    const engine = new GameEngine();
    let gameIsRunning = false;

    function resetGameUI() {
        audioManager.stopMusic({ fade: 0.5 });
        if (audioManager.channels.ambient) {
            audioManager.channels.ambient.stop();
            audioManager.channels.ambient = null;
        }
        speakerNameEl.textContent = "";
        dialogueTextEl.textContent = "";
        choiceButtonsEl.innerHTML = "";
        uiInterface.characterLayerEl.innerHTML = ""; 
        gameScreenEl.style.backgroundImage = 'none'; 
        continueBtn.style.display = 'block';
        continueBtn.disabled = false;
        choiceButtonsEl.innerHTML = "";
    }

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
            case 'error':
                clearDialogue();
                speakerNameEl.textContent = result.type === 'fin' ? "Sistema" : "Error";
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

    // --- HANDLERS DE TIME MACHINE ---
    if (btnUndo) {
        btnUndo.addEventListener('click', () => {
            if (!gameIsRunning) return;
            const result = engine.undo();
            if (result) updateUI(result);
        });
    }
    if (btnRedo) {
        btnRedo.addEventListener('click', () => {
            if (!gameIsRunning) return;
            const result = engine.redo();
            if (result) updateUI(result);
        });
    }

    // --- HANDLER DE EJECUCIÓN DEL JUEGO ---
    loadScriptBtn.addEventListener('click', () => {
        if (Howler.ctx && Howler.ctx.state !== 'running') Howler.ctx.resume();
        resetGameUI();

        const scriptText = scriptInputEl.value;
        if (!scriptText.trim()) {
            updateUI({ type: 'error', message: 'No hay script para cargar.' });
            return;
        }

        try {
            engine.setUiInterface(uiInterface); 
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

    // --- HANDLER DE ASSETS ---
    const assetUrlInput = document.getElementById('asset-url-input');
    const assetUrlBtn = document.getElementById('asset-url-btn');
    const assetFileInput = document.getElementById('asset-file-input');
    const assetOutputContainer = document.getElementById('asset-output-container');
    const assetOutputText = document.getElementById('asset-output-text');

    function showAndCopyAsset(url) {
        const textToCopy = `"${url}"`;
        assetOutputText.textContent = textToCopy;
        assetOutputContainer.style.display = 'block';
        navigator.clipboard.writeText(url).catch(err => console.error(err));
    }

    if (assetUrlBtn) {
        assetUrlBtn.addEventListener('click', () => {
            const url = assetUrlInput.value.trim();
            if (url) showAndCopyAsset(url);
        });
    }
    if (assetFileInput) {
        assetFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const blobUrl = URL.createObjectURL(file);  
                showAndCopyAsset(blobUrl);
                assetFileInput.value = null;
            }
        });
    }

    // ========================================================
    // --- MÓDULO DE ROBOT IA Y ANÁLISIS ---
    // ========================================================
    
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
    }

    if (btnRunAnalysis) {
        btnRunAnalysis.addEventListener('click', async () => {
            console.log("Iniciando Robot Analizador...");
            const scriptText = scriptInputEl.value;
            try {
                // 1. Compilación Silenciosa
                const lexer = new Lexer(scriptText);
                const parser = new Parser(lexer);
                const ast = parser.parse(); 
                
                // 2. Invocar al Robot (StoryAnalyzer)
                const analyzer = new StoryAnalyzer(ast); 
                const result = analyzer.generateMermaid();

                // 3. Renderizar Mermaid
                const graphContainer = document.getElementById('mermaid-chart');
                graphContainer.removeAttribute('data-processed');
                graphContainer.innerHTML = result.code; 
                
                await mermaid.run({ nodes: [graphContainer] });

                // 4. Actualizar Panel
                updateAnalysisUI(result.stats);

            } catch (error) {
                console.error(error);
                alert("Error de análisis: " + error.message);
            }
        });
    }

    function updateAnalysisUI(stats) {
        animateValue("stat-words", stats.totalWords);
        animateValue("stat-scenes", stats.totalScenes);
        animateValue("stat-choices", stats.totalChoices);
        animateValue("stat-endings", stats.endingsReached);

        const errorList = document.getElementById('list-errors');
        errorList.innerHTML = "";
        if (stats.brokenLinks.length > 0) {
            stats.brokenLinks.forEach(err => {
                const li = document.createElement('li');
                li.innerHTML = `⚠️ <b>${err.source}</b> intenta ir a <span style="color:white">${err.target}</span> (No existe)`;
                li.style.padding = "5px 0"; li.style.borderBottom = "1px solid #330000";
                errorList.appendChild(li);
            });
        } else {
            errorList.innerHTML = '<li style="color: #00ff41;">✓ Integridad estructural verificada.</li>';
        }

        const maxComplexity = 100; 
        const complexityPercent = Math.min((stats.complexityScore / maxComplexity) * 100, 100);
        document.getElementById('complexity-bar').style.width = `${complexityPercent}%`;
        
        let complexityLabel = "Baja";
        if (complexityPercent > 30) complexityLabel = "Media";
        if (complexityPercent > 70) complexityLabel = "Alta";
        if (complexityPercent > 90) complexityLabel = "Nivel Dios";
        
        document.getElementById('complexity-text').textContent = `Nivel: ${complexityLabel} (${stats.complexityScore} pts)`;
    }

    function animateValue(id, end) {
        const obj = document.getElementById(id);
        let start = 0;
        if (end === 0) { obj.textContent = 0; return; }
        let duration = 1000;
        let startTime = null;
        function animation(currentTime) {
            if (!startTime) startTime = currentTime;
            let progress = currentTime - startTime;
            let value = Math.min(Math.floor((progress / duration) * end), end);
            obj.textContent = value;
            if (progress < duration) window.requestAnimationFrame(animation);
        }
        window.requestAnimationFrame(animation);
    }

});