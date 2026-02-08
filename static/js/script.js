class CurrencyApp {
    constructor() {
        this.elements = {
            currencyCards: document.getElementById('currency-cards'),
            loadingSpinner: document.getElementById('loading-spinner'),
            searchInput: document.getElementById('currency-search'),
            refreshAllBtn: document.getElementById('refresh-all-btn'),
            updateTime: document.getElementById('update-time'),
            statusMessage: document.getElementById('status-message'),
            usdRubRate: document.getElementById('usd-rub-rate'),
            eurRubRate: document.getElementById('eur-rub-rate'),
            rubUsdRate: document.getElementById('rub-usd-rate'),
            eurUsdRate: document.getElementById('eur-usd-rate')
        };

        this.apiUrl = window.location.origin;
        this.allRates = {};
        this.init();
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    showMessage(text, type = 'info') {
        this.elements.statusMessage.textContent = text;
        this.elements.statusMessage.className = `status-message ${type}`;

        if (type !== 'error') {
            setTimeout(() => {
                this.elements.statusMessage.textContent = '';
                this.elements.statusMessage.className = 'status-message';
            }, 5000);
        }
    }

    createCurrencyCard(currencyCode, currencyName, rate, flag) {
        const card = document.createElement('div');
        card.className = 'currency-card';
        card.dataset.currency = currencyCode.toLowerCase();

        const formattedRate = rate.toFixed(4);

        card.innerHTML = `
            <div class="card-header">
                <div class="currency-info">
                    <span class="currency-flag">${flag}</span>
                    <div>
                        <h2 class="currency-name">${currencyName.replace(flag, '').trim()}</h2>
                        <span class="currency-code">${currencyCode}</span>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="currency-rate">${formattedRate}</div>
                <p class="currency-label">за 1 USD</p>
            </div>
        `;

        return card;
    }

    async loadAllRates() {
        try {
            this.elements.loadingSpinner.style.display = 'block';
            this.showMessage('Загрузка курсов валют...', 'info');

            const response = await fetch(`${this.apiUrl}/api/all_rates`);

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.rates) {
                this.allRates = data.rates;
                this.renderCurrencyCards();
                this.updatePopularPairs();
                this.elements.updateTime.textContent = `Последнее обновление: ${this.formatTime(data.timestamp)}`;
                this.showMessage('Курсы валют успешно загружены', 'success');
            } else {
                throw new Error(data.error || 'Неверный формат данных');
            }

            return true;
        } catch (error) {
            console.error('Ошибка при загрузке курсов:', error);
            this.showMessage('Ошибка при загрузке данных', 'error');
            this.renderErrorState();
            return false;
        } finally {
            this.elements.loadingSpinner.style.display = 'none';
        }
    }

    renderCurrencyCards() {
        this.elements.currencyCards.innerHTML = '';

        const currencies = Object.entries(this.allRates).sort((a, b) => a[0].localeCompare(b[0]));

        currencies.forEach(([code, data]) => {
            const card = this.createCurrencyCard(code, data.name, data.rate, data.flag);
            this.elements.currencyCards.appendChild(card);
        });
    }

    renderErrorState() {
        this.elements.currencyCards.innerHTML = `
            <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: var(--space-xl);">
                <div style="font-size: 3rem; margin-bottom: var(--space-md);">😕</div>
                <h3 style="color: var(--error-color); margin-bottom: var(--space-sm);">Ошибка загрузки данных</h3>
                <p style="color: var(--text-secondary);">Пожалуйста, попробуйте обновить страницу</p>
            </div>
        `;
    }

    updatePopularPairs() {
        if (this.allRates.RUB && this.allRates.USD && this.allRates.EUR) {
            this.elements.usdRubRate.textContent = this.allRates.RUB.rate.toFixed(2);
            this.elements.eurRubRate.textContent = (this.allRates.RUB.rate / this.allRates.EUR.rate).toFixed(2);
            this.elements.rubUsdRate.textContent = (1 / this.allRates.RUB.rate).toFixed(4);
            this.elements.eurUsdRate.textContent = this.allRates.EUR.rate.toFixed(4);
        }
    }

    filterCurrencies(searchTerm) {
        const cards = this.elements.currencyCards.querySelectorAll('.currency-card');
        const term = searchTerm.toLowerCase().trim();

        cards.forEach(card => {
            const currencyCode = card.dataset.currency;
            const currencyName = card.querySelector('.currency-name').textContent.toLowerCase();
            const code = card.querySelector('.currency-code').textContent.toLowerCase();

            if (currencyName.includes(term) || code.includes(term)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    async refreshAllData() {
        this.elements.refreshAllBtn.disabled = true;
        const originalText = this.elements.refreshAllBtn.innerHTML;
        this.elements.refreshAllBtn.innerHTML = '<span class="refresh-icon">⏳</span> Обновление...';

        const success = await this.loadAllRates();

        setTimeout(() => {
            this.elements.refreshAllBtn.disabled = false;
            this.elements.refreshAllBtn.innerHTML = originalText;
        }, 1000);

        return success;
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            if (!response.ok) {
                throw new Error('Сервер недоступен');
            }
        } catch (error) {
            console.warn('Проблема с сервером:', error);
        }
    }

    init() {
        this.loadAllRates();

        setInterval(() => this.loadAllRates(), 60000);

        this.elements.refreshAllBtn.addEventListener('click', () => this.refreshAllData());

        this.elements.searchInput.addEventListener('input', (e) => {
            this.filterCurrencies(e.target.value);
        });

        this.checkHealth();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CurrencyApp();
});