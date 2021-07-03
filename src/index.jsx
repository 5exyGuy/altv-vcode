import ReactDOM from "react-dom";
import React from "react";
import App from "./app.jsx";
import { SnackbarProvider } from "notistack";

ReactDOM.render(
    <SnackbarProvider maxSnack={1}>
        <App />
    </SnackbarProvider>,
    document.getElementById("root")
);
