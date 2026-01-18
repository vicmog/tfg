import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/Home";
import LoginScreen from "./screens/Login";
import RegisterScreen from "./screens/Register";
import Negocios from "./screens/Negocios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type NavigationScreenList = {
  Home: undefined;
  Login: { message: string };
  Register: undefined;
  Negocios: undefined;
};

const Stack = createNativeStackNavigator<NavigationScreenList>();

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken);
    };

    loadToken();
  }, []);

  console.log("asdasdasd" + token);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <Stack.Screen name="Negocios" component={Negocios} />
      )}
    </Stack.Navigator>
  );
};

export default App;
