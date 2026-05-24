import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { getReels, toggleReelLike, updateReelView } from "../../api/resources";
import type { Reel } from "../../api/types";
import { mediaUrl } from "../../config/api";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { IconButton } from "../../components/IconButton";
import { Loading } from "../../components/Loading";
import { Screen } from "../../components/Screen";
import { colors, spacing } from "../../theme/colors";
import { formatHashtag } from "../../utils/format";

export function ReelsScreen() {
  const { height } = useWindowDimensions();
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    const nextIndex = viewableItems[0]?.index;
    if (typeof nextIndex === "number") {
      setActiveIndex(nextIndex);
    }
  }).current;

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await getReels();
      setReels(response.reels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reels");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const active = reels[activeIndex];
    if (active) {
      updateReelView(active.id, 60).catch(() => undefined);
    }
  }, [activeIndex, reels]);

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen noPadding style={styles.screen}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={reels}
        keyExtractor={(item) => String(item.id)}
        pagingEnabled
        snapToInterval={height - 60}
        decelerationRate="fast"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        ListEmptyComponent={<EmptyState title="No reels yet" body="Upload a reel from the Create tab." />}
        renderItem={({ item, index }) => (
          <ReelPage
            reel={item}
            active={index === activeIndex}
            height={height - 60}
            onLike={() => toggleReelLike(item.id).catch(() => undefined)}
          />
        )}
      />
    </Screen>
  );
}

function ReelPage({ reel, active, height, onLike }: { reel: Reel; active: boolean; height: number; onLike: () => void }) {
  const hashtag = formatHashtag(reel.hashtag);
  const username = reel.user?.username || "unknown";

  return (
    <View style={[styles.reelPage, { height }]}>
      <ReelVideo url={mediaUrl(reel.video_url)} active={active} />
      <View style={styles.reelOverlay}>
        <View style={styles.reelText}>
          <View style={styles.reelAuthorRow}>
            <Avatar uri={reel.user?.avatar_url} username={username} size={34} />
            <Text style={styles.reelAuthor}>{username}</Text>
          </View>
          {reel.description ? <Text style={styles.reelDescription}>{reel.description}</Text> : null}
          {hashtag ? <Text style={styles.reelHashtag}>{hashtag}</Text> : null}
        </View>
        <View style={styles.reelActions}>
          <IconButton name="heart-outline" color={colors.text} onPress={onLike} />
          <IconButton name="chatbubble-outline" color={colors.text} />
          <Ionicons name="eye-outline" size={22} color={colors.text} />
          <Text style={styles.views}>{reel.views_count}</Text>
        </View>
      </View>
    </View>
  );
}

function ReelVideo({ url, active }: { url?: string; active: boolean }) {
  const player = useVideoPlayer(url || "", (instance) => {
    instance.loop = true;
  });

  useEffect(() => {
    if (!url) {
      return;
    }

    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player, url]);

  if (!url) {
    return <View style={styles.blankVideo} />;
  }

  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

const styles = StyleSheet.create({
  blankVideo: {
    backgroundColor: colors.text,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
  reelActions: {
    alignItems: "center",
    gap: spacing.sm,
  },
  reelAuthor: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  reelAuthorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  reelDescription: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  reelHashtag: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  reelOverlay: {
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    padding: spacing.lg,
    paddingBottom: 34,
    position: "absolute",
    right: 0,
    top: 0,
  },
  reelPage: {
    backgroundColor: colors.text,
    justifyContent: "flex-end",
  },
  reelText: {
    alignSelf: "flex-end",
    flex: 1,
    paddingRight: spacing.lg,
  },
  screen: {
    backgroundColor: colors.text,
  },
  views: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
});
