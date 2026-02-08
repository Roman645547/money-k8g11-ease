class CurrencyConverter {
    constructor() {
        this.elements = {
            amount: document.getElementById('amount'),
            fromCurrency: document.getElementById('from-currency'),
            toCurrency: document.getElementById('to-currency'),
            swapBtn: document.getElementById('swap-currencies'),
            convertBtn: document.getElementById('convert-btn'),
            resultAmount: document.getElementById('result-amount'),
            exchangeRate: document.getElementById('exchange-rate'),
            conversionTime: document.getElementById('conversion-time'),
            quickBtns: document.querySelectorAll('.quick-btn')
        };

        this.apiUrl = window.location.origin;
        this.init();
    }

    formatCurrency(value, currency) {
        const formatter = new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        });
        return formatter.format(value);
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    showResult(amount, fromCurrency, toCurrency, rate, result, timestamp) {
        const fromSymbol = this.getCurrencySymbol(fromCurrency);
        const toSymbol = this.getCurrencySymbol(toCurrency);

        this.elements.resultAmount.textContent = `${result.toFixed(2)} ${toSymbol}`;
        this.elements.exchangeRate.textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
        this.elements.conversionTime.textContent = this.formatTime(timestamp);

        this.elements.resultAmount.style.color = '#10b981';
    }

    getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'RUB': '₽',
            'GBP': '£',
            'JPY': '¥',
            'CNY': '¥'
        };
        return symbols[currency] || currency;
    }

    async convertCurrency() {
        const amount = parseFloat(this.elements.amount.value);
        const fromCurrency = this.elements.fromCurrency.value;
        const toCurrency = this.elements.toCurrency.value;

        if (!amount || amount <= 0) {
            alert('Пожалуйста, введите корректную сумму');
            return;
        }

        if (fromCurrency === toCurrency) {
            this.showResult(amount, fromCurrency, toCurrency, 1, amount, new Date().toISOString());
            return;
        }

        this.setLoading(true);

        try {
            const response = await fetch(`${this.apiUrl}/api/convert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    from_currency: fromCurrency,
                    to_currency: toCurrency
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showResult(
                    data.amount,
                    data.from_currency,
                    data.to_currency,
                    data.rate,
                    data.result,
                    data.timestamp
                );
            } else {
                throw new Error(data.error || 'Ошибка конвертации');
            }
        } catch (error) {
            console.error('Ошибка конвертации:', error);
            this.elements.resultAmount.textContent = 'Ошибка';
            this.elements.resultAmount.style.color = '#ef4444';
            this.elements.exchangeRate.textContent = '—';
            this.elements.conversionTime.textContent = '—';
            alert('Ошибка при конвертации. Пожалуйста, попробуйте позже.');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        this.elements.convertBtn.disabled = isLoading;
        if (isLoading) {
            this.elements.convertBtn.innerHTML = '<span class="convert-icon">⏳</span> Конвертация...';
        } else {
            this.elements.convertBtn.innerHTML = '<span class="convert-icon">💱</span> Конвертировать';
        }
    }

    swapCurrencies() {
        const fromValue = this.elements.fromCurrency.value;
        const toValue = this.elements.toCurrency.value;

        this.elements.fromCurrency.value = toValue;
        this.elements.toCurrency.value = fromValue;

        this.convertCurrency();
    }

    setupQuickButtons() {
        this.elements.quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = btn.getAttribute('data-amount');
                const fromCurrency = btn.getAttribute('data-from');
                const toCurrency = btn.getAttribute('data-to');

                this.elements.amount.value = amount;
                this.elements.fromCurrency.value = fromCurrency;
                this.elements.toCurrency.value = toCurrency;

                this.convertCurrency();
            });
        });
    }

    init() {
        this.elements.convertBtn.addEventListener('click', () => this.convertCurrency());
        this.elements.swapBtn.addEventListener('click', () => this.swapCurrencies());

        this.elements.amount.addEventListener('input', () => this.convertCurrency());
        this.elements.fromCurrency.addEventListener('change', () => this.convertCurrency());
        this.elements.toCurrency.addEventListener('change', () => this.convertCurrency());

        this.setupQuickButtons();

        this.convertCurrency();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});