import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import type { CourtReview } from "@/types/court";

interface ReviewCardProps {
  review: CourtReview;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const createdDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("vi-VN")
    : "";

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={styles.avatar} 
        />

        <View style={styles.headerContent}>
          <View style={styles.nameRatingRow}>
            <Text style={styles.userName}>{review.userName || "Người dùng ẩn danh"}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
            </View>
          </View>
          {createdDate ? (
            <Text style={styles.dateText}>{createdDate}</Text>
          ) : null}
        </View>
      </View>

      {review.comment ? (
        <Text style={styles.commentText}>{review.comment}</Text>
      ) : (
        <Text style={styles.noCommentText}>Không có nhận xét</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  headerContent: {
    flex: 1,
  },
  nameRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff9e6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B6B00",
  },
  dateText: {
    fontSize: 13,
    color: "#6c757d",
  },
  commentText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
    marginTop: 4,
  },
  noCommentText: {
    fontSize: 14,
    color: "#6c757d",
    fontStyle: "italic",
    marginTop: 4,
  },
});