# File Uploader Web Application

A comprehensive file management web application built with Node.js, Express, Prisma, and Passport.js. Features include user authentication, file uploads, folder management, and file sharing capabilities.

## Features

- 🔐 **User Authentication**: Secure login/registration with Passport.js
- 📁 **Folder Management**: Create, edit, delete, and organize folders hierarchically
- 📤 **File Upload**: Drag & drop file uploads with support for multiple file types
- 📥 **File Download**: Secure file download functionality
- 👁️ **File Preview**: Preview images, text files, videos, and audio files
- 🔗 **File Sharing**: Generate shareable links for folders with expiration dates
- 💾 **Database Storage**: Persistent data storage with Prisma ORM
- 🎨 **Modern UI**: Responsive design with Bootstrap and Font Awesome

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Postgres with Prisma ORM
- **Authentication**: Passport.js with local strategy
- **File Handling**: Multer middleware
- **Frontend**: EJS templates, Bootstrap 5, Font Awesome
- **Session Management**: Express-session with Redis store (production) or MemoryStore (development)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Redis (for production session management)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd file-uploader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   SESSION_SECRET="your-super-secret-session-key-change-this-in-production"
   PORT=3000
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The application will be available at `http://localhost:3000`

## Session Management

The application uses different session stores based on the environment:

### Development
- **MemoryStore**: Default Express session store (not suitable for production)
- Sessions are stored in memory and lost on server restart
- Suitable for development and testing

### Production
- **Redis Store**: Scalable session storage using Redis
- Sessions persist across server restarts
- Supports multiple server instances for horizontal scaling
- Configurable via environment variables:
  - `REDIS_HOST`: Redis server hostname (default: localhost)
  - `REDIS_PORT`: Redis server port (default: 6379)
  - `REDIS_PASSWORD`: Redis password (optional)

## Usage

### Authentication
- Register a new account at `/register`
- Login at `/login`
- Access the dashboard after successful authentication

### File Management
- **Upload Files**: Drag & drop files or click to browse
- **Organize**: Create folders and upload files to specific folders
- **View Files**: Click on file names to view details and preview
- **Download**: Use the download button to save files locally

### Folder Management
- **Create Folders**: Use the "New Folder" button in the sidebar
- **Edit Folders**: Click the edit icon on any folder
- **Delete Folders**: Click the delete icon (⚠️ This will delete all files inside)

### File Sharing
- **Share Folders**: Generate shareable links with expiration dates
- **Access Shared Content**: Anyone with the link can view shared folder contents
- **Set Expiration**: Choose how long the shared link remains active

## API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `GET /logout` - User logout

### Folders
- `GET /dashboard` - Main dashboard with folders and files
- `POST /folders` - Create new folder
- `PUT /folders/:id` - Update folder
- `DELETE /folders/:id` - Delete folder

### Files
- `POST /upload` - Upload file(s)
- `GET /files/:id` - View file details
- `GET /download/:id` - Download file

### Sharing
- `POST /folders/:id/share` - Share folder
- `GET /share/:token` - Access shared folder

## File Storage

Currently, files are stored locally in the `uploads/` directory. For production use, it's recommended to integrate with cloud storage services like:

- **Cloudinary**: Already configured in the code
- **AWS S3**: Can be easily integrated
- **Google Cloud Storage**: Another good option

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- CSRF protection with helmet
- Secure file upload validation
- User isolation (users can only access their own files)
- Secure cookies with httpOnly flag
- Environment-based cookie security settings

## Development

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Prisma Studio for database management

### Database Management
```bash
# View database in Prisma Studio
npm run db:studio

# Reset database
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name <migration_name>
```

## Production Deployment

### 1. Environment Setup
Set the following environment variables:
```env
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key-here
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### 2. Redis Setup
Install and configure Redis:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# macOS with Homebrew
brew install redis
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### 3. Database
- Use PostgreSQL or MySQL instead of SQLite
- Set up proper database backups

### 4. File Storage
- Integrate with cloud storage service
- Set up CDN for better performance

### 5. Security
- Enable HTTPS with SSL certificates
- Set secure cookie options (`secure: true`)
- Configure proper CORS settings
- Use environment variables for all sensitive data

### 6. Process Management
Use a process manager for production:
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name "file-uploader"

# Using systemd (Linux)
sudo nano /etc/systemd/system/file-uploader.service
# Add service configuration
sudo systemctl enable file-uploader
sudo systemctl start file-uploader
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository.
