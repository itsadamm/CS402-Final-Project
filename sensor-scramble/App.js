import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Platform, Image, TouchableOpacity, TextInput, ScrollView, useCallback, ImageBackground } from 'react-native';
import { StackActions } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import {useState, useEffect, useRef, list} from 'react';
import { Camera, CameraType } from 'expo-camera';
import { useWindowDimensions } from 'react-native';
import { DeviceMotion, Accelerometer } from 'expo-sensors';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import { useRootNavigationState } from 'expo-router'
import { AccelerometerSensor } from 'expo-sensors/build/Accelerometer';

// Navigation docs here: https://reactnavigation.org/docs/getting-started/

const Stack = createNativeStackNavigator();

var cameraGameLoadURL = "https://cs.boisestate.edu/~scutchin/cs402/codesnips/loadjson.php?user=teamfiveleaderboards";
var cameraGameSaveURL = "https://cs.boisestate.edu/~scutchin/cs402/codesnips/savejson.php?user=teamfiveleaderboards";

var marbleGameLoadURL = "https://cs.boisestate.edu/~scutchin/cs402/codesnips/loadjson.php?user=teamfiveleaderboardstwo";
var marbleGameSaveURL = "https://cs.boisestate.edu/~scutchin/cs402/codesnips/savejson.php?user=teamfiveleaderboardstwo";


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'Home Page', headerShown: false}}
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
    <View style={styles.container}>
      <ImageBackground source={require('./assets/paper2.png')} resizeMode="cover" style={styles.image}>
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', flex: 1}}>
          <Image style={{width: 500, height: 200, resizeMode: "center"}} source={require('./assets/sensorscramblelogo.png')}/>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() =>
              navigation.navigate('NewGame', {loadURL: cameraGameLoadURL, saveURL: cameraGameSaveURL})
            }
          >
            <Text style={styles.menuButtonText}>Camera Tilt Game</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButtonSmall}
            onPress={() =>
              navigation.navigate('Leaderboard', {loadURL: cameraGameLoadURL, saveURL: cameraGameSaveURL})
            }
            >
            <Text style={styles.menuButtonText}>Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() =>
              navigation.navigate('AccelerometerGameScreen', {loadURL: marbleGameLoadURL, saveURL: marbleGameSaveURL})
            }
            >
            <Text style={styles.menuButtonText}>Accelerometer Game</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButtonSmall}
            onPress={() =>
              navigation.navigate('Leaderboard', {loadURL: marbleGameLoadURL, saveURL: marbleGameSaveURL})
            }
            >
            <Text style={styles.menuButtonText}>Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButtonSmall}
            onPress={() =>
              navigation.navigate('About')
            }
            >
            <Text style={styles.menuButtonText}>About</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const AccelerometerGameScreen = ({navigation, route}) => {
  const SCREEN_WIDTH = useWindowDimensions().width;
  const SCREEN_HEIGHT = useWindowDimensions().height * .905;
  const [xAcc, setXAcc] = useState(0.0)
  const [yAcc, setYAcc] = useState(0.0)
  const [xPos, setXPos] = useState(-50.0)
  const [yPos, setYPos] = useState(50.0)

  const [scoreZone, setScoreZone] = useState({x: 100, y: 100})
  const [totalScore, setTotalScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false) // Timer

  const MOTION_SCALE = 1; // Multiplier for moving the ball
  const DRAG = 0.1; // Subtracted from acceleration every timestep
  const BALL_WIDTH = 70; // Width of ball, used for right and bottom wall calculations
  const ABSORPTION = 2; // How much to divide acceleration by when bouncing off a wall
  const UPDATE_FREQ = 20; 
  const SCORE_ZONE_SIZE = 50;
  const TIMER_DURAION = 3;

  const [accelSubscription, setAccelSubscription] = useState(null);
  
  useEffect(() => {
      Accelerometer.setUpdateInterval(UPDATE_FREQ); // Only have to update once a second since just looking at phone orientation
      _subscribeSensors()
      return () => _unsubscribeSensors();
    }, []);

    const _subscribeSensors = () => {      
      // Accellerometer subscription
      setAccelSubscription(Accelerometer.addListener(accelData => {
        let adjustedX = accelData.x;
        let adjustedY = accelData.y;
    
        // Check the platform and invert values if it's iOS
        if (Platform.OS === 'ios') {
          adjustedX = -adjustedX;
          adjustedY = -adjustedY;
        }

        setXAcc(xAcc => xAcc + adjustedX + (Math.sign(xAcc)*-DRAG))
        setYAcc(yAcc => yAcc + adjustedY + (Math.sign(yAcc)*-DRAG))
      }));
  }

  // Update position on acceleration change
  useEffect(() => {
    if (isPlaying) {
      // Update Location
      setXPos(xPos-xAcc);
      setYPos(yPos+yAcc);
  
      // Colision checks
      if(xPos <= 0) {
        setXPos(1);
        setXAcc(0);
        setXAcc(-xAcc / ABSORPTION);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      }
      if (xPos >= SCREEN_WIDTH-BALL_WIDTH) {
        setXPos(SCREEN_WIDTH-BALL_WIDTH-1);
        setXAcc(-xAcc / ABSORPTION);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      }
      if(yPos <= 0) {
        setYPos(1);
        setYAcc(0);
        setYAcc(-yAcc / ABSORPTION);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      }
      if (yPos >= SCREEN_HEIGHT-BALL_WIDTH) {
        setYPos(SCREEN_HEIGHT-BALL_WIDTH-1);
        setYAcc(-yAcc / ABSORPTION);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      }
  
      // Score Checks
      if (Math.abs(xPos - scoreZone.x) < SCORE_ZONE_SIZE && Math.abs(yPos - scoreZone.y) < SCORE_ZONE_SIZE) {
        setTotalScore(totalScore => totalScore + 100)
        respawnScoreZone()
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      }
    } else {
      setXPos(30)
      setYPos(30)
      setXAcc(0)
      setYAcc(0)
    }
  },[xAcc]);

  const respawnScoreZone = () => {
    let zoneX = Math.floor(Math.random() * (SCREEN_WIDTH - 80 + 1));
    let zoneY = Math.floor(Math.random() * (SCREEN_HEIGHT - 80 + 1));
    setScoreZone({x: zoneX, y: zoneY})
  }

  const _unsubscribeSensors = () => {
    Accelerometer.removeAllListeners()
    setAccelSubscription(null);
  }

  const handleNextRound = () => {
    setIsPlaying(false)
    console.log("Round ended! Going home")
    console.log("Score: " + totalScore)
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { name: 'ResultsScreen', params: {loadURL: route.params.loadURL, saveURL: route.params.saveURL, totalScore: totalScore} },
        ],
      })
    )
  }

  const startGame = () => {
    setIsPlaying(true)
  }

  return <View>
    <View style={[{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT}, styles.marbleField]}>
      <View style={[styles.marble, {transform: [{translateX: xPos*MOTION_SCALE}, {translateY: yPos*MOTION_SCALE}]}]}/>
      <View style={[styles.scoreZone, {transform: [{translateX: scoreZone.x}, {translateY: scoreZone.y-SCORE_ZONE_SIZE}]}]}/>
    </View>
    <View style={styles.infoPanel}>
        <Text>Current Accelerometer:</Text>
        <Text>x: {xAcc}</Text>
        <Text>y: {yAcc}</Text>
        <Text>xPos: {xPos}</Text>
        <Text>yPos: {yPos}</Text>
        <Text>Total Score: {totalScore}</Text>
    </View>
    <TouchableOpacity style={[styles.startGame, {opacity: !isPlaying ? 1 : 0}]} onPress={startGame}>
      <Text style={{fontSize: 30, width: 200, alignSelf: "center", left: 18, top: 20}}>Start Game!</Text>
    </TouchableOpacity>
    <Text style={{fontSize: 30, position: "absolute", width: 300, padding: 20}}>Score: {totalScore}</Text>
    <View style={styles.timer}>
      <CountdownCircleTimer
        size={100}
        isPlaying={isPlaying}
        duration={TIMER_DURAION}
        colors={['#004777', '#F7B801', '#A30000', '#A30000']}
        colorsTime={[7, 5, 2, 0]}
        onComplete={() => {
          handleNextRound()
          return { shouldRepeat: true }
        }}
      >
      {({ remainingTime }) => <Text style={styles.timerText}>{remainingTime}</Text>}
      </CountdownCircleTimer>
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
    <Text>There will be three rounds.</Text>
    <Text>Each round you will want to set a good 0 degree starting point, then press the "Set Zero" button.</Text>
    <Text>Next, move your mobile device like a compass to try and match the target angle!</Text>
    <Text>Your score correlates with how close you were to the targer angle. </Text>
    <Text>Good Luck! </Text>
    <Button
      title="START!"
      onPress={() =>
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'RoundIntroScreen',
                params: { roundNum: 1, totalScore: 0, loadURL: route.params.loadURL, saveURL: route.params.saveURL},
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
    <Text>Your target value is...{targetAngle}� </Text>
    <Button
      title="Next"
      onPress={() =>
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'CameraScreen',
                params: {roundNum: route.params.roundNum, targetAngle, totalScore: route.params.totalScore, loadURL: route.params.loadURL, saveURL: route.params.saveURL}
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
                        totalScore: route.params.totalScore,
                        loadURL: route.params.loadURL, saveURL: route.params.saveURL
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
        totalScore: totalScore,  // Pass updated totalScore to next round
        loadURL: route.params.loadURL, saveURL: route.params.saveURL
      });
    };
    
  const handleFinalRoundEnd = () => {
      navigation.navigate('ResultsScreen', {
          totalScore: totalScore,  // Pass final totalScore to results screen
          loadURL: route.params.loadURL, saveURL: route.params.saveURL
      });
  };

  return (
    <View>
        <Image style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 4 / 3, alignSelf: "center" }} source={{ uri: route.params.prevPhoto.uri }} />
        <Text>You Got: Angle {actualAngle}� - Target: {targetAngle}� - Score: {String(score)}</Text>
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
//     <Text>You Got: Angle {actualAngle}� - Target: {targetAngle}� - Score: {score}</Text>
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
    fetchLeaderboard(route.params.loadURL, setLeaderboard);
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
      response = await fetch(route.params.saveURL, {
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
              { name: 'Leaderboard', 
                params: {loadURL: route.params.loadURL, saveURL: route.params.saveURL}
              },
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

    // Sort leaderboard descending
    const newList = [...aList].sort((a, b) => b.score - a.score);

    aSetList(newList);

  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
  }
}

