import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/Home";
import LoginScreen from "./screens/Login";
import RegisterScreen from "./screens/Register";
import Negocios from "./screens/Negocios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PersonalDataEdit from "./screens/PersonalDataEdit";

export type NavigationScreenList = {
  Home: undefined;
  Login: { message?: string };
  Register: undefined;
  Negocios: undefined;
  EditarDatos: undefined;
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
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" children={(props) => <LoginScreen {...props} setIsAuth={setIsAuth} />}/>
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default App;
