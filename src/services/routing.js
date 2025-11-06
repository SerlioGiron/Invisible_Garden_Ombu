import {
  IconHome2,
  IconLogout,
  IconUser,
  IconMessage,
  IconUsers,
  IconSparkles,
} from "@tabler/icons-react";
import Home from "../pages/Home";
import NewPost from "../pages/NewPost";
import Comunidad from "../pages/Comunidad";
import MisPosts from "../pages/MisPosts";
import Perfil from "../pages/Perfil";
import Welcome from "../pages/Welcome";

const rutas = [
  { 
    icon: IconSparkles,
    label: "Welcome",
    route: "/",
    component: Welcome,
    navbar: false
  },
  { 
    icon: IconHome2,
    label: "Home",
    route: "/home",
    component: Home,
    navbar: true
  },
  {
    label: "Community",
    route: "/comunidad",
    component: Comunidad,
    icon: IconUsers,
    navbar: true
  },
  {
    label: "My Posts",
    route: "/mis-publicaciones",
    component: MisPosts,
    icon: IconMessage,
    navbar: true
  },
  {
    label: "Profile",
    route: "/perfil",
    component: Perfil,
    icon: IconUser,
    navbar: true
  },
  // {
  //   label: "Logout",
  //   route: "/logout",
  //   component: Home,
  //   icon: IconLogout,
  //   navbar: true
  // },
  {
    label: "New Post",
    route: "/nueva-publicacion",
    component: NewPost,
    icon: IconMessage,
    navbar: false
  }
];

export default rutas;