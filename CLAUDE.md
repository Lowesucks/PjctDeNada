# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Running
- **Start full application**: `python main.py` (starts Flask backend on http://0.0.0.0:5000)
- **Frontend development**: `cd frontend && npm start` (React dev server on http://0.0.0.0:3000)
- **Build frontend**: `cd frontend && npm run build` (creates optimized production build)
- **Frontend with HTTPS**: `cd frontend && npm run start-https`

### Testing and Linting
- **Frontend tests**: `cd frontend && npm test`
- **Lint checks**: ESLint rules configured in frontend/package.json
- **Validation commands**: `npm run lint` and `npm run typecheck` should be run after code changes

### Environment Setup
- Install Python dependencies: `pip install -r requirements.txt`
- Install frontend dependencies: `cd frontend && npm install`
- Environment file required: `.env` with `SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`, `GOOGLE_MAPS_API_KEY`

## Architecture Overview

### Application Structure
This is a **Flask + React barbershop locator application** with the following architecture:

**Backend (Flask)**: 
- **Modular structure**: `backend/` directory with separate modules for routes, models, services
- **Factory pattern**: `create_app()` in `backend/app.py` creates Flask app instances  
- **Dual serving**: Serves both API endpoints (`/api/*`) and React frontend static files
- **Configuration**: Environment-based config in `config.py` with development/production variants

**Frontend (React)**:
- **Responsive design**: Separate layouts for mobile (`<=900px`) and desktop (`>900px`)
- **Mobile-first**: Touch-optimized Google Maps integration with bottom sheet UI
- **Desktop**: Grid layout with sidebar navigation and map view
- **Theme system**: Dark/light theme context in `context/ThemeContext.js`

### Key Components
- **MapaBarberias**: Google Maps integration with custom markers and touch optimization
- **App.js**: Main component with device detection logic (`checkScreenSize()`)
- **BarberiaCard**: Reusable card component for barbershop listings
- **Authentication**: JWT-based auth with login/register modals

### Database & API Integration
- **SQLAlchemy models**: `backend/models.py` defines barbershop and user entities
- **Google Places API**: Integrated in `backend/services.py` for real barbershop data
- **Caching system**: `backend/cache_manager.py` for performance optimization
- **Structured logging**: `backend/logging_config.py` for production monitoring

### Mobile Optimization
The app heavily emphasizes mobile experience:
- **Touch-optimized maps**: Custom touch configurations in `config/mapTouchConfig.js`
- **Bottom sheet UI**: Mobile list interface with swipe gestures
- **Viewport handling**: iOS/Android specific optimizations in utilities
- **Network access**: Configured for local network access (mobile testing on same WiFi)

### Responsive Layout Logic
- **Detection**: `window.innerWidth <= 900` determines mobile vs desktop
- **CSS breakpoints**: Match JavaScript detection in `styles/desktop.css` and `styles/mobile.css`
- **Grid system**: Desktop uses CSS Grid (`app-desktop-redesign` class) with sidebar + map layout
- **Mobile sheet**: Bottom sheet component with drag gestures for barbershop listings

### Development Patterns
- **Environment variables**: All sensitive config in `.env` file, validated in `config.py`
- **Modular Flask**: Routes in `backend/routes.py`, business logic in `backend/services.py`
- **Component organization**: React components in `src/components/`, utilities in `src/utils/`
- **Styling approach**: Separate mobile/desktop CSS files, CSS custom properties for theming

### Google Maps Integration
- **API key**: Required in `REACT_APP_GOOGLE_MAPS_API_KEY` environment variable
- **Touch optimization**: Custom map configurations for mobile gestures
- **Marker clustering**: Custom icons and touch-friendly markers
- **Real-time location**: Geolocation integration for user positioning

### Production Considerations
- **Flask serving**: Backend serves built React static files from `frontend/build/`
- **CORS configuration**: Configured for local network access in development
- **Database**: SQLite by default, configurable via `DATABASE_URL`
- **Logging**: Structured logging with file rotation for production
- **Security**: JWT tokens, password hashing, input validation