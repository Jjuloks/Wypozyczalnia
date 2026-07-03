
import { router } from "expo-router";
import { useState } from "react";
import { Button, TextInput, View,StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [login,setLogin] =  useState("")
  const [haslo,setHaslo] = useState("")
  const testLogin = "admin"
  const testHaslo = "admin"

  const sprawdzDane =()=> {
    console.log(login,haslo)
  }


  const sprawdzHaslo =()=> {
    if(login === testLogin && haslo === testHaslo){
      router.replace("/(tabs)/home")
    }
    if(login !== testLogin){
      alert('Login jest niepoprawny')
    }
    if(haslo !== testHaslo){
      alert('Haslo jest nieprawidlowe')
    }
  }

  
  return (
    <View >
   <SafeAreaProvider style={styles.container}>
    <SafeAreaView>
      <label>Login</label>
      <TextInput value={login} onChangeText={val => setLogin(val)}  style={styles.inputy}></TextInput>
      <label>Hasło</label>
      <TextInput secureTextEntry={true} value={haslo} onChangeText={val => setHaslo(val)} style={styles.inputy}></TextInput>
      <TextInput></TextInput>

      <Button
        title="Zaloguj"
        onPress={()=> sprawdzHaslo()}
      />
    </SafeAreaView>
   </SafeAreaProvider>
 
   {/*  <Button
        title="Zaloguj"
        onPress={() => router.replace("/home")}
      />
      */}
    </View>


  );
};

   const styles = StyleSheet.create({inputy : {
      height : 40,
      margin: 12,
    borderWidth: 1,
    borderColor : '#000',
    padding: 10,
    
    },


    container : {
       flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    }
  })

    
    


