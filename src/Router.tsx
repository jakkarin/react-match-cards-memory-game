import { createBrowserRouter, RouterProvider } from "react-router-dom";

import GamePage from "@/GamePage";

const router = createBrowserRouter([
    {
        path: "",
        element: <GamePage />,
    },
    // {
    //     path: "game",
    //     element: <GamePage />,
    // },
]);

const Router = () => {
    return <RouterProvider router={router} />;
};

export default Router;