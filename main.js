document.addEventListener('DOMContentLoaded', () => {

    // --- Elementos de la Interfaz ---
    const speakerNameEl = document.getElementById('speaker-name');
    const dialogueTextEl = document.getElementById('dialogue-text');
    const continueBtn = document.getElementById('continue-btn');
    const choiceButtonsEl = document.getElementById('choice-buttons');
    const scriptInputEl = document.getElementById('script-input');
    const loadScriptBtn = document.getElementById('load-script-btn');
    const editorContainerEl = document.getElementById('editor-container');
    const gameScreenEl = document.getElementById('game-screen');

    // --- Instancia del Motor ---
    const engine = new GameEngine();
    let gameIsRunning = false;

    // --- Funciones de UI ---
    function clearDialogue() {
        speakerNameEl.textContent = "";
        dialogueTextEl.textContent = "";
        choiceButtonsEl.innerHTML = "";
        continueBtn.style.display = 'block';
        continueBtn.disabled = false; // Habilita el botón por defecto
    }

    function updateUI(result) {
        clearDialogue(); // Limpia antes de mostrar nuevo contenido

        if (!gameIsRunning && result.type !== 'error') return; // No actualices si el juego no corre o hay error

        switch (result.type) {
            case 'dialogue':
                speakerNameEl.textContent = result.hablante;
                dialogueTextEl.textContent = result.texto;
                break;
            case 'waiting_choice':
                speakerNameEl.textContent = "Elige una opción:";
                continueBtn.style.display = 'none';

                result.options.forEach((optionText, index) => {
                    const button = document.createElement('button');
                    button.textContent = optionText;
                    button.classList.add('choice-btn');
                    button.addEventListener('click', () => {
                        if (!gameIsRunning) return; // Evita doble clic si el juego terminó
                        const choiceResult = engine.makeChoice(index);
                        updateUI(choiceResult);
                    });
                    choiceButtonsEl.appendChild(button);
                });
                break;
            case 'fin':
                speakerNameEl.textContent = "Sistema";
                dialogueTextEl.textContent = result.message;
                continueBtn.disabled = true;
                gameIsRunning = false;
                break;
            case 'error':
                speakerNameEl.textContent = "Error";
                dialogueTextEl.textContent = result.message;
                continueBtn.disabled = true;
                gameIsRunning = false;
                // Muestra la pantalla del juego aunque haya error para ver el mensaje
                editorContainerEl.style.display = 'none';
                gameScreenEl.style.display = 'block';
                break;
            default:
                 // Si es una acción interna (show, set, goto), avanza automáticamente
                 if(gameIsRunning) {
                     advanceGame();
                 }
        }
    }

    function advanceGame() {
        if (!gameIsRunning) return;
        try {
            const result = engine.advance();
            updateUI(result);
        } catch (error) {
             updateUI({ type: 'error', message: `Error en tiempo de ejecución: ${error.message}` });
        }
    }

    // --- Iniciar el Juego al Cargar Script ---
    loadScriptBtn.addEventListener('click', () => {
        const scriptText = scriptInputEl.value;
        if (!scriptText.trim()) {
            alert("Por favor, pega el script de la novela visual en el área de texto.");
            return;
        }

        try {
            // Reinicia el motor por si se carga un nuevo script
            // const engine = new GameEngine(); // Podrías crear uno nuevo o resetear el estado
            
            const loadResult = engine.loadGame(scriptText); // Carga el script del textarea

            if (loadResult.type === 'error') {
                 updateUI(loadResult); // Muestra el error de carga/análisis
                 return; // Detiene si hay error
            }

            // Si la carga fue exitosa
            gameIsRunning = true;
            editorContainerEl.style.display = 'none'; // Oculta el editor
            gameScreenEl.style.display = 'block';   // Muestra la pantalla del juego
            continueBtn.addEventListener('click', advanceGame); // Asegura que el botón funcione
            
            advanceGame(); // Inicia la ejecución mostrando el primer evento

        } catch (error) {
            // Captura errores del parser o semantic analyzer
             updateUI({ type: 'error', message: `Error al cargar/analizar: ${error.message}` });
        }
    });

    // Opcional: Cargar un script de ejemplo al inicio
    // scriptInputEl.value = `game "Ejemplo Inicial" {\n    scene inicio {\n        dialogue narrador "Pega tu script y presiona Cargar."\n    }\n    main {\n        inicio;\n    }\n}`;

}); // Fin del DOMContentLoaded