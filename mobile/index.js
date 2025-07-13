import {AppRegistry} from 'react-native';
import React from 'react';
import {Text} from 'react-native';

const App = () => <Text style={{fontSize: 50, margin: 50}}>HELLO WORLD 10</Text>;

AppRegistry.registerComponent('MinimalApp', () => App);
