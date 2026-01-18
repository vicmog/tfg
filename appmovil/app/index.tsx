import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/Home";
import LoginScreen from "./screens/Login";
import RegisterScreen from "./screens/Register";
import Negocios from "./screens/Negocios";

export type NavigationScreenList = {
  Home: undefined;
  Login: {message:string};
  Register: undefined;
  Negocios: undefined;
};

const Stack = createNativeStackNavigator<NavigationScreenList>();

const App: React.FC = () => {
  return (
  
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Negocios" component={Negocios} />
      </Stack.Navigator>
  );
};

export default App;
