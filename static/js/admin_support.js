class AdminSupportSystem {
    constructor() {
        this.elements = {
            ticketsList: document.getElementById('tickets-list'),
            refreshBtn: document.getElementById('refresh-tickets'),
            adminNameInput: document.getElementById('admin-name'),
            filterStatus: document.getElementById('filter-status'),
            filterDate: document.getElementById('filter-date'),
            applyFiltersBtn: document.getElementById('apply-filters'),
            replyModal: document.getElementById('reply-modal'),
            replyModalTitle: document.getElementById('reply-modal-title'),
            modalUserName: document.getElementById('modal-user-name'),
            modalUserEmail: document.getElementById('modal-user-email'),
            modalSubject: document.getElementById('modal-subject'),
            modalDate: document.getElementById('modal-date'),
            modalMessage: document.getElementById('modal-message'),
            replyText: document.getElementById('reply-text'),
            replyCharCount: document.getElementById('reply-char-count'),
            replyStatus: document.getElementById('reply-status'),
            modalCloseBtns: document.querySelectorAll('.modal-close, #cancel-reply'),
            submitReplyBtn: document.getElementById('submit-reply'),
            deleteTicketBtn: document.getElementById('delete-ticket')
        };

        this.apiUrl = window.location.origin;
        this.currentTicket = null;
        this.tickets = [];
        this.init();
    }

    init() {
        this.loadTickets();
        this.setupEventListeners();
        this.setupCharCounter();
        this.setupCopyYear();
    }

    async loadTickets() {
        this.showLoading();

        try {
            const response = await fetch(`${this.apiUrl}/api/support/tickets`);
            const data = await response.json();

            if (data.success) {
                this.tickets = data.tickets;
                this.applyFilters();
            } else {
                this.showError(data.error || 'Ошибка при загрузке обращений');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            this.showError('Ошибка сети. Проверьте подключение.');
        }
    }

    applyFilters() {
        let filteredTickets = [...this.tickets];

        
        const statusFilter = this.elements.filterStatus.value;
        if (statusFilter !== 'all') {
            filteredTickets = filteredTickets.filter(ticket => ticket.status === statusFilter);
        }

        
        const dateFilter = this.elements.filterDate.value;
        filteredTickets.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
        });

        this.renderTickets(filteredTickets);
    }

    renderTickets(tickets) {
        if (tickets.length === 0) {
            this.elements.ticketsList.innerHTML = `
                <div class="no-tickets">
                    <div class="no-tickets-icon">📭</div>
                    <h3>Обращений не найдено</h3>
                    <p>Нет обращений, соответствующих выбранным фильтрам</p>
                </div>
            `;
            return;
        }

        this.elements.ticketsList.innerHTML = tickets.map(ticket => this.createTicketHTML(ticket)).join('');

        
        document.querySelectorAll('.reply-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ticketId = parseInt(e.target.closest('.ticket-item').dataset.ticketId);
                this.openReplyModal(ticketId);
            });
        });
    }

    createTicketHTML(ticket) {
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

        const getSubjectText = (subject) => {
            const subjects = {
                'техническая_проблема': 'Техническая проблема',
                'вопрос_по_конвертеру': 'Вопрос по конвертеру',
                'ошибка_в_данных': 'Ошибка в данных',
                'предложение_по_улучшению': 'Предложение по улучшению',
                'другое': 'Другое'
            };
            return subjects[subject] || subject;
        };

        const hasReply = ticket.admin_reply && ticket.admin_reply.trim() !== '';

        return `
            <div class="ticket-item ${ticket.status === 'new' ? 'unread' : ''}" data-ticket-id="${ticket.id}">
                <div class="ticket-header">
                    <div class="ticket-meta">
                        <span class="ticket-id">#${ticket.id}</span>
                        <span class="ticket-status ${statusClass[ticket.status]}">
                            ${statusText[ticket.status]}
                        </span>
                        <h3 class="ticket-subject">${getSubjectText(ticket.subject)}</h3>
                    </div>
                    <div class="ticket-actions">
                        <button class="reply-button">
                            <span>${hasReply ? '✏️' : '💬'}</span>
                            ${hasReply ? 'Изменить ответ' : 'Ответить'}
                        </button>
                    </div>
                </div>

                <div class="ticket-content">
                    <div class="ticket-user">
                        <span class="user-name">${this.escapeHtml(ticket.name)}</span>
                        <span class="user-email">${this.escapeHtml(ticket.email)}</span>
                        <span class="ticket-date">${formatDate(ticket.created_at)}</span>
                    </div>

                    <div class="ticket-message">
                        ${this.escapeHtml(ticket.message)}
                    </div>
                </div>

                ${hasReply ? `
                    <div class="ticket-reply">
                        <div class="reply-header">
                            <span class="reply-admin">${ticket.admin_name || 'Администратор'}</span>
                            <span class="reply-date">Ответ: ${formatDate(ticket.updated_at)}</span>
                        </div>
                        <div class="reply-text">
                            ${this.escapeHtml(ticket.admin_reply)}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    openReplyModal(ticketId) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        this.currentTicket = ticket;

        this.elements.replyModalTitle.textContent = `Ответить на обращение #${ticket.id}`;
        this.elements.modalUserName.textContent = this.escapeHtml(ticket.name);
        this.elements.modalUserEmail.textContent = this.escapeHtml(ticket.email);
        this.elements.modalSubject.textContent = this.getSubjectText(ticket.subject);
        this.elements.modalDate.textContent = new Date(ticket.created_at).toLocaleString('ru-RU');
        this.elements.modalMessage.textContent = this.escapeHtml(ticket.message);
        this.elements.replyText.value = ticket.admin_reply || '';
        this.elements.replyStatus.value = ticket.status;

        
        this.elements.replyCharCount.textContent = this.elements.replyText.value.length;

        this.elements.replyModal.classList.add('show');
    }

    setupEventListeners() {
        
        this.elements.refreshBtn.addEventListener('click', () => this.loadTickets());

        
        this.elements.applyFiltersBtn.addEventListener('click', () => this.applyFilters());

        
        this.elements.modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.replyModal.classList.remove('show');
                this.currentTicket = null;
            });
        });

        
        this.elements.replyModal.addEventListener('click', (e) => {
            if (e.target === this.elements.replyModal) {
                this.elements.replyModal.classList.remove('show');
                this.currentTicket = null;
            }
        });

        
        this.elements.submitReplyBtn.addEventListener('click', async () => {
            await this.submitReply();
        });

        
        this.elements.deleteTicketBtn.addEventListener('click', async () => {
            await this.deleteTicket();
        });
    }

    async submitReply() {
        const adminName = this.elements.adminNameInput.value.trim();
        const replyText = this.elements.replyText.value.trim();

        if (!adminName) {
            alert('Введите ваше имя (администратора)');
            this.elements.adminNameInput.focus();
            return;
        }

        if (!replyText || replyText.length < 10) {
            alert('Ответ должен содержать не менее 10 символов');
            this.elements.replyText.focus();
            return;
        }

        try {
            this.setReplyLoading(true);

            const response = await fetch(`${this.apiUrl}/api/support/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticket_id: this.currentTicket.id,
                    admin_reply: replyText,
                    admin_name: adminName,
                    status: this.elements.replyStatus.value
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Ответ успешно отправлен!');
                this.elements.replyModal.classList.remove('show');
                this.currentTicket = null;
                this.loadTickets();
            } else {
                alert(data.error || 'Ошибка при отправке ответа');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка сети. Проверьте подключение.');
        } finally {
            this.setReplyLoading(false);
        }
    }

    async deleteTicket() {
        if (!confirm('Вы уверены, что хотите удалить это обращение? Это действие нельзя отменить.')) {
            return;
        }

        try {
            this.setReplyLoading(true);

            const response = await fetch(`${this.apiUrl}/api/support/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticket_id: this.currentTicket.id
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Обращение успешно удалено!');
                this.elements.replyModal.classList.remove('show');
                this.currentTicket = null;
                this.loadTickets();
            } else {
                alert(data.error || 'Ошибка при удалении обращения');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка сети. Проверьте подключение.');
        } finally {
            this.setReplyLoading(false);
        }
    }

    setupCharCounter() {
        this.elements.replyText.addEventListener('input', () => {
            const count = this.elements.replyText.value.length;
            this.elements.replyCharCount.textContent = count;

            if (count > 2000) {
                this.elements.replyCharCount.style.color = 'var(--error-color)';
            } else if (count > 1900) {
                this.elements.replyCharCount.style.color = 'var(--warning-color)';
            } else {
                this.elements.replyCharCount.style.color = 'var(--text-secondary)';
            }
        });
    }

    setReplyLoading(isLoading) {
        this.elements.submitReplyBtn.disabled = isLoading;
        this.elements.deleteTicketBtn.disabled = isLoading;

        if (isLoading) {
            this.elements.submitReplyBtn.textContent = 'Отправка...';
        } else {
            this.elements.submitReplyBtn.textContent = 'Отправить ответ';
        }
    }

    showLoading() {
        this.elements.ticketsList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Загрузка обращений...</p>
            </div>
        `;
    }

    showError(message) {
        this.elements.ticketsList.innerHTML = `
            <div class="no-tickets">
                <div class="no-tickets-icon">⚠️</div>
                <h3>Ошибка</h3>
                <p>${message}</p>
                <button id="retry-load" class="primary-button" style="margin-top: 1rem;">
                    Попробовать снова
                </button>
            </div>
        `;

        document.getElementById('retry-load')?.addEventListener('click', () => this.loadTickets());
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
    new AdminSupportSystem();
});