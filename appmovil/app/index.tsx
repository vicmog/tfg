import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/Home/Home";
import LoginScreen from "./screens/Login/Login";
import RegisterScreen from "./screens/Register/Register";
import Negocios from "./screens/Negocios/Negocios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PersonalDataEdit from "./screens/PersonalDataEdit/PersonalDataEdit";
import ValidateCode from "./screens/ValidateCode/ValidateCode";
import CrearNegocio from "./screens/CrearNegocio/CrearNegocio";
import NegocioDetail from "./screens/NegocioDetail/NegocioDetail";
import NegocioSettings from "./screens/NegocioSettings/NegocioSettings";
import NegocioUsers from "./screens/NegocioUsers/NegocioUsers";
import Clientes from "./screens/Clientes/Clientes";
import Empleados from "./screens/Empleados/Empleados";
import Servicios from "./screens/Servicios/Servicios";
import Proveedores from "./screens/Proveedores/Proveedores";
import Productos from "./screens/Productos/Productos";
import CrearProducto from "./screens/Productos/CrearProducto";
import { Negocio } from "./screens/types";

export type NavigationScreenList = {
  Home: undefined;
  Login: { message?: string };
  Register: undefined;
  ValidateCode: { id_usuario?: number; nombre_usuario?: string };
  ResetPassword: undefined;
  Negocios: undefined;
  EditarDatos: undefined;
  CrearNegocio: undefined;
  NegocioDetail: { negocio: Negocio };
  NegocioSettings: { negocio: Negocio };
  NegocioUsers: { negocio: Negocio };
  Clientes: { negocio: Negocio };
  Empleados: { negocio: Negocio };
  Servicios: { negocio: Negocio };
  Proveedores: { negocio: Negocio };
  Productos: { negocio: Negocio };
  CrearProducto: { negocio: Negocio };
};

const Stack = createNativeStackNavigator<NavigationScreenList>();

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const checkToken = async () => {
    const storedToken = await AsyncStorage.getItem("token");
    setIsAuth(!!storedToken);
    setLoading(false);
  };

  useEffect(() => {
    checkToken();
  }, []);

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuth ? (
        <>
          <Stack.Screen name="Negocios" component={Negocios} />
          <Stack.Screen name="EditarDatos" children={(props) => <PersonalDataEdit {...props} setIsAuth={setIsAuth} />}/>
          <Stack.Screen name="CrearNegocio" component={CrearNegocio} />
          <Stack.Screen name="NegocioDetail" component={NegocioDetail} />
          <Stack.Screen name="NegocioSettings" component={NegocioSettings} />
          <Stack.Screen name="NegocioUsers" component={NegocioUsers} />
          <Stack.Screen name="Clientes" component={Clientes} />
          <Stack.Screen name="Empleados" component={Empleados} />
          <Stack.Screen name="Servicios" component={Servicios} />
          <Stack.Screen name="Proveedores" component={Proveedores} />
          <Stack.Screen name="Productos" component={Productos} />
          <Stack.Screen name="CrearProducto" component={CrearProducto} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" children={(props) => <LoginScreen {...props} setIsAuth={setIsAuth} />}/>
          <Stack.Screen name="ValidateCode" children={(props) => <ValidateCode {...props} setIsAuth={setIsAuth} />}/>
          <Stack.Screen name="ResetPassword" component={require('./screens/ResetPassword/ResetPassword').default} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default App;
