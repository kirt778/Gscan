# Welcome to GSCAN 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## ABOUT THE APP

# Gscan

A fast, lightweight scanning application built to capture, process, and organize documents and visual data cleanly.

## Features
- **Document & Image Capture:** High-clarity scanning with automatic edge detection and perspective correction.
- **Image Enhancement:** Built-in contrast, grayscale, and sharpening filters for legible exports.
- **Export & Sharing:** Save and export scans into clean, shareable formats (PDF / PNG / JPEG).
- **Local-First Workflow:** Fast on-device processing without unnecessary bloat.

## Tech Stack
- **Frontend / App:** *(e.g., React Native / Expo / Python)*
- **Processing / Backend:** *(e.g., OpenCV / FastAPI / Tesseract OCR)*

## Getting Started

### Prerequisites
- Git (configured with SSH)
- *(Add your runtime here, e.g., Node.js 20+ or Python 3.11+)*

### Installation

1. **Clone the repository via SSH:**
   ```bash
   git clone git@github.com:<your-username>/gscan.git
   cd gscan
   ```

2. **Install dependencies:**
   ```bash
   # For Python projects:
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

   # For Node / React Native projects:
   npm install
   ```

3. **Run the app:**
   ```bash
   # Add your start command here (e.g., npx expo start or python main.py)
   ```

## Project Structure
```text
gscan/
├── src/               # Core application source code
├── assets/            # Icons, splash screens, and static resources
├── .gitignore         # Ignored build artifacts, venvs, and macOS files
└── README.md          # Project documentation
```

## License
This project is open-source and available under the [MIT License](LICENSE).
