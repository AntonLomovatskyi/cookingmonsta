import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import Home from "./pages/Home";
import RecipeDetail from "./pages/RecipeDetail";
import CookMode from "./pages/CookMode";
import Import from "./pages/Import";
import Plan from "./pages/Plan";
import RecipeNew from "./pages/RecipeNew";
import Favourites from "./pages/Favourites";
import Settings from "./pages/Settings";
import Shopping from "./pages/Shopping";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: "recipe/:id", element: <RecipeDetail /> },
        { path: "recipe/:id/cook", element: <CookMode /> },
        { path: "import", element: <Import /> },
        { path: "plan", element: <Plan /> },
        { path: "shopping", element: <Shopping /> },
        { path: "recipe/new", element: <RecipeNew /> },
        { path: "favourites", element: <Favourites /> },
        { path: "settings", element: <Settings /> },
        { path: "*", element: <Home /> },
      ],
    },
  ],
  { basename },
);
