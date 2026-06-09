import { Ionicons } from '@expo/vector-icons';
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { Easing, StyleSheet, Text, View } from 'react-native';

import { AlertsScreen } from '../screens/AlertsScreen';
// import { DocumentsScreen } from '../screens/DocumentsScreen'; // HIDDEN — feature disabled
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors, spacing, typography } from '../theme';
import type { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();
const tabBarHeight = spacing.xxl + spacing.xl + spacing.xs;

const tabIconNames: Record<
  keyof MainTabParamList,
  {
    active: keyof typeof Ionicons.glyphMap;
    inactive: keyof typeof Ionicons.glyphMap;
  }
> = {
  Alertas: {
    active: 'notifications',
    inactive: 'notifications-outline',
  },
  // Documentos: { active: 'folder', inactive: 'folder-outline' }, // HIDDEN — feature disabled
  Editais: {
    active: 'document-text',
    inactive: 'document-text-outline',
  },
  Perfil: {
    active: 'person',
    inactive: 'person-outline',
  },
};

const screenOptions = ({ route }: { route: { name: keyof MainTabParamList } }): BottomTabNavigationOptions => ({
  animation: 'shift',
  headerShown: false,
  tabBarActiveTintColor: colors.primaryDark,
  tabBarHideOnKeyboard: true,
  tabBarIcon: ({ focused, size }) => (
    <View style={[styles.iconFrame, focused && styles.iconFrameActive]}>
      <Ionicons
        color={focused ? colors.white : colors.text}
        name={focused ? tabIconNames[route.name].active : tabIconNames[route.name].inactive}
        size={size}
      />
    </View>
  ),
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarLabel: ({ focused }) => (
    <Text numberOfLines={1} style={[styles.label, focused && styles.labelActive]}>
      {route.name}
    </Text>
  ),
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
      {/* <Tab.Screen name="Documentos" component={DocumentsScreen} /> */}{/* HIDDEN — feature disabled */}
      <Tab.Screen name="Alertas" component={AlertsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconFrame: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 46,
  },
  iconFrameActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      height: 3,
      width: 0,
    },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    ...typography.tabLabel,
    color: colors.textSecondary,
    marginTop: 2,
  },
  labelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 0,
    elevation: 0,
    height: tabBarHeight,
    paddingBottom: spacing.xs,
    paddingTop: spacing.sm,
    shadowOpacity: 0,
  },
});

export default MainTabNavigator;
