import { Ionicons } from '@expo/vector-icons';
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { Easing, StyleSheet } from 'react-native';

import { AlertsScreen } from '../screens/AlertsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors, spacing, typography } from '../theme';
import type { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();
const tabBarHeight = spacing.xxl + spacing.xl + spacing.xs;

const tabIconNames: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Alertas: 'notifications',
  Documentos: 'folder',
  Editais: 'document-text',
  Perfil: 'person',
};

const screenOptions = ({ route }: { route: { name: keyof MainTabParamList } }): BottomTabNavigationOptions => ({
  animation: 'shift',
  headerShown: false,
  tabBarActiveTintColor: colors.text,
  tabBarHideOnKeyboard: true,
  tabBarIcon: ({ color, size }) => (
    <Ionicons color={color} name={tabIconNames[route.name]} size={size} />
  ),
  tabBarInactiveTintColor: colors.text,
  tabBarLabelStyle: styles.label,
  tabBarStyle: styles.tabBar,
  transitionSpec: {
    animation: 'timing',
    config: {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    },
  },
});

export function MainTabNavigator() {
  return (
    <Tab.Navigator initialRouteName="Editais" screenOptions={screenOptions}>
      <Tab.Screen name="Editais" component={HomeScreen} />
      <Tab.Screen name="Documentos" component={DocumentsScreen} />
      <Tab.Screen name="Alertas" component={AlertsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.tabLabel,
  },
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 0,
    elevation: 0,
    height: tabBarHeight,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    shadowOpacity: 0,
  },
});

export default MainTabNavigator;
