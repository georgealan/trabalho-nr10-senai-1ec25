// Converte as quebras de linha do arquivo json para <br> e exibir as quebras de linhas corretas no HTML
function nl2br(str) {
    if (!str) return ''; // Proteção contra valores nulos/undefined
    return String(str).replace(/\n/g, '<br>');
}

// Import do arquivo JSON com as perguntas
const response = await fetch('scripts/questions-nr6.json');
const quizData = await response.json();

// Variáveis do quiz
let currentQuestion = 0;
let selectedQuestions = [];
let score = 0;
let currentCorrectLetter = '';
let totalQuestions = 5;
let answeredQuestions = 0;

// Variáveis do timer
let timer;
let timeLeft;
let bonusTimer = 0; // Variável para o bônus de tempo
let totalTimeSpent = 0; // Variável para acumular o tempo gasto
let questionStartTime = 0; // Variável para marcar o início de cada pergunta
const timerElement = document.getElementById('timer');

// Configurações de dificuldade
const difficultySettings = {
    easy: {
        timePerQuestion: 60,
        bonusTimer: 6,
        decreaseTimer: 1,
        label: "Fácil",
        color: "#5cb85c"
    },
    medium: {
        timePerQuestion: 40,
        bonusTimer: 3,
        decreaseTimer: 2,
        label: "Médio",
        color: "#f0ad4e"
    },
    hard: {
        timePerQuestion: 15,
        bonusTimer: 1,
        decreaseTimer: 3,
        label: "Difícil",
        color: "#d9534f"
    },
    expert: {
        timePerQuestion: 10,
        bonusTimer: 0.5,
        decreaseTimer: 4,
        label: "Expert",
        color: "#800080"
    }
};

// Variável para armazenar a dificuldade selecionada
let currentDifficulty = 'medium';

// Elementos DOM
const setupContainer = document.getElementById('setup-container');
const timerContainer = document.getElementById('timer-container-box');
const quizContainer = document.getElementById('quiz-container');
const questionCountInput = document.getElementById('question-count');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const resultsDiv = document.getElementById('results');

// Função para iniciar o timer
function startTimer() {
    clearInterval(timer); // Reseta qualquer timer existente
    timeLeft = difficultySettings[currentDifficulty].timePerQuestion; // Define o tempo inicial
    timeLeft += bonusTimer; // Adiciona o bônus de tempo
    questionStartTime = Date.now(); // Registra o momento que a pergunta começou
    updateTimerDisplay();
    
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        // Muda a cor do timer quando o tempo estiver baixo
        if (timeLeft <= Math.floor(difficultySettings[currentDifficulty].timePerQuestion / 3)) {
            timerElement.classList.add('timer-warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            timeUp();
        }

        // Finaliza o quiz se o tempo total for menor do que zero segundos.
        if (timeLeft < 0) {
            clearInterval(timer);
            showResults();
        }
    }, 1000);
}

// Atualiza a exibição do timer
function updateTimerDisplay() {
    timerElement.textContent = timeLeft;
}

// Ação quando o tempo acaba
function timeUp() {
    clearInterval(timer);

    // Calcula o tempo gasto nesta pergunta
    const timeElapsed = difficultySettings[currentDifficulty].timePerQuestion;
    totalTimeSpent += timeElapsed;

    const feedback = document.getElementById('feedback');
    feedback.textContent = "Tempo esgotado! A resposta correta era: " + currentCorrectLetter;
    feedback.className = 'feedback incorrect';
    feedback.style.display = 'block';

    // Destacar a resposta correta
    document.querySelectorAll('.option').forEach(option => {
        if (option.getAttribute('data-letter') === currentCorrectLetter) {
            option.classList.add('correct');
        }
        option.style.pointerEvents = 'none'; // Desativa cliques adicionais
        option.style.opacity = '0.7'; // Deixa as opções meio transparentes
    });
    
    document.getElementById('next-btn').classList.remove('hidden');
}


// Iniciar o quiz
startBtn.addEventListener('click', () => {
    totalQuestions = parseInt(questionCountInput.value);
    currentDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
    document.getElementById('timer-box').classList.remove('hidden');
    
    // Validar entrada (5-20 perguntas)
    if (totalQuestions < 5) totalQuestions = 5;
    if (totalQuestions > 20) totalQuestions = 20;
    if (totalQuestions > quizData.length) totalQuestions = quizData.length;
    
    questionCountInput.value = totalQuestions;
    
    // Embaralhar e selecionar as perguntas
    selectedQuestions = [...quizData]
        .sort(() => Math.random() - 0.5)
        .slice(0, totalQuestions);
    
    // Iniciar o quiz
    setupContainer.classList.add('hidden');
    quizContainer.classList.remove('hidden');

    // Aplicar estilo conforme dificuldade
    document.documentElement.style.setProperty(
        '--difficulty-color', 
        difficultySettings[currentDifficulty].color
    );

    loadQuestion();
});

