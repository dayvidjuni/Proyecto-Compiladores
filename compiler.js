// --- 1. Token Types (as constants) ---
const TokenType = Object.freeze({
    GAME: 'GAME', CHARACTER: 'CHARACTER', FLAG: 'FLAG', SCENE: 'SCENE',
    BACKGROUND: 'BACKGROUND', SHOW: 'SHOW', AT: 'AT', DIALOGUE: 'DIALOGUE',
    CHOICE: 'CHOICE', SET: 'SET', K_TRUE: 'K_TRUE', K_FALSE: 'K_FALSE',
    K_LEFT: 'K_LEFT', K_RIGHT: 'K_RIGHT', K_CENTER: 'K_CENTER', SPRITE: 'SPRITE',
    MAIN: 'MAIN', IF: 'IF', ELSE: 'ELSE', LBRACE: 'LBRACE', RBRACE: 'RBRACE',
    LPAREN: 'LPAREN', RPAREN: 'RPAREN', COLON: 'COLON', ARROW: 'ARROW',
    EQUALS: 'EQUALS', SEMICOLON: 'SEMICOLON', IDENTIFIER: 'IDENTIFIER',
    STRING: 'STRING', GOTO: 'GOTO', END_OF_FILE: 'END_OF_FILE', UNKNOWN: 'UNKNOWN',
    PLAY_MUSIC: 'PLAY_MUSIC', PLAY_SFX: 'PLAY_SFX', STOP_MUSIC: 'STOP_MUSIC',
    FADE: 'FADE', VOLUME: 'VOLUME', AMBIENT: 'AMBIENT', SET_VOLUME: 'SET_VOLUME',
    COMMA: 'COMMA', NUMBER: 'NUMBER',
});

// --- 2. Lexer Class ---
class Lexer {
    constructor(source) {
        this.source = source;
        this.currentPos = 0;
        this.line = 1;
        this.keywords = new Map([
            ["game", TokenType.GAME], ["character", TokenType.CHARACTER],
            ["flag", TokenType.FLAG], ["scene", TokenType.SCENE],
            ["background", TokenType.BACKGROUND], ["show", TokenType.SHOW],
            ["at", TokenType.AT], ["dialogue", TokenType.DIALOGUE],
            ["choice", TokenType.CHOICE], ["set", TokenType.SET],
            ["true", TokenType.K_TRUE], ["false", TokenType.K_FALSE],
            ["left", TokenType.K_LEFT], ["right", TokenType.K_RIGHT],
            ["center", TokenType.K_CENTER], ["sprite", TokenType.SPRITE],
            ["main", TokenType.MAIN], ["if", TokenType.IF], ["else", TokenType.ELSE],
            ["goto", TokenType.GOTO],
            ["play_music", TokenType.PLAY_MUSIC],
            ["play_sfx", TokenType.PLAY_SFX],
            ["stop_music", TokenType.STOP_MUSIC],
            ["play_ambient", TokenType.AMBIENT],
            ["set_volume", TokenType.SET_VOLUME]
        ]);
    }

    isAtEnd() { return this.currentPos >= this.source.length; }
    peek() { return this.isAtEnd() ? '\0' : this.source[this.currentPos + 1]; }

    skipWhitespaceAndComments() {
        while (!this.isAtEnd()) {
            const c = this.source[this.currentPos];
            if (/\s/.test(c)) {
                if (c === '\n') this.line++;
                this.currentPos++;
            } else if (c === '#') {
                while (!this.isAtEnd() && this.source[this.currentPos] !== '\n') {
                    this.currentPos++;
                }
            } else {
                break;
            }
        }
    }

    nextToken() {
        this.skipWhitespaceAndComments();
        if (this.isAtEnd()) return { type: TokenType.END_OF_FILE, value: "", line: this.line };

        const c = this.source[this.currentPos];

        switch (c) {
            case '{': this.currentPos++; return { type: TokenType.LBRACE, value: "{", line: this.line };
            case '}': this.currentPos++; return { type: TokenType.RBRACE, value: "}", line: this.line };
            case '(': this.currentPos++; return { type: TokenType.LPAREN, value: "(", line: this.line };
            case ')': this.currentPos++; return { type: TokenType.RPAREN, value: ")", line: this.line };
            case ':': this.currentPos++; return { type: TokenType.COLON, value: ":", line: this.line };
            case ';': this.currentPos++; return { type: TokenType.SEMICOLON, value: ";", line: this.line };
            case '=': this.currentPos++; return { type: TokenType.EQUALS, value: "=", line: this.line };
            case ',': this.currentPos++; return { type: TokenType.COMMA, value: ",", line: this.line };
            case '"': return this.readString();
        }

        if (c === '-' && this.peek() === '>') {
            this.currentPos += 2;
            return { type: TokenType.ARROW, value: "->", line: this.line };
        }

        if (/[0-9]/.test(c)) {
            return this.readNumber();
        }
        if (/[a-zA-Z_]/.test(c)) {
            return this.readIdentifier();
        }

        this.currentPos++;
        return { type: TokenType.UNKNOWN, value: c, line: this.line };
    }

    readString() {
        let value = "";
        this.currentPos++; 
        while (!this.isAtEnd() && this.source[this.currentPos] !== '"') {
            value += this.source[this.currentPos++];
        }
        if (!this.isAtEnd()) this.currentPos++; 
        return { type: TokenType.STRING, value: value, line: this.line };
    }

