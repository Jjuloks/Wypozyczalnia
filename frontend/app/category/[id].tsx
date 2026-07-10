import { Tabs, useLocalSearchParams } from "expo-router";
import { View ,Text, FlatList,Image, StyleSheet} from "react-native";
import { Stack } from 'expo-router';
import { ThemedText } from "@/components/themed-text";
import  dane from "../dane.json"
import { useState } from "react";

export default function TabsLayout() {
    const {id} = useLocalSearchParams();
    const [tab,setTab] = useState(dane)
    const selected_category = tab.filter((item)=> item.kategoria_id.toString() === id)


  const sortowanieRosnaco =()=> {
    const new_tab = selected_category.sort((a,b)=> a.cena - b.cena)
    setTab(new_tab)
  } 

  const sortowanieMalejace =()=> {
      const new_tab = selected_category.sort((a,b)=> b.cena - a.cena)
    setTab(new_tab)
  }
  return (
   

    <View>
      {/*PASEK FILTRÓW */}
      <View>
        {/*cena od Do, cena min, cena max, ilosc stron , czy promocja, kategoria,status,nazwa */}
        {/*Ceny rosnaco, malejaco, najlepiej ocenianie , marka a-z, marka z-a */}
        <Text onPress={sortowanieRosnaco}>Cena rosnaco</Text>

           <Text onPress={sortowanieMalejace}>Cena malejaco</Text>
          
      </View>
 

      <FlatList data={selected_category} keyExtractor={(item)=>item.id.toString()}  numColumns={4} scrollEnabled={false} renderItem={({item})=> (

        <View>
            <ThemedText>{item.id}</ThemedText>
              <ThemedText>{item.nazwa}</ThemedText>
              <ThemedText>{item.cena}</ThemedText>
               <Image
                source={{ uri: item.zdjecie_url }}
                style={styles.productImage}
                resizeMode="contain"
              />
        </View>

      )}>

      </FlatList>
    </View>

  );
}

const styles = StyleSheet.create({
    productImage : {
    width: "100%",
    height: "100%",
    }
})