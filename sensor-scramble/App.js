import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Platform, Image, TouchableOpacity, TextInput } from 'react-native';
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
  const totalScore = (route.params.totalScore || 0) + score; // Add current round score to total
  const handleNextRound = () => {
      const nextRoundNum = Number(route.params.roundNum) + 1;
      navigation.navigate('RoundIntroScreen', {
          roundNum: nextRoundNum,
          totalScore: totalScore  // Pass updated totalScore to next round
      });
  };

  const handleFinalRoundEnd = () => {
      navigation.navigate('ResultsScreen', {
          totalScore: totalScore  // Pass final totalScore to results screen
      });
  };

  return (
    <View>
        <Image style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 4 / 3, alignSelf: "center" }} source={{ uri: route.params.prevPhoto.uri }} />
        <Text>You Got: Angle {actualAngle}° - Target: {targetAngle}° - Score: {score}</Text>
        {route.params.roundNum < 3 ? (
            <Button title="Next Round" onPress={handleNextRound} />
        ) : (
            <Button title="See Results" onPress={handleFinalRoundEnd} />
        )}
    </View>
);
};
  //   nextButton = <Button
//     title="Next Round"
//     onPress={() =>
//       navigation.dispatch(
//           CommonActions.reset({
//             index: 0,
//             routes: [
//               {
//                 name: 'RoundIntroScreen',
//                 params: {roundNum: Number(route.params.roundNum)+1,
//                         totalScore: newTotalScore}
//               },
//             ],
//           })
//         )
//       }
//   />
  
//   // If at final round, go to results page
//   if (route.params.roundNum == 3){
//     nextButton = <Button
//     title="See Results"
//     onPress={() =>
//         navigation.dispatch(
//           CommonActions.reset({
//             index: 0,
//             routes: [
//               {
//                 name: 'ResultsScreen',
//                 totalScore: totalScore, 
//               },
//             ],
//           })
//         )
//       }
//     />
//   }
//   return <View>
//     <Image style={{width: SCREEN_WIDTH, height: SCREEN_WIDTH*4/3, alignSelf:"center"}} source={{uri: route.params.prevPhoto.uri,}} />
//     <Text>You Got: Angle {actualAngle}° - Target: {targetAngle}° - Score: {score}</Text>
//     {nextButton}
//   </View>;
// };



const ResultsScreen = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const totalScore = route.params.totalScore || 0; // Safeguard against undefined totalScore

  const handleSubmit = async () => {
    try {
      const response = await fetch('https://cs.boisestate.edu/~scutchin/cs402/project/saveson.php?user=team5Leaderboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name, score: totalScore }),
      });
      if (response.ok) {
        navigation.navigate('Leaderboard');
      } else {
        console.error('Failed to submit score');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Total Score: {totalScore}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />
      <Button
        title="Submit and view Leaderboard"
        onPress={handleSubmit}
      />
    </View>
  );
};

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('https://cs.boisestate.edu/~scutchin/cs402/project/loadjson.php?user=team5Leaderboards');
        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <ScrollView>
      {leaderboard.map((entry, index) => (
        <Text key={index}>{index + 1} | {entry.name} | {entry.score} pts</Text>
      ))}
    </ScrollView>
  );
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
