# Lawnr Mobile App

Flutter cross-platform mobile application for iOS and Android.

## Setup

1. Install Flutter dependencies:
```bash
flutter pub get
```

2. Configure Firebase:
   - Add `google-services.json` (Android) to `android/app/`
   - Add `GoogleService-Info.plist` (iOS) to `ios/Runner/`
   - Configure Firebase project for push notifications

3. Update API base URL:
   - Edit `lib/services/api_service.dart`
   - Change `baseUrl` to your backend URL

4. Run the app:
```bash
# iOS
flutter run -d ios

# Android
flutter run -d android
```

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── navigation/
│   └── app_router.dart      # Routing configuration
├── screens/
│   ├── auth/                # Login, register
│   ├── homeowner/          # Homeowner screens
│   ├── contractor/         # Contractor screens
│   └── notifications/      # Notification center
├── services/
│   ├── api_service.dart    # API client
│   ├── auth_service.dart   # Authentication
│   ├── media_service.dart  # Media upload
│   └── notification_service.dart # Push notifications
└── components/
    ├── media_upload_widget.dart
    └── media_gallery_widget.dart
```

## Features Implemented

- ✅ User authentication (login/register)
- ✅ Property management (add, list, view)
- ✅ Service request creation
- ✅ Quote review and acceptance
- ✅ Job tracking
- ✅ Payment processing
- ✅ Reviews and ratings
- ✅ Contractor profile setup
- ✅ Incoming requests view
- ✅ Quote submission
- ✅ Job workflow (on_way, start, complete)
- ✅ Media upload (photos/videos)
- ✅ Push notifications
- ✅ Notification center

## Branding

The app uses a bold neon-green on black theme:
- Primary color: `#00FF00` (neon green)
- Background: Black
- Text: White/Grey
- Accent: Neon green for CTAs

## Dependencies

Key dependencies:
- `provider` - State management
- `go_router` - Navigation
- `http` - API calls
- `firebase_messaging` - Push notifications
- `image_picker` - Media selection
- `google_maps_flutter` - Maps
- `geolocator` - Location services

## Development

- Use `flutter run` for development
- Hot reload is enabled
- Check `pubspec.yaml` for all dependencies

