import { ViewProps, ScrollViewProps, PressableProps, TextInputProps, TextProps, ActivityIndicatorProps, ImageProps, TouchableOpacityProps } from "react-native";

declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ActivityIndicatorProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
}