    readIdentifier() {
        let value = "";
        while (!this.isAtEnd() && /[a-zA-Z0-9_]/.test(this.source[this.currentPos])) {
            value += this.source[this.currentPos++];
        }
        const type = this.keywords.get(value) || TokenType.IDENTIFIER;
        return { type: type, value: value, line: this.line };
    }

    readNumber() {
        let value = "";
        let hasDecimal = false;
        while (!this.isAtEnd()) {
            const c = this.source[this.currentPos];
            if (/[0-9]/.test(c)) {
                value += c;
            } else if (c === '.' && !hasDecimal) {
                hasDecimal = true;
                value += c;
            } else {
                break;
            }
            this.currentPos++;
        }
        return { type: TokenType.NUMBER, value: value, line: this.line };
    }
}

// --- 3. AST Node Classes ---
class ASTNode { constructor(type) { this.nodeType = type; } }

class PlayMusicNode extends ASTNode {
    constructor(track, options) {
        super('PlayMusicNode');
        this.track = track;
        this.options = options;
    }
}
class PlaySfxNode extends ASTNode {
    constructor(sound, options) {
        super('PlaySfxNode');
        this.sound = sound;
        this.options = options;
    }
}
class StopMusicNode extends ASTNode {
    constructor(options) {
        super('StopMusicNode');
        this.options = options;
    }
}
class PlayAmbientNode extends ASTNode {
    constructor(sound, options) {
        super('PlayAmbientNode');
        this.sound = sound;
        this.options = options;
    }
}
class SetVolumeNode extends ASTNode {
    constructor(target, volume) {
        super('SetVolumeNode');
        this.target = target;
        this.volume = volume;
    }
}
class BackgroundNode extends ASTNode {
    constructor(background, options) {
        super('BackgroundNode');
        this.background = background;
        this.options = options;
    }
}
class GameNode extends ASTNode {
    constructor(name, declarations, scenes, mainBlock) {
        super('GameNode');
        this.name = name;
        this.declarations = declarations;
        this.scenes = scenes;
        this.mainBlock = mainBlock;
    }
}
class CharacterDeclarationNode extends ASTNode {
    constructor(id, displayName, sprite) {
        super('CharacterDeclarationNode');
        this.id = id; this.displayName = displayName; this.sprite = sprite;
    }
}
class FlagDeclarationNode extends ASTNode {
    constructor(id, initialValue) {
        super('FlagDeclarationNode');
        this.id = id; this.initialValue = initialValue;
    }
}
class SceneNode extends ASTNode {
    constructor(id, background, events) {
        super('SceneNode');
        this.id = id; this.background = background; this.events = events;
    }
}
class MainNode extends ASTNode {
    constructor(statements) { super('MainNode'); this.statements = statements; }
}
class SceneCallNode extends ASTNode {
    constructor(sceneId) { super('SceneCallNode'); this.sceneId = sceneId; }
}
class IfStatementNode extends ASTNode {
     constructor(flagId, trueBranch, falseBranch) {
        super('IfStatementNode');
        this.flagId = flagId; this.trueBranch = trueBranch; this.falseBranch = falseBranch;
    }
}
class ShowCharacterNode extends ASTNode {
    constructor(characterId, position) {
        super('ShowCharacterNode');
        this.characterId = characterId; this.position = position;
    }
}
class DialogueNode extends ASTNode {
    constructor(characterId, text) {
        super('DialogueNode');
        this.characterId = characterId; this.text = text;
    }
}
class SetFlagNode extends ASTNode {
    constructor(flagId, value) {
        super('SetFlagNode');
        this.flagId = flagId; this.value = value;
    }
}
class GotoNode extends ASTNode {
    constructor(targetSceneId) { super('GotoNode'); this.targetSceneId = targetSceneId; }
}
class IfEventNode extends ASTNode {
     constructor(flagId, trueEvents, falseEvents) {
        super('IfEventNode');
        this.flagId = flagId; this.trueEvents = trueEvents; this.falseEvents = falseEvents;
    }
}
class ChoiceNode extends ASTNode {
    constructor(options) { super('ChoiceNode'); this.options = options; }
}

