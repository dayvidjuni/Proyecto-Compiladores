/*
================================================================================
 syntax-highlighter.js - RESALTADO DE SINTAXIS PARA .game
================================================================================
*/

// Palabras clave del lenguaje .game
const KEYWORDS = {
    game: 'keyword-primary',
    scene: 'keyword-primary',
    character: 'keyword-primary',
    music: 'keyword-secondary',
    sound: 'keyword-secondary',
    if: 'keyword-control',
    set: 'keyword-control',
    dialogue: 'keyword-primary',
    choice: 'keyword-secondary',
    else: 'keyword-control',
    for: 'keyword-control',
    while: 'keyword-control',
    true: 'keyword-boolean',
    false: 'keyword-boolean'
};

class SyntaxHighlighter {
    constructor(textarea, lineNumbersContainer) {
        this.textarea = textarea;
        this.lineNumbers = lineNumbersContainer;
        this.highlighter = null;
        this.setupEditor();
    }

    setupEditor() {
        // Crear contenedor para el highlighter
        this.createHighlighterLayer();

        // Sincronizar scroll entre textarea y números de línea
        this.textarea.addEventListener('scroll', () => {
            this.lineNumbers.scrollTop = this.textarea.scrollTop;
            this.highlighter.scrollTop = this.textarea.scrollTop;
            this.highlighter.scrollLeft = this.textarea.scrollLeft;
        });

        // Actualizar números de línea y highlight al escribir
        this.textarea.addEventListener('input', () => {
            this.updateLineNumbers();
            this.updateHighlight();
        });

        this.updateLineNumbers();
        this.updateHighlight();
    }

    createHighlighterLayer() {
        const codeEditor = this.textarea.parentElement;
        
        // Crear div para el highlight
        this.highlighter = document.createElement('pre');
        this.highlighter.id = 'syntax-highlight';
        this.highlighter.className = 'syntax-highlight';
        this.highlighter.setAttribute('aria-hidden', 'true');
        
        // Insertar antes del textarea
        codeEditor.insertBefore(this.highlighter, this.textarea);
    }

    updateLineNumbers() {
        const lines = this.textarea.value.split('\n').length;
        let html = '';
        
        for (let i = 1; i <= lines; i++) {
            html += i + '\n';
        }
        
        this.lineNumbers.innerText = html;
    }

    updateHighlight() {
        const code = this.textarea.value;
        const highlighted = this.highlightCode(code);
        this.highlighter.innerHTML = highlighted;
    }

    highlightCode(code) {
        let html = '';
        let i = 0;
        
        while (i < code.length) {
            // Comentarios
            if (code[i] === '/' && code[i + 1] === '/') {
                const endOfLine = code.indexOf('\n', i);
                const endPos = endOfLine === -1 ? code.length : endOfLine;
                const comment = code.substring(i, endPos);
                const commentMarker = comment.substring(0, 2);
                const commentText = comment.substring(2);
                html += `<span class="comment-marker">${this.escapeHtml(commentMarker)}</span><span class="comment-text">${this.escapeHtml(commentText)}</span>`;
                i = endPos;
                continue;
            }
            
            // Strings con comillas dobles
            if (code[i] === '"') {
                let j = i + 1;
                while (j < code.length && code[j] !== '"') {
                    if (code[j] === '\\') j++; // Saltar caracteres escapados
                    j++;
                }
                if (j < code.length) j++; // Incluir la comilla de cierre
                const str = code.substring(i, j);
                html += `<span class="string">${this.escapeHtml(str)}</span>`;
                i = j;
                continue;
            }
            
            // Números
            if (/\d/.test(code[i])) {
                let j = i;
                while (j < code.length && /[\d.]/.test(code[j])) j++;
                const num = code.substring(i, j);
                html += `<span class="number">${this.escapeHtml(num)}</span>`;
                i = j;
                continue;
            }
            
            // Palabras clave e identificadores
            if (/[a-zA-Z_]/.test(code[i])) {
                let j = i;
                while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++;
                const word = code.substring(i, j);
                
                if (KEYWORDS[word]) {
                    const keywordClass = KEYWORDS[word];
                    html += `<span class="keyword ${keywordClass}">${this.escapeHtml(word)}</span>`;
                } else {
                    html += `<span class="identifier">${this.escapeHtml(word)}</span>`;
                }
                i = j;
                continue;
            }
            
            // Llaves y corchetes
            if (/[{}[\]]/.test(code[i])) {
                html += `<span class="bracket">${this.escapeHtml(code[i])}</span>`;
                i++;
                continue;
            }
            
            // Paréntesis
            if (/[()]/.test(code[i])) {
                html += `<span class="paren">${this.escapeHtml(code[i])}</span>`;
                i++;
                continue;
            }
            
            // Puntuación
            if (/[:,;.]/.test(code[i])) {
                html += `<span class="punctuation">${this.escapeHtml(code[i])}</span>`;
                i++;
                continue;
            }
            
            // Operadores de comparación
            if ((code[i] === '=' && (code[i + 1] === '=' || code[i + 1] === undefined)) ||
                (code[i] === '!' && code[i + 1] === '=') ||
                (code[i] === '<' && (code[i + 1] === '=' || code[i + 1] === undefined)) ||
                (code[i] === '>' && (code[i + 1] === '=' || code[i + 1] === undefined)) ||
                code[i] === '<' || code[i] === '>') {
                
                let j = i;
                if ((code[i] === '=' || code[i] === '!' || code[i] === '<' || code[i] === '>') && 
                    code[i + 1] === '=') {
                    j = i + 2;
                } else {
                    j = i + 1;
                }
                const op = code.substring(i, j);
                html += `<span class="operator-comparison">${this.escapeHtml(op)}</span>`;
                i = j;
                continue;
            }
            
            // Operadores matemáticos
            if (/[+\-*/%]/.test(code[i])) {
                html += `<span class="operator-math">${this.escapeHtml(code[i])}</span>`;
                i++;
                continue;
            }
            
            // Caracteres normales (espacios, saltos de línea, etc)
            html += this.escapeHtml(code[i]);
            i++;
        }
        
        return html;
    }
    
    escapeHtml(str) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, char => map[char]);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('script-input');
    const lineNumbers = document.getElementById('line-numbers');
    
    if (textarea && lineNumbers) {
        new SyntaxHighlighter(textarea, lineNumbers);
    }
});
