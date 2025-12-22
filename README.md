# Fanuc Robot Web Simulator

An interactive 3D simulation of a Fanuc CRX-10iA/L robot running entirely in the browser.

> **Showcase**: This project demonstrates the capabilities of the [**UnderAutomation.Fanuc**](https://github.com/underautomation/Fanuc.NET) library running client-side.

![Robot Simulator Screenshot](https://via.placeholder.com/800x450?text=Fanuc+Robot+Simulator) 
*(Replace with actual screenshot)*

## Overview

This application showcases how to leverage **WebAssembly** to run robust industrial robot kinematics directly in a web browser, without needing a backend server. 

It bridges the gap between modern web technologies and industrial automation by hosting the `.NET` based Fanuc SDK inside the browser runtime.

### Why WebAssembly?
We chose **Blazor WebAssembly** to port the existing `.NET` logic from [UnderAutomation.Fanuc](https://github.com/underautomation/Fanuc.NET) to the web. This allows us to:
- Reuse the exact same C# kinematics code used in desktop applications.
- Provide low-latency, real-time feedback (Inverse Kinematics) locally on the user's machine.
- Deploy as a purely static site (no API server required).

## Architecture

*   **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **3D Engine**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) (Three.js)
*   **Robot Core**: [.NET 9 Blazor WASM](https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor) w/ `UnderAutomation.Fanuc` SDK
*   **Visuals**: Material UI components

### How it works
1.  **Initialization**: On load, the React app initializes the Blazor runtime and "pre-warms" the kinematics library.
2.  **Interaction**: When you drag the robot handle (TCP) or use sliders, React captures the input.
3.  **Interop**: A JavaScript service calls the C# method `CalculateInverseKinematics` via `window.DotNet.invokeMethodAsync`.
4.  **Calculation**: The C# code processes the 6-axis kinematics using the Fanuc SDK (compiled to WASM).
5.  **Render**: The calculated joint angles are returned to React, updating the 3D model instantly.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- WASM Tools workload: `dotnet workload install wasm-tools`

### Installation & Run

We provide convenience scripts for Windows users.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/fanuc-demo.git
    cd fanuc-demo
    ```

2.  **Install Frontend Dependencies**:
    ```bash
    cd src/Client
    npm install
    cd ../..
    ```

3.  **Build Logic**:
    Run **`build_logic.cmd`** in the root directory.
    > *This compiles the .NET project with AOT optimizations and automatically generates the WASM files in the client's public folder.*
    > *Note: First build may take a few minutes.*

4.  **Run Simulator**:
    Run **`start_dev.cmd`** in the root directory.
    Open `http://localhost:5173` in your browser.

### Manual Build Commands
If you are on Mac/Linux or prefer manual commands:

**1. Build .NET (WASM):**
```bash
cd src/RobotLogic
dotnet publish -c Release
# The customized .csproj automatically copies files to src/Client/public/_framework
```

**2. Run Frontend:**
```bash
cd src/Client
npm run dev
```

## Performance

This project utilizes **AOT (Ahead-of-Time) Compilation** to ensure smooth performance for complex math calculations. It also implements a "Prewarm" strategy to front-load initialization costs, ensuring the simulator is responsive from the very first interaction.

## Credits

Powered by [UnderAutomation.Fanuc](https://github.com/underautomation/Fanuc.NET).