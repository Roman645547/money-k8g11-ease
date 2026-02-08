class AboutPage {
    constructor() {
        this.init();
    }

    init() {
        this.addAnimations();
        this.setupCopyYear();
    }

    addAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.about-section').forEach(section => {
            observer.observe(section);
        });
    }

    setupCopyYear() {
        const year = new Date().getFullYear();
        const yearElement = document.querySelector('.footer-text');
        if (yearElement) {
            yearElement.innerHTML = yearElement.innerHTML.replace('Roman k8g11', `Roman k8g11 © ${year}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AboutPage();
});