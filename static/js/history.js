
function animateOnScroll() {
    const elements = document.querySelectorAll('.timeline-content, .gallery-item, .feature-card, .currency-card-item, .stat-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                if (entry.target.classList.contains('timeline-content')) {
                    const timelineItem = entry.target.closest('.timeline-item');
                    if (timelineItem) {
                        const index = Array.from(timelineItem.children).indexOf(entry.target);
                        entry.target.style.animationDelay = `${index * 0.2}s`;
                    }
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(element => {
        observer.observe(element);
    });
}


function setupQuiz() {
    const options = document.querySelectorAll('.quiz-option');
    const resultDiv = document.getElementById('quiz-result');
    const resultTitle = document.getElementById('result-title');
    const resultText = document.getElementById('result-text');

    if (!options.length || !resultDiv) return;

    options.forEach(option => {
        option.addEventListener('click', function() {
            const isCorrect = this.getAttribute('data-correct') === 'true';
            const correctAnswer = "Правильно! Фунт стерлингов — самая старая валюта в мире, находящаяся в обращении с 775 года.";
            const wrongAnswer = "Неверно. Фунт стерлингов используется с 775 года, что делает его старейшей валютой в мире.";

            
            options.forEach(opt => {
                opt.classList.remove('correct', 'incorrect');
                opt.disabled = false;
            });

            
            if (isCorrect) {
                this.classList.add('correct');
                resultTitle.textContent = "Правильно! 🎉";
                resultTitle.className = "correct";
                resultText.textContent = correctAnswer;
            } else {
                this.classList.add('incorrect');
                resultTitle.textContent = "Неверно 😕";
                resultTitle.className = "incorrect";
                resultText.textContent = wrongAnswer;

                
                options.forEach(opt => {
                    if (opt.getAttribute('data-correct') === 'true') {
                        opt.classList.add('correct');
                    }
                });
            }

            
            resultDiv.classList.add('show');

            
            options.forEach(opt => {
                opt.disabled = true;
            });

            
            resultDiv.style.animation = 'fadeIn 0.5s ease';
        });
    });
}


function setupCurrencyCardsHover() {
    const currencyCards = document.querySelectorAll('.currency-card-item');

    currencyCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const image = this.querySelector('.currency-image-circle img');
            if (image) {
                image.style.transform = 'scale(1.1)';
            }

            
            this.style.transition = 'all 0.3s ease';
        });

        card.addEventListener('mouseleave', function() {
            const image = this.querySelector('.currency-image-circle img');
            if (image) {
                image.style.transform = 'scale(1)';
            }
        });
    });
}


function setupStatsCards() {
    const statCards = document.querySelectorAll('.stat-card');

    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const value = this.querySelector('.stat-value');
            if (value) {
                value.style.transform = 'scale(1.1)';
                value.style.transition = 'transform 0.3s ease';
            }
        });

        card.addEventListener('mouseleave', function() {
            const value = this.querySelector('.stat-value');
            if (value) {
                value.style.transform = 'scale(1)';
            }
        });
    });
}


function setupTimelineAnimation() {
    const timelineItems = document.querySelectorAll('.timeline-item');

    timelineItems.forEach((item, index) => {
        
        item.style.animationDelay = `${index * 0.3}s`;

        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const contents = entry.target.querySelectorAll('.timeline-content');
                    contents.forEach((content, i) => {
                        content.style.animationDelay = `${i * 0.2}s`;
                        content.classList.add('animate-in');
                    });

                    const year = entry.target.querySelector('.timeline-year');
                    if (year) {
                        year.classList.add('animate-in');
                        year.style.animationDelay = '0.4s';
                    }
                }
            });
        }, {
            threshold: 0.5
        });

        observer.observe(item);
    });
}


function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}


