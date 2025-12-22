#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Seed data (idempotente - usa get_or_create)
python manage.py seed_data || echo "Seed data ya existe o hubo un error menor"