// Carregar pergunta
function loadQuestion() {
    if (currentQuestion >= selectedQuestions.length) {
        showResults();
        return;
    }

    const question = selectedQuestions[currentQuestion];
    document.getElementById('progress').textContent = `Pergunta ${currentQuestion + 1} de ${totalQuestions}`;
    //document.getElementById('question-text').textContent = question.question;
    document.getElementById('question-text').innerHTML = nl2br(question.question);
    
    // Embaralhar a posição da resposta correta
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const correctPosition = Math.floor(Math.random() * 5);
    currentCorrectLetter = letters[correctPosition];
    
    let optionsHtml = '';
    for (let i = 0; i < 5; i++) {
        let optionText;
        if (i === correctPosition) {
            optionText = question.options[question.correctOptionIndex];
        } else {
            // Preencher com outras opções (evitando repetir a correta)
            let otherOptions = question.options.filter((_, index) => index !== question.correctOptionIndex);
            optionText = otherOptions[i < correctPosition ? i : i - 1];
        }
        
        optionsHtml += `
            <div class="option" data-letter="${letters[i]}">
                ${letters[i]}) ${optionText}
            </div>
        `;
    }
    
    document.getElementById('options-container').innerHTML = optionsHtml;
    document.getElementById('feedback').style.display = 'none';
    nextBtn.classList.add('hidden');

    // Adicionar eventos às opções
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', () => {
          clearInterval(timer); // Para o timer quando responde
            if (nextBtn.classList.contains('hidden')) { // Só permite responder se ainda não respondeu
                const selectedLetter = option.getAttribute('data-letter');
                const feedback = document.getElementById('feedback');
                
                if (selectedLetter === currentCorrectLetter) {
                    bonusTimer += difficultySettings[currentDifficulty].bonusTimer // Adiciona segundos por resposta correta de acordo com a dificuldade selecionada
                    updateTimerDisplay();
                    option.classList.add('correct');
                    //feedback.innerHTML = question.explanation.correct;
                    feedback.innerHTML = nl2br(question.explanation.correct);
                    feedback.className = 'feedback correct';
                    score++;
                } else {
                    bonusTimer -= difficultySettings[currentDifficulty].decreaseTimer // Remove segundos por resposta correta de acordo com a dificuldade selecionada
                    option.classList.add('incorrect');
                    // Encontrar e destacar a resposta correta
                    const options = document.querySelectorAll('.option');
                    options.forEach(opt => {
                        if (opt.getAttribute('data-letter') === currentCorrectLetter) {
                            opt.classList.add('correct');
                        }
                    });
                    //feedback.innerHTML = question.explanation.incorrect + `<br>Resposta correta: ${currentCorrectLetter}`;
                    feedback.innerHTML = nl2br(question.explanation.incorrect) + `<br>Resposta correta: ${currentCorrectLetter}`;
                    feedback.className = 'feedback incorrect';
                }
                
                feedback.style.display = 'block';
                nextBtn.classList.remove('hidden');
                answeredQuestions++;
                
                // Desabilitar outras opções após seleção
                document.querySelectorAll('.option').forEach(opt => {
                    opt.style.cursor = 'default';
                    opt.style.opacity = '0.7';
                });
            }
        });
    });

    startTimer(); // Inicia o timer para cada nova pergunta
    document.getElementById('difficulty-display').textContent = 
        `Dificuldade: ${difficultySettings[currentDifficulty].label}`;
}

// Mostrar resultados finais
function showResults() {
    quizContainer.classList.add('hidden');
    resultsDiv.classList.remove('hidden');
    
    const percentage = Math.round((score / totalQuestions) * 100);
    const averageTime = (totalTimeSpent / totalQuestions).toFixed(1);
    let message = '';
    
    if (percentage >= 80) {
        message = 'Excelente! Você demonstrou ótimo conhecimento. O prof. Sérgio está orgulhoso!';
    } else if (percentage >= 60) {
        message = 'Bom trabalho! Você acertou a maioria das perguntas. O prof. Sérgio está satisfeito!';
    } else if (percentage >= 40) {
        message = 'Você foi razoável, mas pode melhorar. O prof. Sérgio recomenda mais estudos, se não ele vai te reprovar.';
    } else {
        message = 'Estude mais sobre o assunto e tente novamente. O professor Sérgio está chateado com você e vai te reprovar caso você continue assim.';
    }
    
    resultsDiv.innerHTML = `
        <h2>Quiz Concluído!</h2>
        <p>Sua pontuação: ${score} de ${totalQuestions} (${percentage}%)</p>
        <p>Tempo médio por pergunta: ${averageTime}s</p>
        <p>${message}</p>
        <button id="restart-btn">Reiniciar Quiz</button>
    `;
    
    document.getElementById('timer-box').classList.add('hidden');

    document.getElementById('restart-btn').addEventListener('click', () => {
        resetQuiz();
    });
}

// Reiniciar o quiz
function resetQuiz() {
    currentQuestion = 0;
    score = 0;
    bonusTimer = 0;
    answeredQuestions = 0;
    totalTimeSpent = 0; // Resetar o tempo total
    questionStartTime = 0; // Resetar o tempo da pergunta
    resultsDiv.classList.add('hidden');
    setupContainer.classList.remove('hidden');
}

// Próxima pergunta
nextBtn.addEventListener('click', () => {
    clearInterval(timer);
    timerElement.classList.remove('timer-warning');
    currentQuestion++;
    loadQuestion();
});

