# fragments API
A back-end REST API built with Node.js and Express.

## Setup Instructions
1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/FurqanKhurrum/fragments.git](https://github.com/FurqanKhurrum/fragments.git)
    cd fragments
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    This command installs all the necessary packages defined in the `package.json` file.

## Running the API

The `package.json` file includes several scripts to help manage and run the API:

* **`npm start`**: Runs the API server in a production-like environment.
    ```bash
    npm start
    ```
    The server will start and listen on port 8080

* **`npm run dev`**: Runs the API server using `nodemon`. This automatically restarts the server whenever you make changes to the code in the `src/` directory. It also enables debug-level logging.
    ```bash
    npm run dev
    ```

* **`npm run debug`**: Runs the API server with `nodemon` and enables Node.js debugging. We can also attach a debugger to inspect the running code. Debug-level logging is also enabled.
    ```bash
    npm run debug
    ```
    The debugger will listen on `0.0.0.0:9229`.

* **`npm run lint`**: Runs ESLint to analyze the code for potential issues and enforce code style.
    ```bash
    npm run lint
    ```
    It's best to run this before committing the code, to make sure everything's working properly.

## Health Check

Once the server is running (using any of the `npm run` commands above), you can check if it's working by sending a GET request to the root path (`/`). For example, using `curl`:

*For most operating systems (I.E: Linux):*
```bash
curl http://localhost:8080
