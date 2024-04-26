import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Platform, Image, TouchableOpacity } from 'react-native';
import { StackActions } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import {useState, useEffect, useRef, list} from 'react';
import { Camera, CameraType } from 'expo-camera';
import { useWindowDimensions } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

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
  const [targetAngle, setTargetAngle] = React.useState(Math.floor(Math.random() * 361)); // Random angle from 0 to 360
  return <View>
    <Text>Round {route.params.roundNum} !</Text>
    <Text>Your target value is...{targetAngle}° </Text>
    <Button
      title="Next"
      onPress={() =>
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'CameraScreen',
                params: {roundNum: route.params.roundNum, targetAngle}
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
  const { targetAngle } = route.params;
  const [orientationData, setOrientationData] = useState({ alpha: 0 });
  const [referenceAngle, setReferenceAngle] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (permission && permission.granted) {
        setIsReady(true);
        DeviceMotion.setUpdateInterval(500);
        const subscription = DeviceMotion.addListener(motionData => {
            if (motionData.rotation) {
                const alphaDegrees = (motionData.rotation.alpha * 180 / Math.PI + 360) % 360;
                setOrientationData({ alpha: alphaDegrees });
                console.log(`Alpha Rotation: ${alphaDegrees} degrees`);
            }
        });

        return () => subscription.remove();
    } else if (permission && !permission.granted) {
        requestPermission();
    }
}, [permission]);

const setCustomReference = () => {
  setReferenceAngle(orientationData.alpha);
  console.log(`Reference angle set at: ${orientationData.alpha} degrees`);
};

const calculateAdjustedAngle = (angle) => {
  if (referenceAngle !== null) {
    let actualAngle = angle + referenceAngle;
    if (actualAngle < 360){
      return (actualAngle - 360) * -1;
    }else{
      return (actualAngle - 720) * -1;
    }
  }
  return orientationData.alpha;
};

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>Loading or need permissions...</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraType() {
    setType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync();
        const actualAngle = calculateAdjustedAngle(orientationData.alpha);
        console.log("Photo taken", photo);
        console.log("Actual Alpha Angle:", actualAngle);
        onPictureSaved(photo, actualAngle);
    } else {
        console.log("Camera ref is not set");
    }
};

const onPictureSaved = (photo, actualAngle) => {
    console.log("Took Photo", `Actual Angle: ${actualAngle}`);
    navigation.dispatch(
        CommonActions.reset({
            index: 0,
            routes: [
                {
                    name: 'RoundEndScreen',
                    params: {
                        roundNum: route.params.roundNum,
                        prevPhoto: photo,
                        actualAngle: actualAngle,
                        targetAngle: route.params.targetAngle
                    },
                },
            ],
        })
    );
};

  // var takePhoto = async () => {
  //   console.log("Taking photo");
  //   Gyroscope.setUpdateInterval(100); // Update every 1/10th of a second
  //   const subscription = Gyroscope.addListener(gyroscopeData => {
  //       const actualAngle = Math.round(gyroscopeData.x);
  //       console.log("Current Gyro X Angle:", actualAngle);
  //       if (cameraRef.current) {
  //         cameraRef.current.takePictureAsync()
  //         .then(photo => {
  //             onPictureSaved(photo, actualAngle);
  //         })
  //         .catch(err => {
  //             console.log("Error taking photo:", err);
  //         })
  //         .finally(() => {
  //             subscription.remove(); // Ensure removal of listener
  //         });
  //     } else {
  //         console.log("Camera ref is not set");
  //         subscription.remove(); // Ensure removal of listener
  //     }
  // });

  // // Optionally remove the listener if no photo is taken after a timeout
  // setTimeout(() => {
  //     subscription.remove();
  // }, 5000);
  // }
  
  // onPictureSaved = photo => {
  //   console.log(photo);
  //   photo.name="CS402PHOTOROUND" + route.params.roundNum;
  //   console.log("Took Photo")
  //   navigation.dispatch(
  //     CommonActions.reset({
  //       index: 0,
  //       routes: [
  //         {
  //           name: 'RoundEndScreen',
  //           params: {roundNum: route.params.roundNum, 
  //                   prevPhoto: photo,
  //                   actualAngle: actualAngle,
  //                   targetAngle: route.params.targetAngle}
  //         },
  //       ],
  //     })
  //   )
  // } 
  
  var cam = <Camera style={[styles.camera, scam]} type={type}ref={cameraRef}
  >
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
    <Button title="Set Zero Angle" onPress={setCustomReference} />
  </View>;
};

const calculateScore = (actualAngle, targetAngle) => {
  const angleDifference = Math.abs(actualAngle - targetAngle);

  if (angleDifference <= 5) {
    return 1000;
  } else if (angleDifference <= 10) {
    return 950;
  } else if (angleDifference <= 15) {
    return 900;
  } else if (angleDifference <= 30) {
    return 800;
  } else if (angleDifference <= 50) {
    return 700;
  } else if (angleDifference <= 70) {
    return 600;
  } else if (angleDifference <= 90) {
    return 500;
  } else if (angleDifference <= 120) {
    return 300;
  } else if (angleDifference <= 180) {
    return 100;
  } else {
    return 0;
  }
};

const RoundEndScreen = ({navigation, route}) => {
  const SCREEN_WIDTH = useWindowDimensions().width;
  const SCREEN_HEIGHT = useWindowDimensions().height;
  const { actualAngle, targetAngle, prevPhoto } = route.params;
  const score = calculateScore(actualAngle, targetAngle);
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
    <Text>You Got: Angle {actualAngle}° - Target: {targetAngle}° - Score: {score}</Text>
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
