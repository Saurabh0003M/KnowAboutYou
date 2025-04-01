class QuizApp {
  constructor() {
    this.quizData = null;
    this.state = {
      currentQuiz: null,
      questions: [],
      currentQuestionIndex: 0,
      userAnswers: [],
      startTime: null,
      quizTimer: null,
      adTimer: null
    };

    this.elements = {
      sections: {
        home: document.getElementById('home'),
        quiz: document.getElementById('quiz'),
        ad: document.getElementById('ad-section'),
        result: document.getElementById('result'),
        loading: document.getElementById('loading')
      },
      quizElements: {
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options'),
        prevButton: document.getElementById('prev-button'),
        currentQ: document.getElementById('current-q'),
        totalQ: document.getElementById('total-q'),
        progressFill: document.querySelector('.progress-fill'),
        quitBtn: document.getElementById('quit-btn'),
        timer: document.getElementById('quiz-timer'),
        water: document.getElementById('water')
      },
      adElements: {
        timer: document.getElementById('ad-timer'),
        skipBtn: document.getElementById('skip-ad')
      },
      resultElements: {
        resultText: document.getElementById('result-text'),
        resultImage: document.getElementById('result-image'),
        shareBtn: document.getElementById('share-button'),
        retakeBtn: document.getElementById('retake-btn'),
        scoreText: document.getElementById('score-text'),
        scoreFill: document.getElementById('score-fill')
      },
      feedback: {
        input: document.getElementById('feedback-input'),
        submitBtn: document.getElementById('submit-feedback')
      }
    };

    this.quizResults = {
      mental_age: [
        { min: 0, max: 7, result: "Your mental age is 22", emoji: "🧒", description: "You have a youthful and curious mindset, always eager to learn and explore new things!" },
        { min: 8, max: 11, result: "Your mental age is 30", emoji: "🧑", description: "You're in your prime - balanced, confident, and capable of handling life's challenges." },
        { min: 12, max: Infinity, result: "Your mental age is 40", emoji: "🧓", description: "You possess wisdom beyond your years with a mature and thoughtful perspective on life." }
      ],
      actor: [
        { min: 0, max: 7, result: "You resemble Leonardo DiCaprio", emoji: "🎭", description: "Like Leo, you're versatile, charismatic, and deeply committed to your passions." },
        { min: 8, max: 11, result: "You resemble Meryl Streep", emoji: "🏆", description: "Like Meryl, you're exceptionally talented, adaptable, and excel in any situation." },
        { min: 12, max: Infinity, result: "You resemble Denzel Washington", emoji: "🌟", description: "Like Denzel, you're powerful, dignified, and command respect effortlessly." }
      ],
      movie: [
        { min: 0, max: 7, result: "Your life is like 'Forrest Gump'", emoji: "🏃", description: "Like Forrest, your life is full of unexpected adventures and simple wisdom that touches others." },
        { min: 8, max: 11, result: "Your life is like 'The Matrix'", emoji: "🕶️", description: "Like Neo, you see beyond the surface and question reality, ready to take the red pill." },
        { min: 12, max: Infinity, result: "Your life is like 'Inception'", emoji: "🌀", description: "Like Cobb, your life is complex, layered, and full of dreams within dreams." }
      ]
    };

    this.init();
  }

  async init() {
    await this.setupEventListeners();
    this.showSection('home');
  }

  async setupEventListeners() {
    // Quiz card selection
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => this.handleCardClick(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleCardClick(card);
        }
      });
    });

    // Navigation buttons
    this.elements.quizElements.prevButton.addEventListener('click', () => this.previousQuestion());
    this.elements.quizElements.quitBtn.addEventListener('click', () => this.quitQuiz());
    this.elements.adElements.skipBtn.addEventListener('click', () => this.skipAd());
    this.elements.resultElements.retakeBtn.addEventListener('click', () => this.retakeQuiz());
    this.elements.resultElements.shareBtn.addEventListener('click', () => this.shareResults());
    this.elements.feedback.submitBtn.addEventListener('click', () => this.submitFeedback());
  }

  async handleCardClick(card) {
    const quizType = card.dataset.quiz;
    await this.startQuiz(quizType);
  }

  async loadQuizData() {
    if (this.quizData) return;

    try {
      this.showLoading(true);
      const response = await fetch('quizdata.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      this.quizData = await response.json();
    } catch (error) {
      console.error('Error loading quiz data:', error);
      this.showToast('Failed to load quiz. Please try again later.', 'error');
      throw error;
    } finally {
      this.showLoading(false);
    }
  }

  async startQuiz(quizType) {
    try {
      this.showLoading(true);
      await this.loadQuizData();

      // Simulate network delay for demo purposes
      await new Promise(resolve => setTimeout(resolve, 800));

      this.state = {
        ...this.state,
        currentQuiz: quizType,
        questions: this.quizData[quizType].questions,
        currentQuestionIndex: 0,
        userAnswers: [],
        startTime: Date.now()
      };

      // Reset water level
      this.elements.quizElements.water.style.height = '0%';

      // Start quiz timer
      if (this.state.quizTimer) {
        clearInterval(this.state.quizTimer);
      }
      this.state.quizTimer = setInterval(() => this.updateQuizTimer(), 1000);

      // Update UI
      this.elements.quizElements.totalQ.textContent = this.state.questions.length;
      this.showSection('quiz');
      this.displayQuestion();
      this.updateProgress();
      this.updateQuizTimer();
    } catch (error) {
      console.error('Error starting quiz:', error);
      this.showSection('home');
    } finally {
      this.showLoading(false);
    }
  }

  displayQuestion() {
    const currentQuestion = this.state.questions[this.state.currentQuestionIndex];
    
    this.elements.quizElements.questionText.textContent = currentQuestion.question;
    this.elements.quizElements.optionsContainer.innerHTML = '';
    this.elements.quizElements.currentQ.textContent = this.state.currentQuestionIndex + 1;
    
    currentQuestion.options.forEach((option, index) => {
      const optionEl = document.createElement('button');
      optionEl.className = 'option';
      optionEl.setAttribute('role', 'radio');
      optionEl.setAttribute('aria-checked', 
        this.state.userAnswers[this.state.currentQuestionIndex] === index ? 'true' : 'false');
      optionEl.tabIndex = 0;
      optionEl.innerHTML = `
        <span class="option-indicator">${index + 1}</span>
        <span class="option-text">${option}</span>
      `;
      
      if (this.state.userAnswers[this.state.currentQuestionIndex] === index) {
        optionEl.classList.add('selected');
      }
      
      optionEl.addEventListener('click', () => this.selectOption(index));
      optionEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectOption(index);
        }
      });
      
      this.elements.quizElements.optionsContainer.appendChild(optionEl);
    });
    
    this.updateNavButtons();
  }

  selectOption(optionIndex) {
    this.state.userAnswers[this.state.currentQuestionIndex] = optionIndex;
    this.highlightSelection(optionIndex);
    
    setTimeout(() => {
      if (this.state.currentQuestionIndex < this.state.questions.length - 1) {
        this.state.currentQuestionIndex++;
        this.displayQuestion();
        this.updateProgress();
      } else {
        this.showAd();
      }
    }, 300);
  }

  highlightSelection(selectedIndex) {
    const options = document.querySelectorAll('.option');
    options.forEach((option, index) => {
      const isSelected = index === selectedIndex;
      option.classList.toggle('selected', isSelected);
      option.setAttribute('aria-checked', isSelected.toString());
    });
  }

  updateNavButtons() {
    this.elements.quizElements.prevButton.classList.toggle(
      'hidden', 
      this.state.currentQuestionIndex === 0
    );
  }

  updateProgress() {
    const percent = ((this.state.currentQuestionIndex + 1) / this.state.questions.length) * 100;
    this.elements.quizElements.progressFill.style.width = `${percent}%`;
    this.elements.quizElements.progressFill.setAttribute('aria-valuenow', Math.round(percent));
    this.elements.quizElements.water.style.height = `${percent}%`;
  }

  previousQuestion() {
    if (this.state.currentQuestionIndex > 0) {
      this.state.currentQuestionIndex--;
      this.displayQuestion();
      this.updateProgress();
    }
  }

  updateQuizTimer() {
    if (!this.state.startTime) return;
    
    const elapsedSeconds = Math.floor((Date.now() - this.state.startTime) / 1000);
    this.elements.quizElements.timer.textContent = this.formatTime(elapsedSeconds);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  showAd() {
    clearInterval(this.state.quizTimer);
    this.showSection('ad');
    let timer = 10;
    this.elements.adElements.timer.textContent = timer;
    
    // Clear any existing timer
    if (this.state.adTimer) {
      clearInterval(this.state.adTimer);
    }
    
    this.state.adTimer = setInterval(() => {
      timer--;
      this.elements.adElements.timer.textContent = timer;
      this.elements.adElements.timer.classList.add('pop');
      
      setTimeout(() => {
        this.elements.adElements.timer.classList.remove('pop');
      }, 400);
      
      if (timer <= 0) {
        clearInterval(this.state.adTimer);
        this.showResults();
      }
    }, 1000);
  }

  skipAd() {
    if (this.state.adTimer) {
      clearInterval(this.state.adTimer);
    }
    this.showResults();
  }

  showResults() {
    this.showSection('result');
    const result = this.calculateResult();
    
    this.elements.resultElements.resultText.innerHTML = `
      <strong>${result.text}</strong><br>
      <small>${result.description}</small>
    `;
    this.elements.resultElements.resultImage.textContent = result.emoji;
    this.elements.resultElements.scoreText.textContent = "Thanks for completing the quiz!";
    this.elements.resultElements.scoreFill.style.width = `100%`;
  }

  calculateResult() {
    const totalScore = this.state.userAnswers.reduce((sum, answer) => sum + answer, 0);
    const resultCategory = this.quizResults[this.state.currentQuiz].find(
      range => totalScore >= range.min && totalScore <= range.max
    );
    
    return {
      text: resultCategory.result,
      emoji: resultCategory.emoji,
      description: resultCategory.description
    };
  }

  async shareResults() {
    const result = this.calculateResult();
    
    const shareData = {
      title: `My ${this.state.currentQuiz.replace('_', ' ')} Quiz Result`,
      text: `${result.text}\n${result.description}\n\nTry the quiz yourself!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.text);
        this.showToast('Result copied to clipboard!', 'success');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareData.text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showToast('Result copied to clipboard!', 'success');
      }
    } catch (err) {
      console.error('Sharing failed:', err);
      if (err.name !== 'AbortError') {
        this.showToast('Sharing failed. Please try again.', 'error');
      }
    }
  }

  quitQuiz() {
    if (confirm('Are you sure you want to quit the quiz? Your progress will be lost.')) {
      this.resetQuizState();
      this.showSection('home');
    }
  }

  retakeQuiz() {
    this.resetQuizState();
    this.showSection('home');
  }

  resetQuizState() {
    this.state = {
      ...this.state,
      currentQuestionIndex: 0,
      userAnswers: [],
      startTime: null
    };
    
    this.elements.quizElements.water.style.height = '0%';
    this.elements.quizElements.progressFill.style.width = '0%';
    
    if (this.state.quizTimer) clearInterval(this.state.quizTimer);
    if (this.state.adTimer) clearInterval(this.state.adTimer);
  }

  submitFeedback() {
    const feedback = this.elements.feedback.input.value.trim();
    if (!feedback) {
      this.showToast("Please enter your feedback before submitting.", 'error');
      this.elements.feedback.input.focus();
      return;
    }
    
    // In a real app, you would send this to a server
    console.log('User feedback:', feedback);
    this.showToast("Thank you for your feedback!", 'success');
    this.elements.feedback.input.value = "";
  }

  showSection(sectionId) {
    Object.values(this.elements.sections).forEach(section => {
      if (section.id !== 'loading') {
        section.classList.add('hidden');
      }
    });
    
    if (sectionId && this.elements.sections[sectionId]) {
      this.elements.sections[sectionId].classList.remove('hidden');
      
      // Focus management for accessibility
      if (sectionId === 'quiz') {
        this.elements.quizElements.questionText.focus();
      } else if (sectionId === 'result') {
        this.elements.resultElements.resultText.focus();
      }
    }
    
    // Reset scroll position
    window.scrollTo(0, 0);
  }

  showLoading(show) {
    if (show) {
      this.elements.sections.loading.classList.remove('hidden');
    } else {
      this.elements.sections.loading.classList.add('hidden');
    }
  }

  showToast(message, type = '') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new QuizApp();
});