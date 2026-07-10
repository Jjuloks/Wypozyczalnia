import { Tabs, useLocalSearchParams } from "expo-router";
import { View ,Text, FlatList,Image, StyleSheet} from "react-native";
import { Stack } from 'expo-router';
import { ThemedText } from "@/components/themed-text";
import  dane from "../dane.json"
import { useState } from "react";

export default function TabsLayout() {
    const [tab,setTab] = useState(dane)
    const TAB_PROMOCJE = tab.filter((elem)=> elem.promocja === true)


  
  return (
   

    <View>
      {/*PASEK FILTRÓW */}
      <ThemedText> PROMOCJE TYLKO</ThemedText>
      <FlatList data={TAB_PROMOCJE} keyExtractor={(elem)=> elem.id.toString()} numColumns={4} renderItem={({item})=> (


        <View>
            <ThemedText>{item.nazwa}</ThemedText>
            <ThemedText>{item.cena}</ThemedText>
            <ThemedText>{item.cena_po_promocji}</ThemedText>
        </View>
      )}


>

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