// --- 4. Parser Class ---
class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.currentToken = this.lexer.nextToken();
    }

    parseError(message) {
        throw new Error(`Parse Error (Line ${this.currentToken.line}): ${message}. Found '${this.currentToken.value}' (${this.currentToken.type})`);
    }

    consume(expectedType) {
        if (this.currentToken.type === expectedType) {
            this.currentToken = this.lexer.nextToken();
        } else {
            this.parseError(`Expected token type ${expectedType}`);
        }
    }

    parse() { return this.parseGame(); }

    parseGame() {
        this.consume(TokenType.GAME);
        const name = this.currentToken.value;
        this.consume(TokenType.STRING);
        this.consume(TokenType.LBRACE);
        const declarations = this.parseDeclarations();
        const scenes = this.parseScenes();
        let mainBlock = null;
        if (this.currentToken.type === TokenType.MAIN) {
            mainBlock = this.parseMain();
        }
        this.consume(TokenType.RBRACE);
        this.consume(TokenType.END_OF_FILE);
        return new GameNode(name, declarations, scenes, mainBlock);
    }

    parseDeclarations() {
        const declarations = [];
        while (this.currentToken.type === TokenType.CHARACTER || this.currentToken.type === TokenType.FLAG) {
            if (this.currentToken.type === TokenType.CHARACTER) {
                declarations.push(this.parseCharacterDeclaration());
            } else {
                declarations.push(this.parseFlagDeclaration());
            }
        }
        return declarations;
    }

    parseCharacterDeclaration() {
        this.consume(TokenType.CHARACTER);
        const id = this.currentToken.value;
        this.consume(TokenType.IDENTIFIER);
        const displayName = this.currentToken.value;
        this.consume(TokenType.STRING);
        this.consume(TokenType.LPAREN);
        this.consume(TokenType.SPRITE);
        this.consume(TokenType.COLON);
        const sprite = this.currentToken.value;
        this.consume(TokenType.STRING);
        this.consume(TokenType.RPAREN);
        return new CharacterDeclarationNode(id, displayName, sprite);
    }

    parseFlagDeclaration() {
        this.consume(TokenType.FLAG);
        const id = this.currentToken.value;
        this.consume(TokenType.IDENTIFIER);
        this.consume(TokenType.COLON);
        let initialValue = false;
        if (this.currentToken.type === TokenType.K_TRUE) {
            initialValue = true;
            this.consume(TokenType.K_TRUE);
        } else {
            this.consume(TokenType.K_FALSE);
        }
        return new FlagDeclarationNode(id, initialValue);
    }

    parseScenes() {
        const scenes = [];
        while (this.currentToken.type === TokenType.SCENE) {
            scenes.push(this.parseScene());
        }
        return scenes;
    }

    parseScene() {
        this.consume(TokenType.SCENE);
        const id = this.currentToken.value;
        this.consume(TokenType.IDENTIFIER);
        this.consume(TokenType.LBRACE);
        let background = null;
        if (this.currentToken.type === TokenType.BACKGROUND) {
            this.consume(TokenType.BACKGROUND);
            background = this.currentToken.value;
            this.consume(TokenType.STRING);
        }
        const events = this.parseEventList();
        this.consume(TokenType.RBRACE);
        return new SceneNode(id, background, events);
    }

    parseEventList() {
        const events = [];
        while ([
            TokenType.SHOW, TokenType.DIALOGUE, TokenType.CHOICE,
            TokenType.SET, TokenType.IF, TokenType.GOTO,
            TokenType.PLAY_MUSIC, TokenType.PLAY_SFX, TokenType.STOP_MUSIC,
            TokenType.AMBIENT, TokenType.SET_VOLUME, TokenType.BACKGROUND
        ].includes(this.currentToken.type)) {
            events.push(this.parseEvent());
        }
        return events;
    }

    parseEvent() {
        switch (this.currentToken.type) {
            case TokenType.SHOW: return this.parseShowCharacter();
            case TokenType.DIALOGUE: return this.parseDialogue();
            case TokenType.SET: return this.parseSetFlag();
            case TokenType.GOTO: return this.parseGoto();
            case TokenType.IF: return this.parseIfEvent();
            case TokenType.CHOICE: return this.parseChoice();
            case TokenType.PLAY_MUSIC: return this.parsePlayMusic();
            case TokenType.PLAY_SFX: return this.parsePlaySfx();
            case TokenType.STOP_MUSIC: return this.parseStopMusic();
            case TokenType.AMBIENT: return this.parsePlayAmbient();
            case TokenType.SET_VOLUME: return this.parseSetVolume();
            case TokenType.BACKGROUND: return this.parseBackgroundEvent();
            default: this.parseError("Unexpected event token");
        }
    }

    parseShowCharacter() {
        this.consume(TokenType.SHOW);
        const characterId = this.currentToken.value;
        this.consume(TokenType.IDENTIFIER);
        this.consume(TokenType.AT);
        const position = this.currentToken.value;
        if ([TokenType.K_LEFT, TokenType.K_RIGHT, TokenType.K_CENTER].includes(this.currentToken.type)) {
            this.consume(this.currentToken.type);
        } else {
            this.parseError("Expected position (left, right, center)");
        }
        return new ShowCharacterNode(characterId, position);
    }

    parseDialogue() {
        this.consume(TokenType.DIALOGUE);
        const characterId = this.currentToken.value;
        this.consume(TokenType.IDENTIFIER);
        const text = this.currentToken.value;
        this.consume(TokenType.STRING);
        return new DialogueNode(characterId, text);
    }

    parseSetFlag() {
        this.consume(TokenType.SET);
        this.consume(TokenType.FLAG);
        const flagId = this.currentToken.value;
        this.consume(TokenType.IDENTIFIER);
        this.consume(TokenType.EQUALS);
        let value = false;
        if (this.currentToken.type === TokenType.K_TRUE) {
            value = true;
            this.consume(TokenType.K_TRUE);
        } else {
            this.consume(TokenType.K_FALSE);
        }
        return new SetFlagNode(flagId, value);
    }

    parseGoto() {
        this.consume(TokenType.GOTO);
        const targetSceneId = this.currentToken.value;
        this.consume(TokenType.IDENTIFIER);
        this.consume(TokenType.SEMICOLON);
        return new GotoNode(targetSceneId);
    }

    parseIfEvent() {
        this.consume(TokenType.IF);
        this.consume(TokenType.LPAREN);
        const flagId = this.currentToken.value;
        this.consume(TokenType.IDENTIFIER);
        this.consume(TokenType.RPAREN);
        this.consume(TokenType.LBRACE);
        const trueEvents = this.parseEventList();
        this.consume(TokenType.RBRACE);
        let falseEvents = [];
        if (this.currentToken.type === TokenType.ELSE) {
            this.consume(TokenType.ELSE);
            this.consume(TokenType.LBRACE);
            falseEvents = this.parseEventList();
            this.consume(TokenType.RBRACE);
        }
        return new IfEventNode(flagId, trueEvents, falseEvents);
    }

    parseChoice() {
        this.consume(TokenType.CHOICE);
        this.consume(TokenType.LBRACE);
        const options = [];
        while (this.currentToken.type === TokenType.STRING) {
            const text = this.currentToken.value;
            this.consume(TokenType.STRING);
            this.consume(TokenType.ARROW);
            this.consume(TokenType.LBRACE);
            const events = this.parseEventList();
            this.consume(TokenType.RBRACE);
            options.push({ text: text, events: events });
        }
        this.consume(TokenType.RBRACE);
        return new ChoiceNode(options);
    }

    parseMain() {
        this.consume(TokenType.MAIN);
        this.consume(TokenType.LBRACE);
        const statements = [];
        while (this.currentToken.type !== TokenType.RBRACE) {
            statements.push(this.parseMainStatement());
        }
        this.consume(TokenType.RBRACE);
        return new MainNode(statements);
    }

    parseMainStatement() {
        if (this.currentToken.type === TokenType.IF) {
            return this.parseIfStatement();
        }
        if (this.currentToken.type === TokenType.GOTO) {
            return this.parseGoto();
        }
        const sceneId = this.currentToken.value;
        this.consume(TokenType.IDENTIFIER);
        this.consume(TokenType.SEMICOLON);
        return new SceneCallNode(sceneId);
    }

    parseIfStatement() {
        this.consume(TokenType.IF);
        this.consume(TokenType.LPAREN);
        const flagId = this.currentToken.value;
        this.consume(TokenType.IDENTIFIER);
        this.consume(TokenType.RPAREN);
        this.consume(TokenType.LBRACE);
        const trueBranch = [];
        while (this.currentToken.type !== TokenType.RBRACE) {
            trueBranch.push(this.parseMainStatement());
        }
        this.consume(TokenType.RBRACE);
        let falseBranch = [];
        if (this.currentToken.type === TokenType.ELSE) {
            this.consume(TokenType.ELSE);
            this.consume(TokenType.LBRACE);
            while (this.currentToken.type !== TokenType.RBRACE) {
                falseBranch.push(this.parseMainStatement());
            }
            this.consume(TokenType.RBRACE);
        }
        return new IfStatementNode(flagId, trueBranch, falseBranch);
    }

    parseOptions() {
        const options = {};
        if (this.currentToken.type === TokenType.LPAREN) {
            this.consume(TokenType.LPAREN);
            while (this.currentToken.type !== TokenType.RPAREN) {
                const paramName = this.currentToken.value;
                this.consume(TokenType.IDENTIFIER);
                this.consume(TokenType.COLON);
                const paramValue = parseFloat(this.currentToken.value);
                this.consume(TokenType.NUMBER);
                options[paramName] = paramValue;
                if (this.currentToken.type === TokenType.COMMA) {
                    this.consume(TokenType.COMMA);
                }
            }
            this.consume(TokenType.RPAREN);
        }
        return options;
    }

    parsePlayMusic() {
        this.consume(TokenType.PLAY_MUSIC);
        const track = this.currentToken.value;
        this.consume(TokenType.STRING);
        const options = this.parseOptions();
        return new PlayMusicNode(track, options);
    }

    parsePlaySfx() {
        this.consume(TokenType.PLAY_SFX);
        const sound = this.currentToken.value;
        this.consume(TokenType.STRING);
        const options = this.parseOptions();
        return new PlaySfxNode(sound, options);
    }

    parseStopMusic() {
        this.consume(TokenType.STOP_MUSIC);
        const options = this.parseOptions();
        return new StopMusicNode(options);
    }

    parsePlayAmbient() {
        this.consume(TokenType.AMBIENT);
        const sound = this.currentToken.value;
        this.consume(TokenType.STRING);
        const options = this.parseOptions();
        return new PlayAmbientNode(sound, options);
    }

    parseSetVolume() {
        this.consume(TokenType.SET_VOLUME);
        const target = this.currentToken.value; 
        this.consume(TokenType.IDENTIFIER); 
        const volume = parseFloat(this.currentToken.value);
        this.consume(TokenType.NUMBER);
        return new SetVolumeNode(target, volume);
    }

    parseBackgroundEvent() {
        this.consume(TokenType.BACKGROUND);
        const background = this.currentToken.value;
        this.consume(TokenType.STRING);
        const options = this.parseOptions();
        return new BackgroundNode(background, options);
    }
}

