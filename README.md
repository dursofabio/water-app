# WaterApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.0.

## Local Development With Firestore Emulator

Use the Angular dev server for the frontend. It uses `src/environments/environment.ts`,
which connects Firestore to the emulator on `127.0.0.1:8080`.

```bash
# Terminal 1: start only the Firestore emulator
npm run emulators

# Terminal 2: seed emulator data
npm run seed

# Terminal 3: start the Angular frontend
npm start
```

Open `http://localhost:4200/dashboard`.

Do not use the Firebase Hosting emulator URL for local frontend development:
it serves the production build from `dist/`, which uses `environment.prod.ts`.

## Development server

To start only the local Angular development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
