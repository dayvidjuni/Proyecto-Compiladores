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
    // Initialize Tools Panel: wire existing file-tree items as tab buttons
    try {
        setupToolsPanel();
    } catch (e) {
        console.warn('Tools panel init skipped', e);
    }
});

// Switch the tools tab: shows the selected view and marks active button
function switchToolTab(tabId) {
    // Mark the appropriate file-item as active (the previous buttons)
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(fi => {
        const text = (fi.textContent || '').trim().toLowerCase();
        const target = text.includes('assets') ? 'tab-assets' : (text.includes('audio') ? 'tab-audio' : null);
        fi.classList.toggle('active', target === tabId);
    });

    // Show/hide tool views
    const views = document.querySelectorAll('.tool-view');
    views.forEach(v => {
        if (v.id === tabId) {
            v.style.display = 'block';
            requestAnimationFrame(() => { v.style.opacity = '1'; });
        } else {
            v.style.opacity = '0';
            v.style.display = 'none';
        }
    });
}

function setupToolsPanel() {
    // Use existing file-tree items as triggers for the tools views
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(fi => {
        fi.addEventListener('click', () => {
            const text = (fi.textContent || '').trim().toLowerCase();
            if (text.includes('assets')) switchToolTab('tab-assets');
            else if (text.includes('audio')) switchToolTab('tab-audio');
            else if (text.includes('script')) switchToolTab('tab-scripts');
            // keep other file-item behaviors (hover) intact
        });
    });

    // Initialize sliders to call uiInterface.setVolume
    const sliderMap = [
        { id: 'slider-music', channel: 'music' },
        { id: 'slider-ambient', channel: 'ambient' },
        { id: 'slider-sfx', channel: 'sfx' }
    ];
    sliderMap.forEach(item => {
        const el = document.getElementById(item.id);
        if (!el) return;
        el.addEventListener('input', (ev) => {
            const raw = Number(ev.target.value || 0);
            const norm = Math.min(Math.max(raw / 100, 0), 1);
            if (window.uiInterface && typeof uiInterface.setVolume === 'function') {
                uiInterface.setVolume(item.channel, norm);
            }
        });
    });

    // Default active state: mark assets file-item active and show assets view
    switchToolTab('tab-assets');
}

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
    const highlight = document.getElementById('syntax-highlight');
    const lineNumbers = document.getElementById('line-numbers');
    
    if (!scriptInput || !lineNumbers) return;

    // 1. Función para actualizar visualización y líneas
    function updateEditor() {
        const text = scriptInput.value;
        
        // A) Actualizar Números de Línea
        const lines = text.split('\n').length;
        let lineNumbersHTML = '';
        for (let i = 1; i <= lines; i++) {
            lineNumbersHTML += i + '\n';
        }
        lineNumbers.innerText = lineNumbersHTML;

        // B) Actualizar Highlighter (Escape básico HTML para evitar inyecciones)
        let safeText = text.replace(/&/g, "&amp;")
                           .replace(/</g, "&lt;")
                           .replace(/>/g, "&gt;");
        
        if(highlight) {
            highlight.innerText = safeText;
        }
    }
    
    // 2. Función de Sincronización de Scroll
    function syncScroll() {
        const scrollTop = scriptInput.scrollTop;
        const scrollLeft = scriptInput.scrollLeft;
        
        // Sincronizamos números y el highlighter con el textarea
        lineNumbers.scrollTop = scrollTop;
        if(highlight) {
            highlight.scrollTop = scrollTop;
            highlight.scrollLeft = scrollLeft;
        }
    }
    
    // 3. Event Listeners
    scriptInput.addEventListener('input', updateEditor);
    scriptInput.addEventListener('scroll', syncScroll);
    
    // Inicializar al cargar
    updateEditor();
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
            // BORRA ESTA LÍNEA: const solutionStyle = 'mix-blend-mode: multiply;'; 
            
            let imgId = `char-${position}`;
            let imgEl = document.getElementById(imgId);
            if (!imgEl) {
                imgEl = document.createElement('img');
                imgEl.id = imgId;
                
                // Actualiza los estilos para quitar ${solutionStyle}
                imgEl.style.cssText = ` 
                    position: absolute;
                    bottom: 0;
                    height: 90%;
                    max-width: 40%;
                    transition: all 0.5s ease-out;
                    /* mix-blend-mode: multiply;  <-- ELIMINADO */
                    filter: drop-shadow(0 0 10px rgba(0,0,0,0.5)); /* Opcional: Añade una sombra bonita alrededor */
                `;
                uiInterface.characterLayerEl.appendChild(imgEl);
            }
        
        // ... resto del código de posición ...
        
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

