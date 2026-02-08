from flask import Flask, render_template, jsonify, request
import requests
import time
from datetime import datetime
import json
import os

app = Flask(__name__)


SUPPORT_FILE = 'support_tickets.json'


class CurrencyAPI:
    def __init__(self):
        self.base_url = "https://api.exchangerate-api.com/v4/latest"
        self.cache = {}
        self.cache_time = 60

    def get_rate(self, base_currency, target_currency):
        cache_key = f"{base_currency}_{target_currency}"
        current_time = time.time()

        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if current_time - timestamp < self.cache_time:
                return cached_data

        try:
            response = requests.get(f"{self.base_url}/{base_currency}", timeout=10)
            response.raise_for_status()
            data = response.json()

            if target_currency in data['rates']:
                rate = data['rates'][target_currency]
                self.cache[cache_key] = (rate, current_time)
                return rate
            return None
        except Exception as e:
            print(f"Error: {e}")
            return None


currency_api = CurrencyAPI()


def load_support_tickets():
    """Загружает обращения поддержки из файла"""
    if os.path.exists(SUPPORT_FILE):
        try:
            with open(SUPPORT_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []


def save_support_tickets(tickets):
    """Сохраняет обращения поддержки в файл"""
    with open(SUPPORT_FILE, 'w', encoding='utf-8') as f:
        json.dump(tickets, f, ensure_ascii=False, indent=2, default=str)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/converter')
def converter():
    return render_template('converter.html')


@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/currency_history')
def currency_history():
    return render_template('currency_history.html')


@app.route('/support')
def support():
    return render_template('support.html')


@app.route('/admin/support')
def admin_support():
    return render_template('admin_support.html')


@app.route('/api/rates')
def get_rates():
    try:
        response = requests.get("https://api.exchangerate-api.com/v4/latest/USD", timeout=10)
        data = response.json()

        rates = {}
        currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'SGD', 'HKD', 'INR', 'BRL', 'MXN', 'KRW',
                      'TRY', 'ZAR', 'RUB']

        for currency in currencies:
            if currency in data['rates']:
                rates[currency.lower()] = data['rates'][currency]

        popular_pairs = {
            'usd_to_rub': rates.get('rub', 0) if 'rub' in rates else currency_api.get_rate('USD', 'RUB'),
            'eur_to_rub': currency_api.get_rate('EUR', 'RUB') if 'rub' in rates else None,
            'rub_to_usd': 1 / rates.get('rub', 1) if rates.get('rub', 0) != 0 else currency_api.get_rate('RUB', 'USD')
        }

        return jsonify({
            'success': True,
            'rates': rates,
            'popular_pairs': popular_pairs,
            'base_currency': 'USD',
            'timestamp': datetime.now().isoformat(),
            'update_time': datetime.now().strftime('%H:%M:%S')
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/all_rates')
def get_all_rates():
    try:
        response = requests.get("https://api.exchangerate-api.com/v4/latest/USD", timeout=10)
        data = response.json()

        all_currencies = {
            'USD': '🇺🇸 Доллар США',
            'EUR': '🇪🇺 Евро',
            'GBP': '🇬🇧 Фунт стерлингов',
            'JPY': '🇯🇵 Японская иена',
            'CNY': '🇨🇳 Китайский юань',
            'CAD': '🇨🇦 Канадский доллар',
            'AUD': '🇦🇺 Австралийский доллар',
            'CHF': '🇨🇭 Швейцарский франк',
            'SGD': '🇸🇬 Сингапурский доллар',
            'HKD': '🇭🇰 Гонконгский доллар',
            'INR': '🇮🇳 Индийская рупия',
            'BRL': '🇧🇷 Бразильский реал',
            'MXN': '🇲🇽 Мексиканское песо',
            'KRW': '🇰🇷 Южнокорейская вона',
            'TRY': '🇹🇷 Турецкая лира',
            'ZAR': '🇿🇦 Южноафриканский рэнд',
            'RUB': '🇷🇺 Российский рубль'
        }

        rates = {}
        for currency, name in all_currencies.items():
            if currency in data['rates']:
                rates[currency] = {
                    'rate': data['rates'][currency],
                    'name': name,
                    'flag': name.split(' ')[0]
                }

        return jsonify({
            'success': True,
            'rates': rates,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/convert', methods=['POST'])
def convert_currency():
    try:
        data = request.get_json()
        amount = float(data.get('amount', 0))
        from_currency = data.get('from_currency', 'USD')
        to_currency = data.get('to_currency', 'RUB')

        if amount <= 0:
            return jsonify({
                'success': False,
                'error': 'Сумма должна быть больше 0'
            }), 400

        if from_currency == to_currency:
            return jsonify({
                'success': True,
                'amount': amount,
                'from_currency': from_currency,
                'to_currency': to_currency,
                'rate': 1,
                'result': amount,
                'timestamp': datetime.now().isoformat()
            })

        response = requests.get(f"https://api.exchangerate-api.com/v4/latest/{from_currency}", timeout=10)
        data = response.json()

        if to_currency in data['rates']:
            rate = data['rates'][to_currency]
            result = amount * rate

            return jsonify({
                'success': True,
                'amount': amount,
                'from_currency': from_currency,
                'to_currency': to_currency,
                'rate': rate,
                'result': result,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'error': f'Не удалось получить курс {from_currency} -> {to_currency}'
            }), 400
    except ValueError:
        return jsonify({
            'success': False,
            'error': 'Неверный формат суммы'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/available_currencies')
def get_available_currencies():
    try:
        response = requests.get("https://api.exchangerate-api.com/v4/latest/USD", timeout=10)
        data = response.json()
        currencies = list(data['rates'].keys())

        currency_names = {
            'USD': '🇺🇸 Доллар США',
            'EUR': '🇪🇺 Евро',
            'GBP': '🇬🇧 Фунт стерлингов',
            'JPY': '🇯🇵 Японская иена',
            'CNY': '🇨🇳 Китайский юань',
            'CAD': '🇨🇦 Канадский доллар',
            'AUD': '🇦🇺 Австралийский доллар',
            'CHF': '🇨🇭 Швейцарский франк',
            'SGD': '🇸🇬 Сингапурский доллар',
            'HKD': '🇭🇰 Гонконгский доллар',
            'INR': '🇮🇳 Индийская рупия',
            'BRL': '🇧🇷 Бразильский реал',
            'MXN': '🇲🇽 Мексиканское песо',
            'KRW': '🇰🇷 Южнокорейская вона',
            'TRY': '🇹🇷 Турецкая лира',
            'ZAR': '🇿🇦 Южноафриканский рэнд',
            'RUB': '🇷🇺 Российский рубль'
        }

        formatted_currencies = []
        for code in currencies:
            if code in currency_names:
                formatted_currencies.append({
                    'code': code,
                    'name': currency_names[code],
                    'flag': currency_names[code].split(' ')[0]
                })

        return jsonify({
            'success': True,
            'currencies': formatted_currencies
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500



@app.route('/api/support/tickets', methods=['GET'])
def get_support_tickets():
    """Получить все обращения поддержки"""
    try:
        tickets = load_support_tickets()
        return jsonify({
            'success': True,
            'tickets': tickets
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/support/submit', methods=['POST'])
def submit_support_ticket():
    """Создать новое обращение в поддержку"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()

        
        if not name or not email or not subject or not message:
            return jsonify({
                'success': False,
                'error': 'Все поля обязательны для заполнения'
            }), 400

        
        if '@' not in email or '.' not in email:
            return jsonify({
                'success': False,
                'error': 'Введите корректный email'
            }), 400

        if len(name) < 2 or len(name) > 50:
            return jsonify({
                'success': False,
                'error': 'Имя должно быть от 2 до 50 символов'
            }), 400

        if len(message) < 10 or len(message) > 2000:
            return jsonify({
                'success': False,
                'error': 'Сообщение должно быть от 10 до 2000 символов'
            }), 400

        tickets = load_support_tickets()

        new_ticket = {
            'id': len(tickets) + 1,
            'name': name,
            'email': email,
            'subject': subject,
            'message': message,
            'status': 'new',  
            'admin_reply': '',
            'admin_name': '',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }

        tickets.append(new_ticket)
        save_support_tickets(tickets)

        return jsonify({
            'success': True,
            'message': 'Заявка успешно отправлена!',
            'ticket_id': new_ticket['id']
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/support/update', methods=['POST'])
def update_support_ticket():
    """Обновить обращение (ответить на него)"""
    try:
        data = request.get_json()
        ticket_id = data.get('ticket_id')
        admin_reply = data.get('admin_reply', '').strip()
        admin_name = data.get('admin_name', '').strip()
        status = data.get('status', 'in_progress')

        if not ticket_id:
            return jsonify({
                'success': False,
                'error': 'ID обращения обязателен'
            }), 400

        if not admin_reply:
            return jsonify({
                'success': False,
                'error': 'Ответ не может быть пустым'
            }), 400

        if len(admin_reply) < 10 or len(admin_reply) > 2000:
            return jsonify({
                'success': False,
                'error': 'Ответ должен быть от 10 до 2000 символов'
            }), 400

        tickets = load_support_tickets()

        for ticket in tickets:
            if ticket['id'] == ticket_id:
                ticket['admin_reply'] = admin_reply
                ticket['admin_name'] = admin_name
                ticket['status'] = status
                ticket['updated_at'] = datetime.now().isoformat()
                save_support_tickets(tickets)

                return jsonify({
                    'success': True,
                    'message': 'Ответ успешно отправлен!'
                })

        return jsonify({
            'success': False,
            'error': 'Заявка не найдена'
        }), 404

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/support/delete', methods=['POST'])
def delete_support_ticket():
    """Удалить обращение"""
    try:
        data = request.get_json()
        ticket_id = data.get('ticket_id')

        if not ticket_id:
            return jsonify({
                'success': False,
                'error': 'ID обращения обязателен'
            }), 400

        tickets = load_support_tickets()
        initial_length = len(tickets)

        tickets = [t for t in tickets if t['id'] != ticket_id]

        if len(tickets) == initial_length:
            return jsonify({
                'success': False,
                'error': 'Заявка не найдена'
            }), 404

        
        for i, ticket in enumerate(tickets, 1):
            ticket['id'] = i

        save_support_tickets(tickets)

        return jsonify({
            'success': True,
            'message': 'Заявка удалена!'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})


if __name__ == '__main__':
    
    if not os.path.exists(SUPPORT_FILE):
        save_support_tickets([])

    app.run(debug=True, host='0.0.0.0', port=5000)