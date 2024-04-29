import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Platform, Image, TouchableOpacity, TextInput, ScrollView, useCallback } from 'react-native';
import { StackActions } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import {useState, useEffect, useRef, list} from 'react';
import { Camera, CameraType } from 'expo-camera';
import { useWindowDimensions } from 'react-native';
import { DeviceMotion, Accelerometer } from 'expo-sensors';
import * as SplashScreen from 'expo-splash-screen';
import { useRootNavigationState } from 'expo-router'
import { AccelerometerSensor } from 'expo-sensors/build/Accelerometer';

// Navigation docs here: https://reactnavigation.org/docs/getting-started/

const Stack = createNativeStackNavigator();

var loadURL = "https://cs.boisestate.edu/~scutchin/cs402/codesnips/loadjson.php?user=teamfiveleaderboards";
var saveURL = "https://cs.boisestate.edu/~scutchin/cs402/codesnips/savejson.php?user=teamfiveleaderboards";

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
        <Stack.Screen name="AccelerometerGameScreen" component={AccelerometerGameScreen} />
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
      <Button
        title="Accelerometer Game"
        onPress={() =>
          navigation.navigate('AccelerometerGameScreen')
        }
      />
    </View>
  );
};

const AccelerometerGameScreen = ({navigation, route}) => {
  const SCREEN_WIDTH = useWindowDimensions().width;
  const SCREEN_HEIGHT = useWindowDimensions().height;
  const [xAcc, setXAcc] = useState(0.0)
  const [yAcc, setYAcc] = useState(0.0)
  const [zAcc, setZAcc] = useState(0.0)
  const [xPos, setXPos] = useState(-50.0)
  const [yPos, setYPos] = useState(50.0)

  const MOTION_SCALE = 1; // Multiplier for moving the ball
  const DRAG = 0.2; // Subtracted from acceleration every timestep
  const BALL_WIDTH = 70; // Width of ball, used for right and bottom wall calculations
  const ABSORPTION = 2; // How much to divide acceleration by when bouncing off a wall

  const [accelSubscription, setAccelSubscription] = useState(null);
  
  useEffect(() => {
      Accelerometer.setUpdateInterval(50); // Only have to update once a second since just looking at phone orientation
      _subscribeSensors()
      return () => _unsubscribeSensors();
    }, []);

    const _subscribeSensors = () => {      
      console.log("subing")

      // Accellerometer subscription
      setAccelSubscription(Accelerometer.addListener(accelData => {
        setXAcc(xAcc => xAcc + accelData.x + (Math.sign(xAcc)*-DRAG))
        setYAcc(yAcc => yAcc + accelData.y + (Math.sign(yAcc)*-DRAG))
      }));
  }

  // Update position on acceleration change
  useEffect(() => {
    setXPos(xPos-xAcc);
    if(xPos <= 0) {
      setXPos(1);
      setXAcc(0);
      setXAcc(-xAcc / ABSORPTION);
    }
    if (xPos >= SCREEN_WIDTH-BALL_WIDTH) {
      setXPos(SCREEN_WIDTH-BALL_WIDTH-1);
      setXAcc(-xAcc / ABSORPTION);
    }
  },[xAcc]);

  useEffect(() => {
    setYPos(yPos+yAcc);
    if(yPos <= 0) {
      setYPos(1);
      setYAcc(0);
      setYAcc(-yAcc / ABSORPTION);
    }
    if (yPos >= SCREEN_HEIGHT-BALL_WIDTH) {
      setYPos(SCREEN_HEIGHT-BALL_WIDTH-1);
      setYAcc(-yAcc / ABSORPTION);
    }
  },[yAcc]);

  const _unsubscribeSensors = () => {
    Accelerometer.removeAllListeners()
    setAccelSubscription(null);
  }

  function updateBallPos(accelData) {
    let aaaa = xAcc
    print(xAcc)
    setXPos(xPos => xPos+xAcc);
    setYPos(yPos => yPos+accelData.y);
  }

  return <View>
    <View style={styles.infoPanel}>
        <Text>Current Accelerometer:</Text>
        <Text>x: {xAcc}</Text>
        <Text>y: {yAcc}</Text>
        <Text>z: {zAcc}</Text>
        <Text>xPos: {xPos}</Text>
        <Text>yPos: {yPos}</Text>
    </View>
    <View style={[{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT}, styles.marbleField]}>
      <View style={[styles.marble, {transform: [{translateX: xPos*MOTION_SCALE}, {translateY: yPos*MOTION_SCALE}]}]}/>
    </View>
  </View> 
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
                params: { roundNum: 1, totalScore: 0},
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
                params: {roundNum: route.params.roundNum, targetAngle, totalScore: route.params.totalScore}
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
  const { targetAngle } = route.params;
  const [orientationData, setOrientationData] = useState({ alpha: 0 });
  const [referenceAngle, setReferenceAngle] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const cameraRef = useRef(null);
  
  var scam = {width: SCREEN_WIDTH, height: SCREEN_WIDTH*(4/3)}

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
                        targetAngle: route.params.targetAngle,
                        totalScore: route.params.totalScore
                    },
                },
            ],
        })
    );
};
  
  var cam = <Camera style={[scam]} type={type}ref={cameraRef}
  >
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraType}>
          <Text style={styles.text}>Flip Camera</Text>
        </TouchableOpacity>
        <View style={[styles.overlayLine, {transform: [{rotate: String(calculateAdjustedAngle(orientationData.alpha/2)+90) + "deg"}]}]}/>
        <Text>Current Angle: {calculateAdjustedAngle(orientationData.alpha)}</Text>
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
  console.log('Actual Angle: ' + actualAngle + ' | Target Angle: ' +  targetAngle + ' | Diff: ' + angleDifference)
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
  let score = calculateScore(actualAngle, targetAngle);
  const totalScore = (route.params.totalScore + score); // Add current round score to total
  console.log("Total Score: " + totalScore)
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
        <Text>You Got: Angle {actualAngle}° - Target: {targetAngle}° - Score: {String(score)}</Text>
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
  const [leaderboard, setLeaderboard] = useState([]); // Have to laod leaderboard to append

  console.log("Final score: " + totalScore)
  
  useEffect(() => {
    // Load current leaderboard
    fetchLeaderboard(loadURL, setLeaderboard);
  }, []);
  
  const handleSubmit = async () => {
    console.log("Attempting to submit: Name: " + name + " Score: " + totalScore)

    try {
      // Append current entry
      // (This took so long to get working properly for some reason, using the same method from the hw
      // wasn't working for me, but this does work.)
      const entry = [{name: name, score: totalScore}];
      const newLeaderboard = [...leaderboard, ...entry]; 
  
      console.log(newLeaderboard)

      // Save leaderboard back
      response = await fetch(saveURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLeaderboard),
      });
      if (response.ok) {
        // Set previous page to home
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              { name: 'Home' },
              { name: 'Leaderboard' },
            ],
          })
        );
      } else {
        console.error('Failed to submit score');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Total Score: {String(totalScore)}</Text>
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

// Function to fetch leaderboard from a url and set it using the given setter. 
async function fetchLeaderboard(aUrl, aSetList) {
  try {
    const response = await fetch(aUrl);
    const data = await response.json();

    const aList = [] 

    data.forEach((k) => {
      aList.push(k);
    })

    const newList = aList.map((k) => {return k})
    aSetList(newList);

  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
  }
}

const LeaderboardScreen = ({ navigation, route }) => {
  const [leaderboard, setLeaderboard] = useState([]);

  // Function just for list debug
  async function loadDefault() {
    var response = await fetch(saveURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{"name": "dale", "score": 111}, {"name": "john", "score": 222}])
      });
  }
  
  function loadData() {
    fetchLeaderboard(loadURL, setLeaderboard);
    index = 0
    newList = [];
  
    leaderboard.forEach((e, index) => {
      newList.push(
        <Text style={styles.leaderboard} key={index}> {index + 1} | {e.name} | {e.score} pts</Text>
      )
    })
    return newList
  }

  // Constanctly calling loadData() to generatate the list is DEFINITELY not the actual way
  // to handle this, but using an onReady() would cause the list to not render on first open,
  // and only on refresh, so this "works" but is slow and extremely ineffient. I spent a good
  // few hours trying to figure it out with different ready functions, loading screens, etc.
  // and coudn't end up figuring it out. 
  return (
    <ScrollView> 
      {loadData()}
      <Button title="DEBUG BACK TO SUBMIT PAGE" onPress={() => {navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'ResultsScreen', params: {totalScore: 100} },
            ],
          })
        );}}/>
      <Button
        title='DEBUG: Load default list'
        onPress={() => loadDefault()}/>
    </ScrollView>
  );
};

const AboutScreen = ({navigation, route}) => {
  return <Text>About Sensor Scramble!</Text>;
};

const styles = StyleSheet.create({
  marbleField: {
    borderColor: "orange",
    borderWidth: 10,
    alignSelf: "center",
    top:0,
    position: "absolute"
  },

  marble: {
    width: 50,
    height: 50,
    borderRadius: 50,
    color: "red",
    backgroundColor: "red",
  },

  leaderboard: {
    fontSize: 20,
  },

  overlayLine: {
    width: 50,
    height: 5,
    backgroundColor: "red",
    borderWidth: 5,
    borderColor: "yellow",
  },

  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