// --- GENERADOR DE IMÁGENES CON POLLINATIONS.AI ---
async function callImageAPI(prompt) {
    console.log(`Generando imagen con Pollinations.ai para: ${prompt}`);
    
    // Codificar el prompt para URL
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Generar seed aleatorio para variabilidad
    const seed = Math.floor(Math.random() * 1000000);
    
    // Construir URL de Pollinations.ai
    // - model: "flux" para alta calidad, "turbo" para velocidad
    // - width/height: paisaje 1280x720
    // - seed: número aleatorio para diferentes resultados
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&model=flux&seed=${seed}`;
    
    console.log(`URL generada: ${imageUrl}`);
    return imageUrl;
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
                // Mostrar nombre del personaje con estilos (ya definidos en CSS)
                speakerNameEl.textContent = result.hablante;
                speakerNameEl.style.display = 'block';
                // Mostrar texto del diálogo con estilos
                dialogueTextEl.textContent = result.texto;
                dialogueTextEl.style.display = 'block';
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

    // --- HANDLER DE ASSETS / BIBLIOTECAS ---
    const assetUrlInput = document.getElementById('asset-url-input');
    const assetUrlBtn = document.getElementById('asset-url-btn');
    const assetFileInput = document.getElementById('asset-file-input');
    const assetOutputContainer = document.getElementById('asset-output-container');
    const assetOutputText = document.getElementById('asset-output-text');

    // Libraries stored in localStorage for persistence
    const STORAGE_KEYS = { ASSETS: 'vn_assets', AUDIO: 'vn_audio', SCRIPTS: 'vn_scripts' };
    let assetsLib = [];
    let audioLib = [];
    let scriptsLib = [];

    function loadLibraries() {
        try { assetsLib = JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSETS) || '[]'); } catch(e){ assetsLib = []; }
        try { audioLib = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIO) || '[]'); } catch(e){ audioLib = []; }
        try { scriptsLib = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCRIPTS) || '[]'); } catch(e){ scriptsLib = []; }
    }
    function saveLibraries() {
        localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assetsLib));
        localStorage.setItem(STORAGE_KEYS.AUDIO, JSON.stringify(audioLib));
        localStorage.setItem(STORAGE_KEYS.SCRIPTS, JSON.stringify(scriptsLib));
    }

    function renderAssetsLibrary() {
        const container = document.getElementById('assets-library');
        if (!container) return;
        container.innerHTML = '';
        assetsLib.forEach((it, idx) => {
            const row = document.createElement('div');
            row.style.display = 'flex'; row.style.gap = '8px'; row.style.alignItems = 'center';
            row.style.padding = '6px'; row.style.background = '#0d0d0d'; row.style.border = '1px solid #222'; row.style.borderRadius = '4px';

            const thumb = document.createElement('img');
            thumb.src = it.url; thumb.style.width = '64px'; thumb.style.height = '40px'; thumb.style.objectFit = 'cover'; thumb.style.borderRadius = '3px';
            const name = document.createElement('div'); name.textContent = it.name || (`asset-${idx}`); name.style.flex = '1'; name.style.fontSize = '12px'; name.style.color = 'var(--text-secondary)';

            const btnCopy = document.createElement('button'); btnCopy.className = 'asset-btn'; btnCopy.style.padding='4px 8px'; btnCopy.textContent = 'Copiar';
            btnCopy.addEventListener('click', ()=>{ navigator.clipboard.writeText(it.url).catch(()=>{}); assetOutputContainer.style.display='block'; assetOutputText.textContent = `"${it.url}"`; });

            const btnInsert = document.createElement('button'); btnInsert.className='asset-btn'; btnInsert.style.padding='4px 8px'; btnInsert.textContent='Insertar';
            btnInsert.addEventListener('click', ()=>{ const ta = document.getElementById('script-input'); if (ta) { const val = `"${it.url}"`; const start = ta.selectionStart||0; const end = ta.selectionEnd||0; ta.setRangeText(val, start, end, 'end'); ta.focus(); } });

            const btnDel = document.createElement('button'); btnDel.className='asset-btn'; btnDel.style.padding='4px 8px'; btnDel.textContent='Eliminar';
            btnDel.addEventListener('click', ()=>{ assetsLib.splice(idx,1); saveLibraries(); renderAssetsLibrary(); });

            row.appendChild(thumb); row.appendChild(name); row.appendChild(btnCopy); row.appendChild(btnInsert); row.appendChild(btnDel);
            container.appendChild(row);
        });
    }

    function renderAudioLibrary() {
        const container = document.getElementById('audio-library');
        if (!container) return;
        container.innerHTML = '';
        audioLib.forEach((it, idx) => {
            const row = document.createElement('div');
            row.style.display = 'flex'; row.style.gap = '8px'; row.style.alignItems = 'center'; row.style.padding='6px';

            const name = document.createElement('div'); name.textContent = it.name || (`audio-${idx}`); name.style.flex='1'; name.style.fontSize='12px'; name.style.color='var(--text-secondary)';
            const btnPlay = document.createElement('button'); btnPlay.className='asset-btn'; btnPlay.textContent='▶'; btnPlay.style.padding='4px 8px';
            btnPlay.addEventListener('click', ()=>{ audioManager.playSfx(it.url, { volume: 1.0 }); });
            const btnCopy = document.createElement('button'); btnCopy.className='asset-btn'; btnCopy.textContent='Copiar'; btnCopy.style.padding='4px 8px';
            btnCopy.addEventListener('click', ()=>{ navigator.clipboard.writeText(it.url).catch(()=>{}); assetOutputContainer.style.display='block'; assetOutputText.textContent = `"${it.url}"`; });
            const btnDel = document.createElement('button'); btnDel.className='asset-btn'; btnDel.textContent='Eliminar'; btnDel.style.padding='4px 8px';
            btnDel.addEventListener('click', ()=>{ audioLib.splice(idx,1); saveLibraries(); renderAudioLibrary(); });

            row.appendChild(name); row.appendChild(btnPlay); row.appendChild(btnCopy); row.appendChild(btnDel);
            container.appendChild(row);
        });
    }

    function renderScriptsLibrary() {
        const container = document.getElementById('scripts-library');
        if (!container) return;
        container.innerHTML = '';
        scriptsLib.forEach((it, idx) => {
            const row = document.createElement('div');
            row.style.display='flex'; row.style.gap='8px'; row.style.alignItems='center'; row.style.padding='6px';
            const name = document.createElement('div'); name.textContent = it.name || (`script-${idx}`); name.style.flex='1'; name.style.fontSize='12px'; name.style.color='var(--text-secondary)';
            const btnLoad = document.createElement('button'); btnLoad.className='asset-btn'; btnLoad.textContent='Cargar'; btnLoad.style.padding='4px 8px';
            btnLoad.addEventListener('click', ()=>{ const ta = document.getElementById('script-input'); if (ta) { ta.value = it.content; ta.dispatchEvent(new Event('input')); switchToolTab('tab-assets'); } });
            const btnExport = document.createElement('button'); btnExport.className='asset-btn'; btnExport.textContent='Export'; btnExport.style.padding='4px 8px';
            btnExport.addEventListener('click', ()=>{ const blob = new Blob([it.content], {type:'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = it.name || 'script.game'; a.click(); URL.revokeObjectURL(url); });
            const btnDel = document.createElement('button'); btnDel.className='asset-btn'; btnDel.textContent='Eliminar'; btnDel.style.padding='4px 8px'; btnDel.addEventListener('click', ()=>{ scriptsLib.splice(idx,1); saveLibraries(); renderScriptsLibrary(); });

            row.appendChild(name); row.appendChild(btnLoad); row.appendChild(btnExport); row.appendChild(btnDel);
            container.appendChild(row);
        });
    }

    function addAssetObject(name, url, type) {
        if (type === 'audio') { audioLib.unshift({ name, url }); }
        else { assetsLib.unshift({ name, url }); }
        saveLibraries(); renderAssetsLibrary(); renderAudioLibrary();
    }

    function showAndCopyAsset(url) {
        const textToCopy = `"${url}"`;
        assetOutputText.textContent = textToCopy;
        assetOutputContainer.style.display = 'block';
        navigator.clipboard.writeText(url).catch(err => console.error(err));
        // try to guess type from extension
        const ext = url.split('.').pop().toLowerCase().split(/[?#]/)[0] || '';
        const audioExt = ['mp3','ogg','wav','m4a','aac'];
        const imageExt = ['png','jpg','jpeg','gif','webp','svg'];
        if (audioExt.includes(ext)) addAssetObject(url.split('/').pop(), url, 'audio');
        else addAssetObject(url.split('/').pop(), url, 'image');
    }

    // --- GESTOR DE ASSETS MEJORADO CON LISTA VISUAL ---
    // Crear contenedor de lista de URLs recientes (para el gestor de assets)
    const assetUrlListContainer = document.createElement('div');
    assetUrlListContainer.className = 'asset-list';
    assetUrlListContainer.id = 'asset-url-list';
    assetUrlListContainer.style.marginTop = '12px';
    
    // Insertar después del #asset-output-container en el DOM
    const insertAfter = assetOutputContainer;
    if (insertAfter && insertAfter.parentNode) {
        insertAfter.parentNode.insertBefore(assetUrlListContainer, insertAfter.nextSibling);
    }

    // URLs agregadas recientemente (para visualización rápida)
    let recentAssetUrls = [];
    const MAX_RECENT_URLS = 5;

    function addToRecentUrls(url, name) {
        // Remover duplicados
        recentAssetUrls = recentAssetUrls.filter(item => item.url !== url);
        // Agregar al inicio
        recentAssetUrls.unshift({ url, name: name || url.split('/').pop() || 'Asset' });
        // Limitar cantidad
        if (recentAssetUrls.length > MAX_RECENT_URLS) {
            recentAssetUrls = recentAssetUrls.slice(0, MAX_RECENT_URLS);
        }
        renderRecentAssetUrls();
    }

    function renderRecentAssetUrls() {
        const container = document.getElementById('asset-url-list');
        if (!container) return;
        container.innerHTML = '';
        
        recentAssetUrls.forEach((item, idx) => {
            const listItem = document.createElement('div');
            listItem.className = 'asset-list-item';
            
            const urlDisplay = document.createElement('div');
            urlDisplay.className = 'asset-url-truncated';
            urlDisplay.title = item.url; // tooltip con URL completa
            urlDisplay.textContent = item.name;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'asset-delete-btn';
            deleteBtn.textContent = '✕';
            deleteBtn.title = 'Eliminar';
            deleteBtn.addEventListener('click', () => {
                recentAssetUrls.splice(idx, 1);
                renderRecentAssetUrls();
            });
            
            listItem.appendChild(urlDisplay);
            listItem.appendChild(deleteBtn);
            container.appendChild(listItem);
        });
    }

    if (assetUrlBtn) {
        assetUrlBtn.addEventListener('click', () => {
            const url = assetUrlInput.value.trim();
            if (url) {
                showAndCopyAsset(url);
                addToRecentUrls(url, url.split('/').pop() || 'URL Asset');
                assetUrlInput.value = '';
                renderAssetsLibrary();
                renderAudioLibrary();
            }
        });
    }

    if (assetFileInput) {
        assetFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const blobUrl = URL.createObjectURL(file);
                addToRecentUrls(blobUrl, file.name);
                // classify by mime
                if (file.type && file.type.startsWith('audio/')) addAssetObject(file.name, blobUrl, 'audio');

                else addAssetObject(file.name, blobUrl, 'image');
                // also expose to user
                assetOutputContainer.style.display = 'block'; assetOutputText.textContent = `"${blobUrl}"`;
                assetFileInput.value = null;
            }
        });
    }

    // Scripts library controls
    const btnSaveScript = document.getElementById('btn-save-script');
    const btnImportScript = document.getElementById('btn-import-script');
    if (btnSaveScript) {
        btnSaveScript.addEventListener('click', ()=>{
            const ta = document.getElementById('script-input');
            if (!ta) return;
            const name = prompt('Nombre para el script (ej: aventura1.game):', `script-${Date.now()}.game`);
            if (!name) return;
            scriptsLib.unshift({ name, content: ta.value });
            saveLibraries(); renderScriptsLibrary();
        });
    }
    if (btnImportScript) {
        btnImportScript.addEventListener('click', ()=>{
            const input = document.createElement('input'); input.type='file'; input.accept='.game,text/*';
            input.addEventListener('change', (ev)=>{
                const f = ev.target.files[0]; if (!f) return; const reader = new FileReader();
                reader.onload = () => { const txt = reader.result; scriptsLib.unshift({ name: f.name || `import-${Date.now()}.game`, content: txt }); saveLibraries(); renderScriptsLibrary(); };
                reader.readAsText(f);
            });
            input.click();
        });
    }

    // Initialize libraries UI
    loadLibraries(); renderAssetsLibrary(); renderAudioLibrary(); renderScriptsLibrary();

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