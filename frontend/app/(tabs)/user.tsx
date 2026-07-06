import { Tabs } from "expo-router";
import { View ,Text,Image, FlatList,StyleSheet,Platform} from "react-native";
import  {useState,useEffect} from "react"
import dane from  "../dane.json"
import { ThemedText } from "@/components/themed-text";
import { SymbolView } from "expo-symbols";
import { MaterialIcons } from "@expo/vector-icons";
export default function User() {
  const [katalog,setKatalog] = useState(dane)
  const kategorieMap = new Map();
  kategorieMap.set(1,"Buty")
  kategorieMap.set(2,"Elektronika")
  kategorieMap.set(3,"Narzedzia")
  kategorieMap.set(4,"Sport i rekreacja")
    const [ikonki,setIkonki] = useState<any[]>([])

 useEffect(() => {
    fetch("https://wypozyczalnia.calantris.com/cos.json")
      .then((response) => response.json())
      .then((data) => {console.log("IKONKI Z API:", data);
 setIkonki(data)})
      .catch((err) => console.log(err));
  }, [])

  const path = "wypozyczalnia.calantris.com/"
  return (
    <View style={{ flex: 1, padding: 10 }}>
     {/*głowny styl katalogu jako siatka np */}
     <View> 
        <ThemedText>KATALOG</ThemedText>
        <ThemedText>Wyszukaj ....</ThemedText>
                {/*search bar */}
        {/*głowny styl katalogu  */}
      <View>
        <ThemedText>KATEGORIE</ThemedText>
        <View>
          {/*kontener dla kategorii  */}
          
        {Array.from(kategorieMap).map(([key,val])=> (<ThemedText key={key}>{val}</ThemedText>))}
        </View>
      </View>

    <FlatList
      data={dane}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Image
            source={{ uri: item.zdjecie_url }}
            style={styles.image}
            resizeMode="cover"
          />
          
          <View >
            <Text >{item.nazwa}</Text>
            <Text >{item.status}</Text>
            <Text numberOfLines={2}>{item.opis}</Text>
          </View>
        </View>
      )}
    />

</View>
    </View>
  );
  
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 250,
  },
});