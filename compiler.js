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
    PLAY_MUSIC: 'PLAY_MUSIC',PLAY_SFX: 'PLAY_SFX',STOP_MUSIC: 'STOP_MUSIC',
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
            ["play_ambient", TokenType.AMBIENT], // Nuevo
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
        this.currentPos++; // Skip opening "
        while (!this.isAtEnd() && this.source[this.currentPos] !== '"') {
            value += this.source[this.currentPos++];
        }
        if (!this.isAtEnd()) this.currentPos++; // Skip closing "
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

// --- 3. AST Node Classes (Simplified JS representation) ---
// Base class (optional, for structure)
class ASTNode { constructor(type) { this.nodeType = type; } }

class PlayMusicNode extends ASTNode {
    constructor(track, options) {
        super('PlayMusicNode');
        this.track = track;
        this.options = options; // <-- Objeto de opciones
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
        this.target = target; // ej: "music", "ambient"
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
    constructor(options) { super('ChoiceNode'); this.options = options; } // options = [{ text: "...", events: [...] }, ...]
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

    parse() {
        return this.parseGame();
    }

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
        
        // El background es opcional ahora
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
        // ★ ARREGLO ★
        // Añadimos AMBIENT, SET_VOLUME y BACKGROUND a la lista de eventos permitidos
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
        // Otherwise, it must be a scene call
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
                const paramName = this.currentToken.value; // ej: 'fade'
                this.consume(TokenType.IDENTIFIER);
                this.consume(TokenType.COLON);
                
                const paramValue = parseFloat(this.currentToken.value); // ej: 2.0
                this.consume(TokenType.NUMBER);
                
                options[paramName] = paramValue;
                
                if (this.currentToken.type === TokenType.COMMA) {
                    this.consume(TokenType.COMMA);
                }
            }
            this.consume(TokenType.RPAREN);
        }
        return options; // Devuelve ej: { fade: 2.0, volume: 0.8 }
    }

    parsePlayMusic() {
        this.consume(TokenType.PLAY_MUSIC);
        const track = this.currentToken.value;
        this.consume(TokenType.STRING);
        const options = this.parseOptions(); // <-- ¡La magia!
        return new PlayMusicNode(track, options);
    }

    parsePlaySfx() {
        this.consume(TokenType.PLAY_SFX);
        const sound = this.currentToken.value;
        this.consume(TokenType.STRING);
        const options = this.parseOptions(); // <-- ¡La magia!
        return new PlaySfxNode(sound, options);
    }

    parseStopMusic() {
        this.consume(TokenType.STOP_MUSIC);
        const options = this.parseOptions(); // <-- ¡La magia!
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
        // "music", "sfx", "ambient" serán leídos como IDENTIFIER
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

// --- 5. Game Engine Class ---
class GameEngine {
    constructor() {
        this.ast = null;
        this.flagStates = new Map();
        this.scenes = new Map();
        this.characters = new Map();

        this.currentScene = null;
        this.currentEventIndex = -1;
        this.mainFlow = []; // Array of main statement nodes
        this.mainFlowIndex = -1;
        this.gameFinished = false;
        this.pendingChoice = null; // Stores choice node when waiting for user input
        this.audioManager = { music: null, sfx: {} };
        this.uiInterface = null; 
    }

    setUiInterface(ui) {
        this.uiInterface = ui; 
    }

    // Semantic Analysis (simplified) - Checks for duplicate declarations and valid references
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

        // Basic reference checks (can be expanded)
        ast.scenes.forEach(scene => {
            scene.events.forEach(event => {
                 if (event.nodeType === 'ShowCharacterNode' || event.nodeType === 'DialogueNode') {
                    if (!declaredChars.has(event.characterId)) errors.push(`Undeclared character used: ${event.characterId} in scene ${scene.id}`);
                } else if (event.nodeType === 'SetFlagNode' || event.nodeType === 'IfEventNode') {
                    if (!declaredFlags.has(event.flagId)) errors.push(`Undeclared flag used: ${event.flagId} in scene ${scene.id}`);
                } else if (event.nodeType === 'GotoNode') {
                    if (!declaredScenes.has(event.targetSceneId)) errors.push(`Goto target scene not declared: ${event.targetSceneId} in scene ${scene.id}`);
                } else if (event.nodeType === 'ChoiceNode') {
                    event.options.forEach(opt => { /* Recursive check possible here */ });
                }
            });
        });
        if (ast.mainBlock) {
             ast.mainBlock.statements.forEach(stmt => {
                if (stmt.nodeType === 'SceneCallNode') {
                     if (!declaredScenes.has(stmt.sceneId)) errors.push(`Main calls undeclared scene: ${stmt.sceneId}`);
                } else if (stmt.nodeType === 'IfStatementNode') {
                    if (!declaredFlags.has(stmt.flagId)) errors.push(`Main uses undeclared flag in if: ${stmt.flagId}`);
                     /* Recursive check possible here */
                }
            });
        }


        if (errors.length > 0) {
            throw new Error(`Semantic Errors:\n${errors.join('\n')}`);
        }
        console.log("Semantic analysis passed.");
    }


    loadGame(scriptText) {
        try {
            const lexer = new Lexer(scriptText);
            const parser = new Parser(lexer);
            this.ast = parser.parse();
            this.analyze(this.ast); // Run semantic analysis

            // Populate engine state from AST
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

            if (!this.ast.mainBlock) {
                throw new Error("Game requires a 'main' block.");
            }
            this.mainFlow = [...this.ast.mainBlock.statements]; // Copy statements
            this.mainFlowIndex = -1;
            this.gameFinished = false;
            this.currentScene = null;
            this.currentEventIndex = -1;
            this.pendingChoice = null;

            console.log(`Game '${this.ast.name}' loaded successfully.`);
            // Don't call advance() here, main.js will call it first.
            return { type: 'loaded' };

        } catch (error) {
            console.error("Error loading game:", error);
            return { type: 'error', message: error.message };
        }
    }

    // Processes the next step in the game
    advance() {
        if (this.gameFinished || this.pendingChoice) {
            // If waiting for choice or finished, do nothing until choice is made or game restarts
            return this.pendingChoice
                ? { type: 'waiting_choice', options: this.pendingChoice.options.map(o => o.text) }
                : { type: 'fin', message: "Game has ended." };
        }

        let currentEventResult = null;

        // Priority 1: Execute events within the current scene
        if (this.currentScene && this.currentEventIndex < this.currentScene.events.length - 1) {
            this.currentEventIndex++;
            currentEventResult = this.executeEvent(this.currentScene.events[this.currentEventIndex]);
        }
        // Priority 2: If scene events are done (or no scene active), advance the main flow
        else {
            this.mainFlowIndex++;
            if (this.mainFlowIndex < this.mainFlow.length) {
                const mainStmt = this.mainFlow[this.mainFlowIndex];

        if (mainStmt.nodeType === 'SceneCallNode') {
            if (this.scenes.has(mainStmt.sceneId)) {
                
                const scene = this.scenes.get(mainStmt.sceneId);
                const bg = scene.background;

                // ★ CAMBIO ★ Lógica de IA
                if (bg.startsWith("generate:")) {
                    // ¡PAUSA! Devuelve un objeto especial para la UI
                    return {
                        type: 'load_background',
                        prompt: bg.substring("generate:".length).trim(),
                        sceneId: mainStmt.sceneId // Pasa el ID de la escena
                    };
                }
                
                // Carga de fondo normal (síncrona)
                if (this.uiInterface) {
                    this.uiInterface.setBackground(bg); // Llama a la UI
                }
                
                // Continúa como antes
                this.currentScene = scene;
                this.currentEventIndex = -1;
                console.log(`Entering scene: ${this.currentScene.id}`);
                return this.advance(); // Continúa la recursión

            } else {
                return { type: 'error', message: `Runtime Error: Scene '${mainStmt.sceneId}' not found.` };
            }
        } else if (mainStmt.nodeType === 'IfStatementNode') {
                    const flagValue = this.flagStates.get(mainStmt.flagId) || false;
                    const branchToInject = flagValue ? mainStmt.trueBranch : mainStmt.falseBranch;
                     // Inject the chosen branch's statements into the main flow
                    this.mainFlow.splice(this.mainFlowIndex + 1, 0, ...branchToInject);
                    console.log(`Main If '${mainStmt.flagId}' is ${flagValue}. Injecting ${branchToInject.length} statements.`);
                    // Immediately advance to the first injected statement
                    return this.advance();
                }

            } else {
                // Reached the end of the main flow
                this.gameFinished = true;
                return { type: 'fin', message: "End of game." };
            }
        }

        // If executeEvent returned a result (like dialogue or choice), return it.
        // Otherwise (if it was an instant action like set/show/goto), recursively call advance()
        // to process the *next* thing immediately.
        return currentEventResult ? currentEventResult : this.advance();
    }

    finishSceneLoad(sceneId) {
        if (this.scenes.has(sceneId)) {
            this.currentScene = this.scenes.get(sceneId);
            this.currentEventIndex = -1;
            console.log(`Finished async load, entering scene: ${this.currentScene.id}`);
            // Avanza al primer evento de la nueva escena
            return this.advance();
        } else {
            return { type: 'error', message: `Runtime Error: Scene '${sceneId}' not found post-load.` };
        }
    }

    // Executes a single event node from a scene
    executeEvent(event) {
        switch (event.nodeType) {
            case 'DialogueNode':
                console.log(`Dialogue: ${event.characterId}: ${event.text}`);
                const speaker = this.characters.get(event.characterId);
                return {
                    type: 'dialogue',
                    hablante: speaker ? speaker.displayName : event.characterId,
                    texto: event.text
                };

            case 'ShowCharacterNode':
                console.log(`Show: ${event.characterId} at ${event.position}`);
                const char = this.characters.get(event.characterId);
                // ★ CAMBIO ★ Llama a la UI antes de retornar null
                if (this.uiInterface) {
                    this.uiInterface.showCharacter(char ? char.sprite : '', event.position);
                }
                return null;

            case 'SetFlagNode':
                console.log(`Set Flag: ${event.flagId} = ${event.value}`);
                this.flagStates.set(event.flagId, event.value);
                return null; // Instant action

            case 'GotoNode':
                 console.log(`Goto: ${event.targetSceneId}`);
                 if (this.scenes.has(event.targetSceneId)) {
                    this.currentScene = this.scenes.get(event.targetSceneId);
                    this.currentEventIndex = -1; // Reset for the new scene
                 } else {
                     return { type: 'error', message: `Runtime Error: Scene '${event.targetSceneId}' not found.` };
                 }
                return null; // Action performed, continue processing (will likely trigger advance again for the new scene)

            case 'IfEventNode':
                console.log(`Scene If: ${event.flagId}`);
                const flagValue = this.flagStates.get(event.flagId) || false;
                const eventsToInject = flagValue ? event.trueEvents : event.falseEvents;
                if (eventsToInject.length > 0) {
                     // Inject events into the current scene's event list
                     this.currentScene.events.splice(this.currentEventIndex + 1, 0, ...eventsToInject);
                     console.log(`Injecting ${eventsToInject.length} events into scene ${this.currentScene.id}`);
                }
                return null; // Instantly continue to process next (potentially injected) event

            case 'ChoiceNode':
                 console.log(`Choice presented with ${event.options.length} options.`);
                 this.pendingChoice = event; // Store the choice node
                 // Return structure indicating we are waiting for user input
                 return { type: 'waiting_choice', options: event.options.map(o => o.text) };

            case 'PlayMusicNode':
                console.log(`Play Music: ${event.track}`, event.options);
                if (this.uiInterface) {
                    this.uiInterface.playMusic(event.track, event.options); // Pasa las opciones
                }
                return null;

            case 'PlaySfxNode':
                console.log(`Play SFX: ${event.sound}`, event.options);
                if (this.uiInterface) {
                    this.uiInterface.playSfx(event.sound, event.options); // Pasa las opciones
                }
                return null;

            case 'StopMusicNode':
                console.log(`Stop Music`, event.options);
                if (this.uiInterface) {
                    this.uiInterface.stopMusic(event.options); // Pasa las opciones
                }
                return null;
            
            case 'PlayAmbientNode':
                console.log(`Play Ambient: ${event.sound}`, event.options);
                if (this.uiInterface) {
                    // Esperamos que main.js tenga esta función
                    this.uiInterface.playAmbient(event.sound, event.options); 
                }
                return null;

            case 'SetVolumeNode':
                console.log(`Set Volume: ${event.target} to ${event.volume}`);
                if (this.uiInterface) {
                    // Esperamos que main.js tenga esta función
                    this.uiInterface.setVolume(event.target, event.volume); 
                }
                return null;

            default:
                 console.warn(`Unknown event type: ${event.nodeType}`);
                 return null; // Skip unknown events
        }
    }

    // Called when the user selects a choice
    makeChoice(choiceIndex) {
        if (!this.pendingChoice || choiceIndex < 0 || choiceIndex >= this.pendingChoice.options.length) {
            console.error("Invalid choice index or no choice pending.");
            return { type: 'error', message: 'Invalid choice selection.' };
        }

        const chosenOption = this.pendingChoice.options[choiceIndex];
        console.log(`Choice made: "${chosenOption.text}". Injecting ${chosenOption.events.length} events.`);

        // Inject the chosen option's events into the current scene's event list
        if (chosenOption.events.length > 0) {
            this.currentScene.events.splice(this.currentEventIndex + 1, 0, ...chosenOption.events);
        }

        this.pendingChoice = null; // Clear pending choice

        // Immediately advance to process the first event of the chosen option
        return this.advance();
    }
}