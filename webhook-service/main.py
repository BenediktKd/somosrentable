"""
Webhook Service - Simulador de leads externos
Este servicio es COMPLETAMENTE INDEPENDIENTE de Django/Next.js/PostgreSQL.
Usa solo Python puro con requests.
"""

import os
import time
import random
import logging
import requests
from datetime import datetime

# Configuracion
API_URL = os.getenv('API_URL', 'http://localhost:8000/api/leads/webhook/')
API_KEY = os.getenv('API_KEY', 'webhook-secret-key')
INTERVAL_SECONDS = int(os.getenv('INTERVAL_SECONDS', '30'))

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Datos de ejemplo para generar leads aleatorios (nombres chilenos)
FIRST_NAMES = [
    'Juan', 'Maria', 'Carlos', 'Ana', 'Pedro', 'Laura',
    'Diego', 'Sofia', 'Miguel', 'Valentina', 'Andres', 'Camila',
    'Felipe', 'Francisca', 'Sebastian', 'Catalina', 'Matias', 'Javiera',
    'Nicolas', 'Constanza', 'Rodrigo', 'Fernanda', 'Cristobal', 'Daniela'
]

LAST_NAMES = [
    'Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez',
    'Hernandez', 'Perez', 'Sanchez', 'Ramirez', 'Torres',
    'Muñoz', 'Rojas', 'Diaz', 'Reyes', 'Morales',
    'Jimenez', 'Ruiz', 'Vargas', 'Castillo', 'Soto'
]

EMAIL_DOMAINS = [
    'gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'live.cl'
]

SOURCES = [
    'facebook_ads', 'google_ads', 'instagram', 'linkedin',
    'referral_partner', 'portal_inmobiliario', 'newsletter'
]


def generate_random_lead():
    """Genera un lead aleatorio."""
    first_name = random.choice(FIRST_NAMES)
    last_name = random.choice(LAST_NAMES)
    domain = random.choice(EMAIL_DOMAINS)

    # Generar email unico
    email = f"{first_name.lower()}.{last_name.lower()}.{random.randint(100, 9999)}@{domain}"

    return {
        'email': email,
        'name': f"{first_name} {last_name}",
        'phone': f"+56 9 {random.randint(1000, 9999)} {random.randint(1000, 9999)}",
        'source': random.choice(SOURCES),
        'source_detail': f"Campaña {datetime.now().strftime('%Y%m')}",
        'notes': f"Lead generado automaticamente - {datetime.now().isoformat()}"
    }


def send_lead_to_api(lead_data):
    """Envia un lead a la API de Django."""
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
    }

    try:
        response = requests.post(
            API_URL,
            json=lead_data,
            headers=headers,
            timeout=10
        )

        if response.status_code == 201:
            logger.info(f"Lead enviado exitosamente: {lead_data['email']}")
            return True
        elif response.status_code == 409:
            logger.warning(f"Lead ya existe: {lead_data['email']}")
            return False
        else:
            logger.error(f"Error enviando lead: {response.status_code} - {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        logger.error("No se pudo conectar con la API")
        return False
    except requests.exceptions.Timeout:
        logger.error("Timeout al conectar con la API")
        return False
    except Exception as e:
        logger.error(f"Error inesperado: {str(e)}")
        return False


def main():
    """Loop principal del servicio."""
    logger.info("=" * 50)
    logger.info("Webhook Service iniciado")
    logger.info(f"API URL: {API_URL}")
    logger.info(f"Intervalo: {INTERVAL_SECONDS} segundos")
    logger.info("=" * 50)

    # Esperar a que la API este lista
    logger.info("Esperando a que la API este disponible...")
    time.sleep(15)

    while True:
        try:
            # Decidir si enviar un lead (70% probabilidad)
            if random.random() < 0.7:
                lead = generate_random_lead()
                logger.info(f"Generando lead: {lead['email']}")
                send_lead_to_api(lead)
            else:
                logger.info("Saltando este ciclo (sin lead)")

            # Esperar intervalo con variacion aleatoria
            wait_time = INTERVAL_SECONDS + random.randint(-5, 10)
            logger.info(f"Esperando {wait_time} segundos...")
            time.sleep(wait_time)

        except KeyboardInterrupt:
            logger.info("Servicio detenido por el usuario")
            break
        except Exception as e:
            logger.error(f"Error en el loop principal: {str(e)}")
            time.sleep(INTERVAL_SECONDS)


if __name__ == '__main__':
    main()