const LeaderboardScreen = ({ navigation, route }) => {
  const [leaderboard, setLeaderboard] = useState([]);

  // Function just for list debug
  async function loadDefault() {
      const ops = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify([{"name": "dale", "score": 111}, {"name": "john", "score": 222}])
      };
      const response = await fetch(route.params.saveURL, ops);
      console.log(response);
  }

  
  function loadData() {
    fetchLeaderboard(route.params.loadURL, setLeaderboard);
    index = 0
    newList = [];
  
    leaderboard.forEach((e, index) => {
      newList.push(
        <View style={styles.leaderboardEntry} key={index}>
           <Text style={styles.leaderboardText}>{index + 1}</Text>
           <Text style={styles.leaderboardText}>{e.name}</Text>
           <Text style={styles.leaderboardText}>{e.score} pts</Text>
        </View>
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
    <ImageBackground source={require('./assets/paper8.png')} resizeMode="cover" style={styles.image}>
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
    <ScrollView style={styles.leaderboardContainer}> 
      {loadData()}
    </ScrollView>
  </ImageBackground>
  );
};

const AboutScreen = ({navigation, route}) => {
  return <Text>About Sensor Scramble!</Text>;
};

const styles = StyleSheet.create({
  leaderboardContainer: {
    padding: 15,
    width: "100%",
    alignSelf: "center",
  },

  leaderboardEntry: {
    alignItems: "center",
    alignSelf: "center",
    width: "90%",
    margin: 10,
    backgroundColor: "skyblue",
    borderRadius: 5,
    borderColor: "steelblue",
    borderWidth: 5,
    flex: 1,
    justifyContent: 'space-evenly',
    flexDirection: "row"
  },

  leaderboardText: {
    textAlign: "center",
    textAlignVertical: "center",
    flex: 1,
    textAlignVertical: "center",
    fontSize: 25
  },

  menuButton: {
    alignItems: "center",
    width: "60%",
    height: "11%",
    margin: 10,
    backgroundColor: "salmon",
    borderRadius: 30,
    borderColor: "maroon",
    borderWidth: 5
  },

  menuButtonSmall: {
    alignItems: "center",
    width: "60%",
    height: "6%",
    margin: 10,
    backgroundColor: "skyblue",
    borderRadius: 30,
    borderColor: "steelblue",
    borderWidth: 5
  },

  menuButtonText: {
    textAlign: "center",
    textAlignVertical: "center",
    width: "100%",
    height: "100%",
    fontSize: 30
  },

  image: {
    flex: 1,
    justifyContent: 'center',
    width: "100%",
  },

  timer: {
    position: "absolute",
    top: 0,
    right: 0,
    padding:15
  },

  timerText: {
    fontSize: 20
  },

  startGame: {
    alignSelf: "center",
    alignContent: "center",
    alignItems: "center",
    width: 200,
    height: 90,
    backgroundColor: "lightblue",
    top: "100%",
    borderRadius: 20,
  },

  marbleField: {
    borderColor: "darkorange",
    borderWidth: 10,
    alignSelf: "center",
    top:0,
    position: "absolute",
    backgroundColor: "cornsilk",
  },

  marble: {
    width: 50,
    height: 50,
    borderRadius: 50,
    color: "red",
    backgroundColor: "red",
  },

  scoreZone: {
    width: 50,
    height: 50,
    borderRadius: 50,
    color: "yellow",
    backgroundColor: "gold",
  },

  leaderboard: {
    fontSize: 20,
  },

  infoPanel: {
    top: 50,
    margin: 10,
    width: 250,
    backgroundColor: "white",
    opacity: 0.3,
    borderColor: "slate",
    borderWidth: 5,
    borderRadius: 10,
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
