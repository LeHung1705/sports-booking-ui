// components/home/BannerSlider.tsx
import React, { useRef, useState } from "react";
import { View, ScrollView, Image, StyleSheet, NativeScrollEvent, NativeSyntheticEvent, Dimensions, } from "react-native";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");
const BANNER_HEIGHT = 180;

export interface BannerItem {
  id: string;
  imageUrl: string;
}

interface BannerSliderProps {
  banners: BannerItem[];
}

export const BannerSlider: React.FC<BannerSliderProps> = ({ banners }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setActiveIndex(index);
  };

  if (!banners.length) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => (
          <Image
            key={banner.id}
            source={{ uri: banner.imageUrl }}
            style={styles.banner}
          />
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {banners.map((b, index) => (
          <View
            key={b.id}
            style={[
              styles.dot,
              index === activeIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    marginBottom: 16,
  },
  banner: {
    width,
    height: BANNER_HEIGHT,
    resizeMode: "cover",
  },
  dots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    width: 14,
    backgroundColor: Colors.white,
  },
});
