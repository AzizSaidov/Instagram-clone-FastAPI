import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { CreateScreen } from "../screens/main/CreateScreen";
import { HomeScreen } from "../screens/main/HomeScreen";
import { ProfileScreen } from "../screens/main/ProfileScreen";
import { ReelsScreen } from "../screens/main/ReelsScreen";
import { SearchScreen } from "../screens/main/SearchScreen";
import { colors } from "../theme/colors";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

const iconMap: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home",
  Search: "search-outline",
  Create: "add-circle-outline",
  Reels: "play-circle-outline",
  Profile: "person-circle-outline",
};

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 66,
          paddingBottom: 10,
          paddingTop: 0,
        },
        tabBarItemStyle: {
          alignItems: "center",
          justifyContent: "center",
          minHeight: 56,
        },
        tabBarIcon: ({ color, focused }) => {
          const iconName = focused && route.name !== "Create" ? iconMap[route.name].replace("-outline", "") : iconMap[route.name];

          return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} color={color} size={route.name === "Create" ? 29 : 25} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Reels" component={ReelsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
