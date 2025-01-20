
# Project Setup Guide

## Prerequisites
- PHP >= 8.2
- Composer
- Node.js & NPM
- MySQL/PostgreSQL database

## Installation Steps

1. **Clone the repository**
```
git clone <repository-url>
cd <project-directory>
```

2. **Install PHP dependencies**
```bash
composer install
```

3. **Install JavaScript dependencies**
```bash
npm install
```

4. **Environment Setup**
```bash
cp .env.example .env
php artisan key:generate
```

5. **Configure Database**
- Edit `.env` file and set your database credentials:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

6. **Run Migrations and Seed Database**
```bash
php artisan migrate
php artisan db:seed
```

7. **Create storage link**
```bash
php artisan storage:link
```

## Running the Application

You can run the application in two ways:

### Method 1: Using the dev script (Recommended)
This will start all necessary services concurrently:
```bash
composer dev
```

This command will start:
- Laravel development server
- Queue listener
- Log viewer
- Vite development server

### Method 2: Running services separately

In separate terminal windows:

1. **Start the Laravel development server**
```bash
php artisan serve
```

2. **Start Vite development server**
```bash
npm run dev
```

## Default Admin Account
After seeding the database, you can login with:
- Email: admin@admin.com
- Password: password

## Additional Information

- The application uses Laravel 11.x
- Frontend assets are compiled using Vite
- The project includes Tailwind CSS for styling
- Markdown support is implemented using marked.js
- DOMPurify is used for sanitizing HTML content

## Troubleshooting

If you encounter any issues:

1. Clear Laravel cache:
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

2. Rebuild node modules:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

3. Check storage permissions:
```bash
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```
