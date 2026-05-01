# Stage 1: Build React frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts ./
COPY public/ public/
COPY src/ src/
COPY docs/ docs/
RUN npm run build

# Stage 2: PHP + Apache serving both frontend and API
FROM php:8.2-apache

# Fix "More than one MPM loaded" error by ensuring only prefork is enabled
# mod_php is not compatible with mpm_event or mpm_worker
RUN a2dismod mpm_event mpm_worker || true && a2enmod mpm_prefork

# Enable Apache modules
RUN a2enmod rewrite headers

# Install PHP extensions for MySQL
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Allow .htaccess overrides
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Copy the built React app
COPY --from=frontend /app/build/ /var/www/html/

# Copy the PHP API
COPY api/ /var/www/html/api/

# Create upload directories with proper permissions
RUN mkdir -p /var/www/html/api/uploads/profiles \
             /var/www/html/api/uploads/services \
             /var/www/html/api/uploads/messages_private \
    && chown -R www-data:www-data /var/www/html/api/uploads

# SPA routing: non-API, non-file requests serve index.html
RUN printf '<IfModule mod_rewrite.c>\n\
    RewriteEngine On\n\
    RewriteBase /\n\
    RewriteRule ^api/ - [L]\n\
    RewriteCond %%{REQUEST_FILENAME} !-f\n\
    RewriteCond %%{REQUEST_FILENAME} !-d\n\
    RewriteRule . /index.html [L]\n\
</IfModule>\n' > /var/www/html/.htaccess

# Entrypoint: generates db_config.php from env vars, then starts Apache
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

CMD ["docker-entrypoint.sh"]