// --- 5. Game Engine Class (UPDATED: TIME MACHINE) ---
class GameEngine {
    constructor() {
        this.ast = null;
        this.flagStates = new Map();
        this.scenes = new Map();
        this.characters = new Map();

        this.currentScene = null;
        this.currentEventIndex = -1;
        this.mainFlow = []; 
        this.mainFlowIndex = -1;
        this.gameFinished = false;
        this.pendingChoice = null; 
        this.audioManager = { music: null, sfx: {} };
        this.uiInterface = null; 

        // ★ MÁQUINA DEL TIEMPO ★
        this.historyStack = []; // Pasado (Undo)
        this.futureStack = [];  // Futuro (Redo)
        this.maxHistory = 100;  // Límite de pasos
    }

    setUiInterface(ui) {
        this.uiInterface = ui; 
    }

    // --- LOGICA DE SNAPSHOTS ---
    
    // Captura el estado actual exacto
    createSnapshot() {
        return {
            sceneId: this.currentScene ? this.currentScene.id : null,
            eventIndex: this.currentEventIndex,
            mainFlowIndex: this.mainFlowIndex,
            // Clona el Map para que los cambios futuros no afecten al historial
            flagStates: new Map(this.flagStates), 
            gameFinished: this.gameFinished,
            pendingChoice: this.pendingChoice 
            // Nota: Para una máquina perfecta, también deberíamos guardar
            // qué música suena y qué fondo hay, para restaurarlo visualmente.
        };
    }