function setupImageLoading() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        
        img.classList.add('loading-image');

        
        if (img.complete) {
            img.classList.remove('loading-image');
            img.classList.add('loaded-image');
        } else {
            img.addEventListener('load', function() {
                this.classList.remove('loading-image');
                this.classList.add('loaded-image');
            });

            img.addEventListener('error', function() {
                this.classList.remove('loading-image');
                this.classList.add('error-image');
                
                this.src = 'data:image/svg+xml;utf8,<svg xmlns="http:
            });
        }
    });
}


function setupStatsCounter() {
    const statValues = document.querySelectorAll('.stat-value');

    statValues.forEach(statValue => {
        const originalText = statValue.textContent;
        
        const match = originalText.match(/(\d+)/);
        if (match) {
            const number = parseInt(match[0]);

            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(statValue, number, originalText);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.5
            });

            observer.observe(statValue);
        }
    });
}


function animateCounter(element, targetNumber, originalText) {
    const duration = 2000; 
    const frameDuration = 1000 / 60; 
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;

    const counter = setInterval(() => {
        frame++;

        
        const progress = frame / totalFrames;
        const currentNumber = Math.round(targetNumber * progress);

        
        element.textContent = originalText.replace(/\d+/, currentNumber);

        if (frame === totalFrames) {
            clearInterval(counter);
            element.textContent = originalText; 
        }
    }, frameDuration);
}


document.addEventListener('DOMContentLoaded', function() {
    
    document.body.classList.add('page-loaded');

    
    animateOnScroll();
    setupQuiz();
    setupCurrencyCardsHover();
    setupStatsCards();
    setupTimelineAnimation();
    setupSmoothScrolling();
    setupImageLoading();
    setupStatsCounter();

    
    addAnimationStyles();

    
    setTimeout(() => {
        document.querySelectorAll('.timeline-content, .currency-card-item, .stat-card, .feature-card').forEach((el, index) => {
            el.style.animationDelay = `${index * 0.1}s`;
            el.classList.add('animate-in');
        });
    }, 300);
});


function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeInLeft {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes fadeInRight {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes scaleIn {
            from {
                opacity: 0;
                transform: scale(0.8);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .animate-in {
            animation: fadeInUp 0.6s ease forwards;
            opacity: 0;
        }

        .timeline-content.animate-in:nth-child(odd) {
            animation-name: fadeInLeft;
        }

        .timeline-content.animate-in:nth-child(even) {
            animation-name: fadeInRight;
        }

        .stat-card.animate-in,
        .currency-card-item.animate-in {
            animation-name: scaleIn;
        }

        .loading-image {
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .loaded-image {
            opacity: 1;
            animation: fadeIn 0.5s ease;
        }

        .error-image {
            opacity: 0.5;
            filter: grayscale(100%);
        }

        .page-loaded {
            opacity: 1;
            transition: opacity 0.3s ease;
        }

       
        .timeline-year.animate-in {
            animation: scaleIn 0.6s ease forwards;
            animation-delay: 0.3s;
        }

       
        .currency-card-item:hover {
            z-index: 10;
        }

       
        .currency-symbol-badge {
            transition: all 0.3s ease;
        }

        .currency-card-item:hover .currency-symbol-badge {
            transform: rotate(360deg) scale(1.2);
            background: white;
            color: var(--primary-color);
        }
    `;

    document.head.appendChild(style);
}


window.addEventListener('error', function(e) {
    console.error('Ошибка на странице истории:', e.error);
});


let ticking = false;
window.addEventListener('scroll', function() {
    if (!ticking) {
        window.requestAnimationFrame(function() {
            
            ticking = false;
        });
        ticking = true;
    }
});


let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        
        animateOnScroll();
    }, 250);
});


if (typeof window !== 'undefined') {
    window.historyPage = {
        animateOnScroll,
        setupQuiz,
        setupCurrencyCardsHover,
        setupStatsCards,
        setupTimelineAnimation,
        setupSmoothScrolling,
        setupImageLoading,
        setupStatsCounter
    };
}

