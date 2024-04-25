import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Platform, Image, TouchableOpacity } from 'react-native';
import { StackActions } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import {useState, useEffect, list} from 'react';
import { Camera, CameraType } from 'expo-camera';
import { useWindowDimensions } from 'react-native';

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
        <Stack.Screen name="RoundIntroScreen" component={RoundIntroScreen} />
        <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
        <Stack.Screen name="CameraScreen" component={CameraScreen} />
        <Stack.Screen name="RoundEndScreen" component={RoundEndScreen} />
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
          navigation.navigate('Leaderboard')
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

// Note: I'm using the CommonActions.reset to navigate to manually
// reset the sceen stack, preventing you from going backwards through 
// the rounds.

// Also used on the Results -> Leaderboard transition so that the stack 
// is set to  home -> leaderboard

const NewGameScreen = ({navigation, route}) => {
  return <View>
    <Text>Instructions:</Text>
    <Text>There will be three rounds, each with an increasing number of rules.</Text>
    <Text>Round 1: Angle/Tilt</Text>
    <Text>Round 2: + Cardinal Direction</Text>
    <Text>Round 3: + Average Camera Color</Text>
    <Button
      title="START!"
      onPress={() =>
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'RoundIntroScreen',
                params: { roundNum: '1' },
              },
            ],
          })
        )
      }
      />
  </View>;
};

const RoundIntroScreen = ({navigation, route}) => {
  return <View>
    <Text>Round {route.params.roundNum} !</Text>
    <Text>Your target values are... </Text>
    <Button
      title="Next"
      onPress={() =>
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'CameraScreen',
                params: {roundNum: route.params.roundNum}
              },
            ],
          })
        )
      }
    />
  </View>;
};

const CameraScreen = ({navigation, route}) => {
  const SCREEN_WIDTH = useWindowDimensions().width;
  const SCREEN_HEIGHT = useWindowDimensions().height;
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  var scam = {width: SCREEN_WIDTH, height: SCREEN_WIDTH*(4/3)}

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraType() {
    setType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  }

  var takePhoto = async () => {
    console.log("Taking photo");
    if (this.SnapCamera) {
      let photo = await this.SnapCamera.takePictureAsync({onPictureSaved: this.onPictureSaved});
      
    }
  }
  
  onPictureSaved = photo => {
    console.log(photo);
    photo.name="CS402PHOTOROUND" + route.params.roundNum;
    console.log("Took Photo")
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'RoundEndScreen',
            params: {roundNum: route.params.roundNum, prevPhoto: photo}
          },
        ],
      })
    )
  } 
  
  const camref = React.createRef();
  var cam = <Camera style={styles.camera, scam} type={type}ref={ref => {
        this.SnapCamera = ref;
      }}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraType}>
          <Text style={styles.text}>Flip Camera</Text>
        </TouchableOpacity>
        <View
          style={{
          alignSelf: 'center',
          flex: 1,
          alignItems: 'center',
        }}
        >
          <TouchableOpacity
            onPress={takePhoto}
            style={{
            width: 70,
            height: 70,
            top: 400,
            borderRadius: 50,
            backgroundColor: '#fff'
          }}
          />
    </View>
      </View>
    </Camera>

  return <View>
    {cam}
    <Text>Take a photo to continue!</Text>
  </View>;
};

const RoundEndScreen = ({navigation, route}) => {
  const SCREEN_WIDTH = useWindowDimensions().width;
  const SCREEN_HEIGHT = useWindowDimensions().height;
  nextButton = <Button
    title="Next Round"
    onPress={() =>
      navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'RoundIntroScreen',
                params: {roundNum: Number(route.params.roundNum)+1}
              },
            ],
          })
        )
      }
  />
  
  // If at final round, go to results page
  if (route.params.roundNum == 3){
    nextButton = <Button
    title="See Results"
    onPress={() =>
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'ResultsScreen',
              },
            ],
          })
        )
      }
    />
  }
  return <View>
    <Image style={{width: SCREEN_WIDTH, height: SCREEN_WIDTH*4/3, alignSelf:"center"}} source={{uri: route.params.prevPhoto.uri,}} />
    <Text>You Got: Angle 37.5 - Target: 40 - Score: 50</Text>
    {nextButton}
  </View>;
};

const ResultsScreen = ({navigation, route}) => {
  // Reset navigation stack so you can't go back


  return <View>
    <Text>Total Score: 2000</Text>
    <Text>Enter name:</Text>
    <Button
      title="Submit and view Leaderboard"
      onPress={() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              { name: 'Home' },
              { name: 'Leaderboard' },
            ],
          })
        );
        } 
      }
    />
  </View>;
};

const LeaderboardScreen = ({navigation, route}) => {  
  return <Text>#1 | John | 999 pts...</Text>;
};

const AboutScreen = ({navigation, route}) => {
  return <Text>About Sensor Scramble!</Text>;
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: 1000,
    height: 1000,
  },

  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