    // Guarda estado en la pila de historia
    pushHistory() {
        const snapshot = this.createSnapshot();
        this.historyStack.push(snapshot);
        if (this.historyStack.length > this.maxHistory) {
            this.historyStack.shift(); // Elimina el más antiguo
        }
        this.futureStack = []; // Al tomar nueva decisión, borramos el futuro alternativo
        console.log(`[History] Snapshot saved. Total: ${this.historyStack.length}`);
    }

    // Restaura un estado desde un snapshot
    restoreSnapshot(snapshot) {
        if (!snapshot) return;

        // Restaurar Escena
        if (snapshot.sceneId && this.scenes.has(snapshot.sceneId)) {
            this.currentScene = this.scenes.get(snapshot.sceneId);
        } else {
            this.currentScene = null;
        }
        
        // Restaurar Índices
        this.currentEventIndex = snapshot.eventIndex;
        this.mainFlowIndex = snapshot.mainFlowIndex;
        this.gameFinished = snapshot.gameFinished;
        this.pendingChoice = snapshot.pendingChoice;
        
        // Restaurar Flags (Clonar de vuelta)
        this.flagStates = new Map(snapshot.flagStates);
        
        console.log("[History] State restored.");
    }

    // Retroceder (Undo)
    undo() {
        if (this.historyStack.length === 0) {
            console.warn("No history to undo.");
            return null;
        }

        // 1. Guardamos donde estamos ahora en el futuro
        const currentSnapshot = this.createSnapshot();
        this.futureStack.push(currentSnapshot);

        // 2. Recuperamos el pasado
        const previousSnapshot = this.historyStack.pop();
        this.restoreSnapshot(previousSnapshot);

        // 3. Devolvemos lo que la UI debe mostrar AHORA
        return this.getCurrentInteraction();
    }

    // Avanzar (Redo)
    redo() {
        if (this.futureStack.length === 0) {
            console.warn("No future to redo.");
            return null;
        }

        // 1. Guardamos el presente en el pasado
        const currentSnapshot = this.createSnapshot();
        this.historyStack.push(currentSnapshot);

        // 2. Recuperamos el futuro
        const nextSnapshot = this.futureStack.pop();
        this.restoreSnapshot(nextSnapshot);

        // 3. Devolvemos lo que la UI debe mostrar
        return this.getCurrentInteraction();
    }

    // Helper para decirle a la UI qué pintar tras un viaje en el tiempo
    getCurrentInteraction() {
        if (this.gameFinished) return { type: 'fin', message: "Game Ended." };
        if (this.pendingChoice) return { type: 'waiting_choice', options: this.pendingChoice.options.map(o => o.text) };
        
        // Si estamos en medio de una escena, buscar el evento actual
        if (this.currentScene && this.currentEventIndex >= 0 && this.currentEventIndex < this.currentScene.events.length) {
            const event = this.currentScene.events[this.currentEventIndex];
            
            if (event.nodeType === 'DialogueNode') {
                const speaker = this.characters.get(event.characterId);
                return {
                    type: 'dialogue',
                    hablante: speaker ? speaker.displayName : event.characterId,
                    texto: event.text
                };
            }
        }
        
        // Si no es diálogo ni elección, intentamos avanzar un paso 'safe' para encontrar algo pintable
        // (Ojo: esto podría tener efectos secundarios, por ahora devolvemos un estado neutro)
        return { type: 'dialogue', hablante: 'System', texto: 'Estado restaurado. Pulsa Continuar.' };
    }

    // --- Semantic Analysis ---
    analyze(ast) {
        const declaredChars = new Set();
        const declaredFlags = new Set();
        const declaredScenes = new Set();
        const errors = [];

        ast.declarations.forEach(decl => {
            if (decl.nodeType === 'CharacterDeclarationNode') {
                if (declaredChars.has(decl.id)) errors.push(`Duplicate character declaration: ${decl.id}`);
                declaredChars.add(decl.id);
            } else if (decl.nodeType === 'FlagDeclarationNode') {
                if (declaredFlags.has(decl.id)) errors.push(`Duplicate flag declaration: ${decl.id}`);
                declaredFlags.add(decl.id);
            }
        });
        ast.scenes.forEach(scene => {
            if (declaredScenes.has(scene.id)) errors.push(`Duplicate scene declaration: ${scene.id}`);
            declaredScenes.add(scene.id);
        });

        if (errors.length > 0) throw new Error(`Semantic Errors:\n${errors.join('\n')}`);
        console.log("Semantic analysis passed.");
    }

