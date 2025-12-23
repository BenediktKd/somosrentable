"""
Comando para crear datos iniciales de la plataforma.
Crea 3 ejecutivos/admins y proyectos de ejemplo.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.users.models import User
from apps.projects.models import Project


class Command(BaseCommand):
    help = 'Crea datos iniciales: 3 ejecutivos y proyectos de ejemplo'

    def handle(self, *args, **options):
        self.stdout.write('Creando datos iniciales...\n')

        # Crear ejecutivos/admins
        executives = self.create_executives()

        # Crear proyectos de ejemplo
        projects = self.create_projects(executives[0])

        self.stdout.write(self.style.SUCCESS(
            f'\nDatos creados exitosamente:\n'
            f'- {len(executives)} ejecutivos\n'
            f'- {len(projects)} proyectos\n'
        ))

    def create_executives(self):
        """Crea 3 ejecutivos/admins."""
        executives_data = [
            {
                'email': 'ejecutivo1@somosrentable.com',
                'first_name': 'María',
                'last_name': 'González',
                'phone': '+56 9 1234 5678',
            },
            {
                'email': 'ejecutivo2@somosrentable.com',
                'first_name': 'Carlos',
                'last_name': 'Rodríguez',
                'phone': '+56 9 2345 6789',
            },
            {
                'email': 'ejecutivo3@somosrentable.com',
                'first_name': 'Ana',
                'last_name': 'Martínez',
                'phone': '+56 9 3456 7890',
            },
        ]

        executives = []
        for data in executives_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'phone': data['phone'],
                    'role': User.Role.EXECUTIVE,
                    'is_staff': True,
                    'is_kyc_verified': True,
                }
            )
            if created:
                user.set_password('ejecutivo123')
                user.save()
                self.stdout.write(f'  Ejecutivo creado: {data["email"]}')
            else:
                self.stdout.write(f'  Ejecutivo ya existe: {data["email"]}')
            executives.append(user)

        # Crear superadmin
        admin, created = User.objects.get_or_create(
            email='admin@somosrentable.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'SomosRentable',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_kyc_verified': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(f'  Admin creado: admin@somosrentable.com')
        else:
            self.stdout.write(f'  Admin ya existe: admin@somosrentable.com')

        return executives

    def create_projects(self, created_by):
        """Crea proyectos de ejemplo."""
        now = timezone.now().date()

        projects_data = [
            {
                'title': 'Edificio Aurora - Las Condes',
                'slug': 'edificio-aurora-las-condes',
                'short_description': 'Proyecto residencial premium en el corazón de Las Condes con excelente conectividad.',
                'description': '''
Edificio Aurora es un proyecto residencial de alto estándar ubicado en Las Condes,
Santiago. Cuenta con 120 departamentos de 1 a 3 dormitorios, áreas verdes,
gimnasio, piscina y sala multiuso.

Características destacadas:
- Ubicación privilegiada a pasos del metro
- Terminaciones de primera calidad
- Áreas comunes equipadas
- Estacionamientos y bodegas disponibles
- Certificación energética

El proyecto se encuentra en etapa de construcción con entrega estimada para 2025.
                ''',
                'location': 'Las Condes, Santiago',
                'address': 'Av. Apoquindo 4500, Las Condes',
                'target_amount': Decimal('500000000'),
                'minimum_investment': Decimal('5000000'),
                'current_amount': Decimal('125000000'),
                'annual_return_rate': Decimal('12.5'),
                'duration_months': 12,
                'status': Project.Status.FUNDING,
                'is_featured': True,
                'main_image_url': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
            },
            {
                'title': 'Condominio Vista Mar - Viña del Mar',
                'slug': 'condominio-vista-mar-vina',
                'short_description': 'Exclusivo condominio frente al mar con vista panorámica al océano Pacífico.',
                'description': '''
Condominio Vista Mar ofrece una experiencia de vida única frente al océano Pacífico.
Ubicado en Viña del Mar, este proyecto combina lujo, comodidad y una vista inigualable.

Características:
- Vista panorámica al mar
- Acceso directo a la playa
- Departamentos de 2 a 4 dormitorios
- Piscina infinity
- Spa y gimnasio
- Seguridad 24/7
                ''',
                'location': 'Viña del Mar, Valparaíso',
                'address': 'Av. Perú 100, Viña del Mar',
                'target_amount': Decimal('800000000'),
                'minimum_investment': Decimal('10000000'),
                'current_amount': Decimal('320000000'),
                'annual_return_rate': Decimal('14.0'),
                'duration_months': 12,
                'status': Project.Status.FUNDING,
                'is_featured': True,
                'main_image_url': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
            },
            {
                'title': 'Centro Comercial Plaza Norte - Huechuraba',
                'slug': 'plaza-norte-huechuraba',
                'short_description': 'Centro comercial de última generación en zona de alto crecimiento.',
                'description': '''
Plaza Norte es un moderno centro comercial ubicado en Huechuraba,
una de las zonas de mayor crecimiento de Santiago.

El proyecto contempla:
- 50,000 m² de área comercial
- 200 locales comerciales
- Patio de comidas con 30 restaurantes
- Cine multiplex
- Estacionamientos para 2,000 vehículos
- Acceso directo desde Américo Vespucio
                ''',
                'location': 'Huechuraba, Santiago',
                'address': 'Av. Américo Vespucio Norte 1500',
                'target_amount': Decimal('1200000000'),
                'minimum_investment': Decimal('20000000'),
                'current_amount': Decimal('480000000'),
                'annual_return_rate': Decimal('15.5'),
                'duration_months': 12,
                'status': Project.Status.FUNDING,
                'is_featured': False,
                'main_image_url': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
            },
            {
                'title': 'Bodega Industrial - Pudahuel',
                'slug': 'bodega-industrial-pudahuel',
                'short_description': 'Centro logístico clase A cerca del aeropuerto internacional.',
                'description': '''
Centro de distribución y bodegaje de última generación ubicado estratégicamente
cerca del Aeropuerto Internacional de Santiago.

Especificaciones:
- 25,000 m² de bodegaje
- Altura libre de 12 metros
- Andenes de carga para 40 camiones
- Sistema contra incendios certificado
- Certificación LEED
- Oficinas administrativas incluidas
                ''',
                'location': 'Pudahuel, Santiago',
                'address': 'Camino Lo Boza 500, Pudahuel',
                'target_amount': Decimal('600000000'),
                'minimum_investment': Decimal('15000000'),
                'current_amount': Decimal('600000000'),
                'annual_return_rate': Decimal('11.0'),
                'duration_months': 12,
                'status': Project.Status.FUNDED,
                'is_featured': False,
                'main_image_url': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
            },
        ]

        projects = []
        for data in projects_data:
            project, created = Project.objects.get_or_create(
                slug=data['slug'],
                defaults={
                    **data,
                    'created_by': created_by,
                    'funding_start_date': now - timedelta(days=30),
                    'funding_end_date': now + timedelta(days=60),
                }
            )
            if created:
                self.stdout.write(f'  Proyecto creado: {data["title"]}')
            else:
                # Actualizar imagen si no tiene
                if not project.main_image_url and data.get('main_image_url'):
                    project.main_image_url = data['main_image_url']
                    project.save()
                    self.stdout.write(f'  Proyecto actualizado con imagen: {data["title"]}')
                else:
                    self.stdout.write(f'  Proyecto ya existe: {data["title"]}')
            projects.append(project)

        return projects
