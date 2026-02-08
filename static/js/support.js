class SupportSystem {
    constructor() {
        this.elements = {
            supportForm: document.getElementById('support-form'),
            nameInput: document.getElementById('name'),
            emailInput: document.getElementById('email'),
            subjectSelect: document.getElementById('subject'),
            messageTextarea: document.getElementById('message'),
            charCount: document.getElementById('char-count'),
            clearFormBtn: document.getElementById('clear-form'),
            submitBtn: document.getElementById('submit-ticket'),
            ticketIdInput: document.getElementById('ticket-id'),
            checkStatusBtn: document.getElementById('check-status'),
            statusResult: document.getElementById('status-result'),
            resultModal: document.getElementById('result-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalMessage: document.getElementById('modal-message'),
            modalInfo: document.getElementById('modal-info'),
            modalCloseBtns: document.querySelectorAll('.modal-close, #modal-ok'),
            faqItems: document.querySelectorAll('.faq-item')
        };

        this.apiUrl = window.location.origin;
        this.init();
    }

    init() {
        this.setupFormValidation();
        this.setupCharCounter();
        this.setupFormClear();
        this.setupStatusCheck();
        this.setupFAQ();
        this.setupModal();
        this.setupCopyYear();
    }

    setupFormValidation() {
        this.elements.supportForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!this.validateForm()) {
                return;
            }

            this.setLoading(true);

            try {
                const formData = {
                    name: this.elements.nameInput.value.trim(),
                    email: this.elements.emailInput.value.trim(),
                    subject: this.elements.subjectSelect.value,
                    message: this.elements.messageTextarea.value.trim()
                };

                const response = await fetch(`${this.apiUrl}/api/support/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    this.showSuccessModal(data.ticket_id);
                    this.elements.supportForm.reset();
                    this.elements.charCount.textContent = '0';
                } else {
                    this.showErrorModal(data.error || 'Ошибка при отправке формы');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                this.showErrorModal('Ошибка сети. Проверьте подключение к интернету.');
            } finally {
                this.setLoading(false);
            }
        });
    }

    validateForm() {
        const name = this.elements.nameInput.value.trim();
        const email = this.elements.emailInput.value.trim();
        const subject = this.elements.subjectSelect.value;
        const message = this.elements.messageTextarea.value.trim();

        
        this.clearErrors();

        let isValid = true;

        if (name.length < 2 || name.length > 50) {
            this.showError(this.elements.nameInput, 'Имя должно быть от 2 до 50 символов');
            isValid = false;
        }

        if (!this.validateEmail(email)) {
            this.showError(this.elements.emailInput, 'Введите корректный email');
            isValid = false;
        }

        if (!subject) {
            this.showError(this.elements.subjectSelect, 'Выберите тему обращения');
            isValid = false;
        }

        if (message.length < 10 || message.length > 2000) {
            this.showError(this.elements.messageTextarea, 'Сообщение должно быть от 10 до 2000 символов');
            isValid = false;
        }

        return isValid;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    showError(element, message) {
        element.style.borderColor = 'var(--error-color)';

        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;
        errorDiv.style.color = 'var(--error-color)';
        errorDiv.style.fontSize = 'var(--font-size-sm)';
        errorDiv.style.marginTop = '4px';

        element.parentNode.insertBefore(errorDiv, element.nextSibling);
    }

    clearErrors() {
        
        document.querySelectorAll('.form-error').forEach(el => el.remove());

        
        [this.elements.nameInput, this.elements.emailInput,
         this.elements.subjectSelect, this.elements.messageTextarea].forEach(el => {
            el.style.borderColor = '';
        });
    }

    setupCharCounter() {
        this.elements.messageTextarea.addEventListener('input', () => {
            const count = this.elements.messageTextarea.value.length;
            this.elements.charCount.textContent = count;

            if (count > 2000) {
                this.elements.charCount.style.color = 'var(--error-color)';
            } else if (count > 1900) {
                this.elements.charCount.style.color = 'var(--warning-color)';
            } else {
                this.elements.charCount.style.color = 'var(--text-secondary)';
            }
        });
    }

    setupFormClear() {
        this.elements.clearFormBtn.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите очистить форму? Все введенные данные будут потеряны.')) {
                this.elements.supportForm.reset();
                this.elements.charCount.textContent = '0';
                this.clearErrors();
            }
        });
    }

    async setupStatusCheck() {
        this.elements.checkStatusBtn.addEventListener('click', async () => {
            const ticketId = parseInt(this.elements.ticketIdInput.value);

            if (!ticketId || ticketId < 1) {
                this.showStatusError('Введите корректный ID обращения');
                return;
            }

            this.setStatusLoading(true);

            try {
                const response = await fetch(`${this.apiUrl}/api/support/tickets`);
                const data = await response.json();

                if (data.success) {
                    const ticket = data.tickets.find(t => t.id === ticketId);

                    if (ticket) {
                        this.displayTicketStatus(ticket);
                    } else {
                        this.showStatusError('Обращение с таким ID не найдено');
                    }
                } else {
                    this.showStatusError(data.error || 'Ошибка при загрузке данных');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                this.showStatusError('Ошибка сети. Проверьте подключение.');
            } finally {
                this.setStatusLoading(false);
            }
        });
    }

    displayTicketStatus(ticket) {
        const statusText = {
            'new': 'Новый',
            'in_progress': 'В работе',
            'resolved': 'Решено'
        };

        const statusClass = {
            'new': 'status-new',
            'in_progress': 'status-in_progress',
            'resolved': 'status-resolved'
        };

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleString('ru-RU');
        };

        let html = `
            <div class="ticket-status-display">
                <div class="ticket-header">
                    <h3>Обращение #${ticket.id}</h3>
                    <span class="ticket-status ${statusClass[ticket.status]}">
                        ${statusText[ticket.status]}
                    </span>
                </div>

                <div class="ticket-details">
                    <p><strong>Тема:</strong> ${this.getSubjectText(ticket.subject)}</p>
                    <p><strong>От:</strong> ${ticket.name} (${ticket.email})</p>
                    <p><strong>Создано:</strong> ${formatDate(ticket.created_at)}</p>
                    <p><strong>Обновлено:</strong> ${formatDate(ticket.updated_at)}</p>
                </div>

                <div class="ticket-message">
                    <h4>Ваше сообщение:</h4>
                    <p>${this.escapeHtml(ticket.message)}</p>
                </div>
        `;

        if (ticket.admin_reply) {
            html += `
                <div class="admin-reply">
                    <h4>Ответ поддержки:</h4>
                    <div class="reply-meta">
                        <strong>От:</strong> ${ticket.admin_name || 'Администратор'}
                        <span class="reply-date">${formatDate(ticket.updated_at)}</span>
                    </div>
                    <p>${this.escapeHtml(ticket.admin_reply)}</p>
                </div>
            `;
        } else {
            html += `
                <div class="no-reply">
                    <p>Наше сообщение еще не обработано. Ожидайте ответа в ближайшее время.</p>
                </div>
            `;
        }

        html += `</div>`;

        this.elements.statusResult.innerHTML = html;
        this.elements.statusResult.classList.add('show');
    }

    getSubjectText(subject) {
        const subjects = {
            'техническая_проблема': 'Техническая проблема',
            'вопрос_по_конвертеру': 'Вопрос по конвертеру',
            'ошибка_в_данных': 'Ошибка в данных',
            'предложение_по_улучшению': 'Предложение по улучшению',
            'другое': 'Другое'
        };
        return subjects[subject] || subject;
    }

    showStatusError(message) {
        this.elements.statusResult.innerHTML = `
            <div class="status-error">
                <h3>Ошибка</h3>
                <p>${message}</p>
            </div>
        `;
        this.elements.statusResult.classList.add('show');
    }

    setupFAQ() {
        this.elements.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                item.classList.toggle('active');
                const toggle = item.querySelector('.faq-toggle');
                toggle.textContent = item.classList.contains('active') ? '−' : '+';
            });
        });
    }

    setupModal() {
        this.elements.modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.resultModal.classList.remove('show');
            });
        });

        
        this.elements.resultModal.addEventListener('click', (e) => {
            if (e.target === this.elements.resultModal) {
                this.elements.resultModal.classList.remove('show');
            }
        });
    }

    showSuccessModal(ticketId) {
        this.elements.modalTitle.textContent = 'Успешно!';
        this.elements.modalTitle.style.color = 'var(--success-color)';
        this.elements.modalMessage.textContent = 'Ваше обращение успешно отправлено.';

        this.elements.modalInfo.innerHTML = `
            <div class="ticket-info-modal">
                <p><strong>ID обращения:</strong> ${ticketId}</p>
                <p><strong>Запомните этот номер</strong> для проверки статуса.</p>
                <p>Мы ответим вам в течение 24 часов.</p>
            </div>
        `;

        this.elements.resultModal.classList.add('show');
    }

    showErrorModal(message) {
        this.elements.modalTitle.textContent = 'Ошибка!';
        this.elements.modalTitle.style.color = 'var(--error-color)';
        this.elements.modalMessage.textContent = message;
        this.elements.modalInfo.innerHTML = '';

        this.elements.resultModal.classList.add('show');
    }

    setLoading(isLoading) {
        this.elements.submitBtn.disabled = isLoading;
        if (isLoading) {
            this.elements.submitBtn.innerHTML = '<span class="button-icon">⏳</span> Отправка...';
        } else {
            this.elements.submitBtn.innerHTML = '<span class="button-icon">📨</span> Отправить обращение';
        }
    }

    setStatusLoading(isLoading) {
        this.elements.checkStatusBtn.disabled = isLoading;
        if (isLoading) {
            this.elements.checkStatusBtn.innerHTML = 'Загрузка...';
        } else {
            this.elements.checkStatusBtn.innerHTML = 'Проверить';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
    new SupportSystem();
});