    loadGame(scriptText) {
        try {
            const lexer = new Lexer(scriptText);
            const parser = new Parser(lexer);
            this.ast = parser.parse();
            this.analyze(this.ast);

            this.ast.declarations.forEach(decl => {
                if (decl.nodeType === 'CharacterDeclarationNode') {
                    this.characters.set(decl.id, decl);
                } else if (decl.nodeType === 'FlagDeclarationNode') {
                    this.flagStates.set(decl.id, decl.initialValue);
                }
            });
            this.ast.scenes.forEach(scene => {
                this.scenes.set(scene.id, scene);
            });

            if (!this.ast.mainBlock) throw new Error("Game requires a 'main' block.");
            
            this.mainFlow = [...this.ast.mainBlock.statements];
            this.mainFlowIndex = -1;
            this.gameFinished = false;
            this.currentScene = null;
            this.currentEventIndex = -1;
            this.pendingChoice = null;
            
            // Reset History
            this.historyStack = [];
            this.futureStack = [];

            console.log(`Game '${this.ast.name}' loaded successfully.`);
            return { type: 'loaded' };

        } catch (error) {
            console.error("Error loading game:", error);
            return { type: 'error', message: error.message };
        }
    }

    advance() {
        if (this.gameFinished || this.pendingChoice) {
            return this.pendingChoice
                ? { type: 'waiting_choice', options: this.pendingChoice.options.map(o => o.text) }
                : { type: 'fin', message: "Game has ended." };
        }

        let currentEventResult = null;

        // Priority 1: Scene Events
        if (this.currentScene && this.currentEventIndex < this.currentScene.events.length - 1) {
            this.currentEventIndex++;
            currentEventResult = this.executeEvent(this.currentScene.events[this.currentEventIndex]);
        }
        // Priority 2: Main Flow
        else {
            this.mainFlowIndex++;
            if (this.mainFlowIndex < this.mainFlow.length) {
                const mainStmt = this.mainFlow[this.mainFlowIndex];

                if (mainStmt.nodeType === 'SceneCallNode') {
                    if (this.scenes.has(mainStmt.sceneId)) {
                        const scene = this.scenes.get(mainStmt.sceneId);
                        const bg = scene.background;

                        if (bg && bg.startsWith("generate:")) {
                             return {
                                type: 'load_background',
                                prompt: bg.substring("generate:".length).trim(),
                                sceneId: mainStmt.sceneId
                            };
                        }
                        
                        if (this.uiInterface && bg) this.uiInterface.setBackground(bg);
                        
                        this.currentScene = scene;
                        this.currentEventIndex = -1;
                        return this.advance(); 

                    } else {
                        return { type: 'error', message: `Runtime Error: Scene '${mainStmt.sceneId}' not found.` };
                    }
                } else if (mainStmt.nodeType === 'IfStatementNode') {
                    const flagValue = this.flagStates.get(mainStmt.flagId) || false;
                    const branchToInject = flagValue ? mainStmt.trueBranch : mainStmt.falseBranch;
                    this.mainFlow.splice(this.mainFlowIndex + 1, 0, ...branchToInject);
                    return this.advance();
                }
            } else {
                this.gameFinished = true;
                return { type: 'fin', message: "End of game." };
            }
        }

        return currentEventResult ? currentEventResult : this.advance();
    }

    finishSceneLoad(sceneId) {
        if (this.scenes.has(sceneId)) {
            this.currentScene = this.scenes.get(sceneId);
            this.currentEventIndex = -1;
            return this.advance();
        } else {
            return { type: 'error', message: `Runtime Error: Scene '${sceneId}' not found post-load.` };
        }
    }

    executeEvent(event) {
        switch (event.nodeType) {
            case 'DialogueNode':
                // ★ SAVE HISTORY BEFORE DIALOGUE ★
                this.pushHistory();
                
                const speaker = this.characters.get(event.characterId);
                return {
                    type: 'dialogue',
                    hablante: speaker ? speaker.displayName : event.characterId,
                    texto: event.text
                };

            case 'ShowCharacterNode':
                if (this.uiInterface) {
                    const char = this.characters.get(event.characterId);
                    this.uiInterface.showCharacter(char ? char.sprite : '', event.position);
                }
                return null;

            case 'SetFlagNode':
                this.flagStates.set(event.flagId, event.value);
                return null;

            case 'GotoNode':
                 if (this.scenes.has(event.targetSceneId)) {
                    this.currentScene = this.scenes.get(event.targetSceneId);
                    this.currentEventIndex = -1;
                 } else {
                     return { type: 'error', message: `Runtime Error: Scene '${event.targetSceneId}' not found.` };
                 }
                return null; 

            case 'IfEventNode':
                const flagValue = this.flagStates.get(event.flagId) || false;
                const eventsToInject = flagValue ? event.trueEvents : event.falseEvents;
                if (eventsToInject.length > 0) {
                      this.currentScene.events.splice(this.currentEventIndex + 1, 0, ...eventsToInject);
                }
                return null;

            case 'ChoiceNode':
                 // ★ SAVE HISTORY BEFORE CHOICE ★
                 this.pushHistory();
                 
                 this.pendingChoice = event;
                 return { type: 'waiting_choice', options: event.options.map(o => o.text) };

            case 'PlayMusicNode':
                if (this.uiInterface) this.uiInterface.playMusic(event.track, event.options);
                return null;

            case 'PlaySfxNode':
                if (this.uiInterface) this.uiInterface.playSfx(event.sound, event.options);
                return null;

            case 'StopMusicNode':
                if (this.uiInterface) this.uiInterface.stopMusic(event.options);
                return null;
            
            case 'PlayAmbientNode':
                if (this.uiInterface) this.uiInterface.playAmbient(event.sound, event.options); 
                return null;

            case 'SetVolumeNode':
                if (this.uiInterface) this.uiInterface.setVolume(event.target, event.volume); 
                return null;
            
            case 'BackgroundNode':
                 if (this.uiInterface) this.uiInterface.setBackground(event.background);
                 return null;

            default:
                 return null; 
        }
    }

