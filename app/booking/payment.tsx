import CustomHeader from '@/components/ui/CustomHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { bookingApi } from '../../api/bookingApi';
import CustomButton from '../../components/common/CustomButton';
import { Colors } from '../../constants/Colors';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    bookingId: string; 
    totalAmount: string; 
    bankBin: string; 
    bankAccount: string; 
    bankName: string;
  }>();

  const [loading, setLoading] = useState(false);
  
  // Refund Info State
  const [refundBankName, setRefundBankName] = useState('');
  const [refundAccountNumber, setRefundAccountNumber] = useState('');
  const [refundAccountName, setRefundAccountName] = useState('');

  const { bookingId, totalAmount, bankBin, bankAccount, bankName } = params;
  
  // Generate VietQR URL
  // Format: https://img.vietqr.io/image/<BANK_BIN>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<NAME>
  const qrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact.png?amount=${totalAmount}&addInfo=BOOKING ${bookingId}`;

  const handleConfirmPayment = async () => {
    if (!bookingId) return;
    
    setLoading(true);
    try {
      const refundInfo = (refundBankName && refundAccountNumber && refundAccountName) 
        ? {
            refundBankName,
            refundAccountNumber,
            refundAccountName
          }
        : undefined;

      await bookingApi.markBookingAsPaid(bookingId, refundInfo);
      
      Alert.alert("Success", "Payment confirmed! Waiting for owner verification.", [
        { text: "OK", onPress: () => router.replace("/booking/success") }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to confirm payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Thanh toán" showBackButton={true} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>
            <Text style={styles.amountValue}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(totalAmount))}</Text>
          </View>

          <View style={styles.qrContainer}>
             <Image 
              source={{ uri: qrUrl }} 
              style={styles.qrImage} 
              resizeMode="contain"
            />
          </View>

          <Text style={styles.instruction}>
            Scan the QR code with your banking app to pay.
          </Text>
          <Text style={styles.note}>
            Transfer Content: <Text style={{fontWeight: 'bold'}}>BOOKING {bookingId?.slice(0, 8)}...</Text>
          </Text>

           {/* Owner Bank Info Details (Fallback text) */}
           <View style={styles.bankInfoBox}>
            <Text style={styles.bankInfoTitle}>Bank Transfer Details:</Text>
            <Text style={styles.bankInfoText}>Bank: {bankName}</Text>
            <Text style={styles.bankInfoText}>Account: {bankAccount}</Text>
          </View>


          <View style={styles.refundSection}>
            <Text style={styles.sectionHeader}>Refund Information (Optional)</Text>
            <Text style={styles.subText}>Provide your bank details for quick refund in case of cancellation.</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Your Bank Name (e.g., MBBank)"
              value={refundBankName}
              onChangeText={setRefundBankName}
            />
            <TextInput
              style={styles.input}
              placeholder="Your Account Number"
              value={refundAccountNumber}
              onChangeText={setRefundAccountNumber}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Your Account Name (e.g., NGUYEN VAN A)"
              value={refundAccountName}
              onChangeText={setRefundAccountName}
              autoCapitalize="characters"
            />
          </View>

        </ScrollView>
        
        <View style={styles.footer}>
          <CustomButton 
            title="I Have Paid" 
            onPress={handleConfirmPayment} 
            isLoading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.text,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  instruction: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 5,
    color: Colors.text,
  },
  note: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  bankInfoBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
  },
  bankInfoTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bankInfoText: {
    fontSize: 14,
    color: '#333',
  },
  refundSection: {
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: Colors.text,
  },
  subText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
});
