import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';

// Navigation docs here: https://reactnavigation.org/docs/getting-started/

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'Home Page'}}
        />
        <Stack.Screen name="NewGame" component={NewGameScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
      <StatusBar style='auto'/>
    </NavigationContainer>
  );
}

const HomeScreen = ({navigation}) => {
  return (
    <View>
      <Button
        title="New Game"
        onPress={() =>
          navigation.navigate('NewGame')
        }
      />
      <Button
        title="Leaderboard"
        onPress={() =>
          navigation.navigate('About')
        }
      />
      <Button
        title="About"
        onPress={() =>
          navigation.navigate('About')
        }
      />
    </View>
  );
};

const NewGameScreen = ({navigation, route}) => {
  return <Text>Start a new game from here!</Text>;
};

const LeaderboardScreen = ({navigation, route}) => {
  return <Text>#1 | John | 999 pts...</Text>;
};

const AboutScreen = ({navigation, route}) => {
  return <Text>About Sensor Scramble!</Text>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