    makeChoice(choiceIndex) {
        // No necesitamos pushHistory aquí porque ya lo hicimos en executeEvent(ChoiceNode)
        // Esto permite que "Undo" te lleve de vuelta a ver las opciones, en vez de a la línea anterior a las opciones.
        
        if (!this.pendingChoice || choiceIndex < 0 || choiceIndex >= this.pendingChoice.options.length) {
            return { type: 'error', message: 'Invalid choice selection.' };
        }

        const chosenOption = this.pendingChoice.options[choiceIndex];
        if (chosenOption.events.length > 0) {
            this.currentScene.events.splice(this.currentEventIndex + 1, 0, ...chosenOption.events);
        }

        this.pendingChoice = null; 
        return this.advance();
    }
}


// ============================================================================
// --- 6. NARRATIVE INTELLIGENCE MODULE (Robot & Visualizer Unified) ---
// ============================================================================

// Clase auxiliar para guardar el reporte del "Robot"
class NarrativeReport {
    constructor() {
        this.totalScenes = 0;
        this.totalWords = 0;
        this.totalChoices = 0;
        this.endingsReached = 0;
        this.brokenLinks = []; // Lista de errores críticos (Enlaces a la nada)
        this.complexityScore = 0; // Puntuación de complejidad narrativa
    }
}

class StoryAnalyzer {
    constructor(ast) {
        this.ast = ast;
        this.report = new NarrativeReport();
        this.sceneMap = new Map(); // Mapa rápido para validar existencia
        this.clusters = new Map(); // Mapa para agrupar capítulos (Clusterización)
        
        // Indexar todas las escenas existentes al inicio
        this.ast.scenes.forEach(s => this.sceneMap.set(s.id, s));
    }

    // --- FASE 1: EL ROBOT (Análisis Lógico y Métricas) ---
    analyze() {
        // Reiniciar reporte
        this.report = new NarrativeReport();
        this.report.totalScenes = this.ast.scenes.length;
        this.clusters.clear();

        // Analizar cada escena individualmente
        this.ast.scenes.forEach(scene => {
            // Variables locales de la escena
            let words = 0;
            let choices = 0;
            let isEnding = true; // Asumimos que es final hasta encontrar una salida
            let outLinks = [];   // A dónde lleva esta escena

            // Función recursiva para inspeccionar eventos profundos (dentro de IFs o Choices)
            const traverseEvents = (events) => {
                events.forEach(e => {
                    if (e.nodeType === 'DialogueNode') {
                        // Contar palabras (aprox por espacios)
                        words += e.text.split(/\s+/).length;
                    } else if (e.nodeType === 'ChoiceNode') {
                        choices++;
                        isEnding = false; // Si hay opciones, la historia sigue
                        e.options.forEach(opt => traverseEvents(opt.events));
                    } else if (e.nodeType === 'GotoNode') {
                        isEnding = false;
                        outLinks.push(e.targetSceneId);
                    } else if (e.nodeType === 'SceneCallNode') {
                        isEnding = false;
                        outLinks.push(e.sceneId);
                    } else if (e.nodeType === 'IfEventNode' || e.nodeType === 'IfStatementNode') {
                        // Revisar ambas ramas del IF
                        const tEvents = e.trueEvents || e.trueBranch;
                        const fEvents = e.falseEvents || e.falseBranch;
                        if (tEvents) traverseEvents(tEvents);
                        if (fEvents) traverseEvents(fEvents);
                    }
                });
            };

            traverseEvents(scene.events);

            // Actualizar métricas globales del reporte
            this.report.totalWords += words;
            this.report.totalChoices += choices;
            if (isEnding) this.report.endingsReached++;

            // Detección de Errores: Validar Enlaces Rotos
            outLinks.forEach(targetId => {
                if (!this.sceneMap.has(targetId)) {
                    this.report.brokenLinks.push({
                        source: scene.id,
                        target: targetId
                    });
                }
            });

            // Guardar metadata inteligente en la escena (para el visualizador)
            scene._meta = {
                type: choices > 0 ? 'decision' : (isEnding ? 'ending' : 'normal'),
                wordCount: words,
                hasIssues: outLinks.some(l => !this.sceneMap.has(l))
            };

            // Clusterización Automática: Agrupar por prefijo (ej: 'cap1_intro' -> 'cap1')
            const prefix = scene.id.includes('_') ? scene.id.split('_')[0] : 'global';
            if (!this.clusters.has(prefix)) this.clusters.set(prefix, []);
            this.clusters.get(prefix).push(scene);
        });

        // Calcular complejidad (Fórmula simple: Palabras/100 + Decisiones*2 + Escenas)
        this.report.complexityScore = Math.round(
            (this.report.totalWords / 100) + (this.report.totalChoices * 2) + this.report.totalScenes
        );

        return this.report;
    }

