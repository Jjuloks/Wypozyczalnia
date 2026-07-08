
import { router } from "expo-router";
import { useState } from "react";
import { Button, TextInput, View,StyleSheet,Text,TouchableOpacity, Image, Platform, useWindowDimensions, ScrollView } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Header } from "@react-navigation/elements";
import { ThemedView } from "./components/themed-view";
import { ThemedText } from "./components/themed-text";
import { Link } from 'expo-router';

export default function LoginScreen() {

  const [adresEmail,setadresEmail] =  useState("")
  const [haslo,setHaslo] = useState("")
  const testLogin = "admin"
  const testHaslo = "admin"

  const sprawdzDane =()=> {
    console.log(adresEmail,haslo)
  }


  const sprawdzHaslo =()=> {
    if(adresEmail === testLogin && haslo === testHaslo){
      router.replace("/(tabs)/home")
    }
    if(adresEmail !== testLogin || haslo !== testHaslo){
      alert('Login lub haslo jest nieprawidlowe')
    }
    
  }


  return (
    
   <SafeAreaProvider style={styles.container}>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.loginPage}>
      {/* LEWA STRONA  */}
        <View style={styles.leftSide}>
          <View style={styles.heroImageWrapper}> 
           <Image
              source={require("../assets/logos/rentil_im.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />

            </View>
        </View>

      {/* PRAWA STRONA */}
      <ThemedView style={styles.innerContainer} >
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <Image
                  source={require("../assets/logos/rentil.png")}
                  style={styles.cardLogo}
                  resizeMode="contain"
                />

      </View>

         <ThemedText type="title" style={styles.title} >Zaloguj sie</ThemedText>

          <View style={styles.form}>
   <ThemedText style={styles.labels}>Adres e-mail</ThemedText>
      <TextInput value={adresEmail} onChangeText={val => setadresEmail(val)}   style={styles.inputs}  placeholder="Wprowadź adres e-mail"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address" />

    <ThemedText style={styles.labels}>Hasło</ThemedText>
      <TextInput secureTextEntry={true} value={haslo} onChangeText={val => setHaslo(val)} style={styles.inputs}   placeholder="Wprowadź hasło"
                  placeholderTextColor="#94A3B8" />
   
      {/* ODZYSKIWANIE KONTA, NIE PAMIETASZ HASLA ORAZ ZAPAMIETAJ MNIE */}
      <View style={styles.formOptions}>
        <TouchableOpacity style={styles.rememberRow}>
          <View style={styles.checkbox} />
            <Text style={styles.rememberText}>Zapamiętaj mnie</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>
                      Nie pamiętasz hasła?
          </Text>
        </TouchableOpacity>
      </View>


      <TouchableOpacity style={styles.btnLogin} onPress={sprawdzHaslo}  activeOpacity={0.85}>
        <Text style={styles.btnLoginText}>ZALOGUJ SIE</Text>
    </TouchableOpacity>
      </View>

     <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>lub kontynuuj przez</Text>
                <View style={styles.dividerLine} />
    </View>


     <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialButtonWrapper}> 
                    <Image source={require('../assets/icons/facebook-icon.png')} style={styles.socialIcon} resizeMode="contain">

                    </Image>
                     <Text style={styles.socialText}>Facebook</Text>
                        </TouchableOpacity>


                         <TouchableOpacity style={styles.socialButtonWrapper}> 
                    <Image source={require('../assets/icons/apple-icon.png')} style={styles.socialIcon} resizeMode="contain">
                      
                    </Image>
                     <Text style={styles.socialText}>Apple</Text>
                        </TouchableOpacity >


                         <TouchableOpacity style={styles.socialButtonWrapper}> 
                    <Image source={require('../assets/icons/google-icon.png')} style={styles.socialIcon} resizeMode="contain">

                    </Image>
                     <Text style={styles.socialText}>Google</Text>
                        </TouchableOpacity>
                        
            </View>
         <Link href="/rejestracja" dismissTo style={styles.link}> 
         <Text style={styles.linkText}>
                  Nie masz jeszcze konta?{" "}
          <Text style={styles.linkTextBlue}>Zarejestruj się</Text>
          </Text>

      </Link>
      </View>
      
      </ThemedView>
       </View>
    </SafeAreaView>
   </SafeAreaProvider>
 



  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    innerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 48,
      paddingVertical: 40,
      backgroundColor: "#F8FBFF",
    },
    card: {
      width: "100%",
      maxWidth: 600,
      backgroundColor: "#FFFFFF",
      borderRadius: 34,
      paddingHorizontal: 62,
      paddingVertical: 58,

      shadowColor: "#0F172A",
      shadowOffset: {
      width: 0,
      height: 24,
    },
    shadowOpacity: 0.09,
    shadowRadius: 40,
    elevation: 20,
    },
    title: {
      fontSize: 36,
      lineHeight: 42,
      fontWeight: '900',
      textAlign: 'left',
      marginBottom: 32,
      color: "#071536",
      letterSpacing: -0.6,
    },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  socialIcon: {
    width: 22,
    height: 22,
    marginRight : 8,
  },
  form: {
    width: '100%',
  },
  labels: {
    fontSize: 16,
    fontWeight: '600',
    color: "#0F172A",
    marginBottom: 8,
    marginLeft: 2,
  },
  inputs: {
    width: '100%',
    height: 62,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    fontSize: 17,
    color: "#0F172A",
    backgroundColor: '#fff',
    outlineStyle: "none" as any,
  },
  btnLogin: {
    backgroundColor: "#2563EB",
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 12,
  
  },
  btnLoginText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  link: {
    marginTop: 4,
    alignItems: 'center',
     textAlign: 'center',
  },
   linkText: {
    fontSize: 15,
    color: "#7B88A4",
    fontWeight: "500",
    textAlign: "center",
  },

  linkTextBlue: {
    color: "#2563EB",
    fontWeight: "700",
  },
  loginPage: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F4F8FF",
    minHeight: "100%",
  },

  leftSide: {
    flex: 1.15,
    backgroundColor: "#EEF6FF",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    minHeight: 720,
  },
   cardTop: {
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 34,
},

  cardLogo: {
   width: 220,
  height: 100,
  },
  socialButtonWrapper: {
    flex: 1,
    height: 58,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#DDE5F0",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
   safeArea: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },
  heroImageWrapper: {
  width: "100%",
  height: "100%",
  justifyContent: "center",
  alignItems: "center",
  },
  formOptions : {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -2,
    marginBottom: 22,
    gap: 12,
  },
   rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CDD7E5",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  rememberText: {
    fontSize: 14,
    color: "#66738F",
    fontWeight: "500",
  },

  forgotPassword: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
    divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 24,
    gap: 12,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },

  dividerText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "500",
  },
  socialText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },


});

    
    