    // --- FASE 2: EL VISUALIZADOR (Generación de Código Mermaid) ---
    generateMermaid() {
        // Asegurarse de que el robot ha corrido primero
        if (this.report.totalScenes === 0) this.analyze();

        let mm = "graph TD;\n"; // Iniciar gráfico Top-Down

        // --- A. ESTILOS VISUALES (Tema Cyberpunk/Dark) ---
        mm += "    classDef normal fill:#1a1a1a,stroke:#00ffff,stroke-width:2px,color:#fff;\n";
        mm += "    classDef decision fill:#2a0a2a,stroke:#ff00ff,stroke-width:2px,color:#fff,shape:rhombus;\n"; // Rombo
        mm += "    classDef ending fill:#003300,stroke:#00ff41,stroke-width:4px,color:#fff,shape:circle;\n"; // Círculo
        mm += "    classDef error fill:#550000,stroke:#ff0000,stroke-width:4px,color:#fff,stroke-dasharray: 5 5;\n"; // Rojo y punteado
        mm += "    classDef startNode fill:#00ff41,stroke:#000,stroke-width:2px,color:#000;\n";

        // --- B. NODO DE INICIO ---
        mm += "    START((INICIO)):::startNode --> Main;\n";

        // --- C. DIBUJAR NODOS (Agrupados por Clusters) ---
        this.clusters.forEach((scenes, prefix) => {
            if (prefix !== 'global') {
                mm += `    subgraph ${prefix.toUpperCase()}\n`; // Caja alrededor del capítulo
            }

            scenes.forEach(scene => {
                // Determinar forma y color según lo que descubrió el robot
                let shapeOpen = "[";
                let shapeClose = "]";
                let styleClass = "normal";

                if (scene._meta.hasIssues) {
                    styleClass = "error"; // Error detectado por el robot
                } else if (scene._meta.type === 'decision') {
                    shapeOpen = "{"; shapeClose = "}";
                    styleClass = "decision";
                } else if (scene._meta.type === 'ending') {
                    shapeOpen = "(("; shapeClose = "))";
                    styleClass = "ending";
                }

                // Etiqueta del nodo (Nombre)
                const label = `${scene.id}`; 
                mm += `    ${scene.id}${shapeOpen}"${label}"${shapeClose}:::${styleClass};\n`;
            });

            if (prefix !== 'global') {
                mm += `    end\n`;
            }
        });

        // --- D. DIBUJAR FLECHAS (Conexiones Inteligentes) ---
        const processedEdges = new Set();

        // Función helper para añadir flechas con contexto
        const addEdge = (from, to, label = null, changes = []) => {
            let edgeText = "";
            
            // Texto de la decisión (ej. "Ir al bosque")
            if (label) {
                const cleanLabel = label.replace(/"/g, "'").substring(0, 25);
                edgeText += cleanLabel + (label.length > 25 ? "..." : "");
            }

            // Mostrar cambios de estado en la flecha (ej. "$dinero=10")
            if (changes.length > 0) {
                if (edgeText) edgeText += "<br/>"; 
                edgeText += `[${changes.join(', ')}]`;
            }

            const arrow = edgeText ? `-- "${edgeText}" -->` : "-->";
            const edgeString = `    ${from} ${arrow} ${to}`;

            if (!processedEdges.has(edgeString)) {
                mm += edgeString + "\n";
                processedEdges.add(edgeString);
                
                // Si el destino no existe, crear un nodo fantasma de error para que se vea
                if (!this.sceneMap.has(to)) {
                    mm += `    ${to}[MISSING: ${to}]:::error;\n`;
                }
            }
        };

        // Recorrer Main
        if (this.ast.mainBlock) {
            this.scanBlockForEdges("Main", this.ast.mainBlock.statements, addEdge);
        }

        // Recorrer todas las escenas
        this.ast.scenes.forEach(scene => {
            this.scanBlockForEdges(scene.id, scene.events, addEdge);
        });

        return {
            code: mm,      // Código para Mermaid
            stats: this.report // Datos numéricos para el dashboard
        };
    }

    // Helper para extraer flechas y cambios de variables del AST
    scanBlockForEdges(sourceId, statements, addEdgeCallback) {
        let pendingChanges = []; // Acumula cambios de variables antes de un salto

        const scan = (stmts) => {
            if (!stmts) return;
            stmts.forEach(stmt => {
                // Capturar SET (Cambio de variable)
                if (stmt.nodeType === 'SetFlagNode') {
                    pendingChanges.push(`$${stmt.flagId}=${stmt.value}`);
                }
                // GOTO (Salto)
                else if (stmt.nodeType === 'GotoNode') {
                    addEdgeCallback(sourceId, stmt.targetSceneId, null, pendingChanges);
                    pendingChanges = []; // Reiniciar tras el salto
                }
                // CALL (Llamada)
                else if (stmt.nodeType === 'SceneCallNode') {
                    addEdgeCallback(sourceId, stmt.sceneId, "call", pendingChanges);
                }
                // CHOICE (Decisión)
                else if (stmt.nodeType === 'ChoiceNode') {
                    stmt.options.forEach(opt => {
                        // Buscar si esta opción lleva a algún lado
                        const internalChanges = []; 
                        let foundGoto = false;
                        
                        // Análisis superficial de la opción
                        opt.events.forEach(e => {
                             if(e.nodeType === 'SetFlagNode') internalChanges.push(`$${e.flagId}=${e.value}`);
                             if(e.nodeType === 'GotoNode') {
                                 // Unir cambios previos + internos
                                 const allChanges = [...pendingChanges, ...internalChanges];
                                 addEdgeCallback(sourceId, e.targetSceneId, opt.text, allChanges);
                                 foundGoto = true;
                             }
                        });
                        
                        // Si no hay goto directo, seguir escaneando (puede haber ifs dentro)
                        if(!foundGoto) scan(opt.events);
                    });
                }
                // IF (Condicional)
                else if (stmt.nodeType === 'IfStatementNode' || stmt.nodeType === 'IfEventNode') {
                    scan(stmt.trueBranch || stmt.trueEvents);
                    scan(stmt.falseBranch || stmt.falseEvents);
                }
            });
        };

        scan(statements);
    }
}