
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { processPayment, calculateBookingPrice } from "@/utils/payment-service";

interface PaymentFormProps {
  bookingDetails: any;
  onPaymentSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export function PaymentForm({ bookingDetails, onPaymentSuccess, onCancel }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');
  
  // Calculate booking amount
  const amount = calculateBookingPrice(
    bookingDetails.roomType, 
    parseInt(bookingDetails.adults),
    parseInt(bookingDetails.children)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      // Format card number with spaces every 4 digits
      const formatted = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim();
      
      setCardDetails({
        ...cardDetails,
        [name]: formatted
      });
    } else if (name === 'upiId') {
      setUpiId(value);
    } else {
      setCardDetails({
        ...cardDetails,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Process payment with the chosen method
      const paymentResult = await processPayment({
        amount,
        currency: 'INR',
        paymentMethod: bookingDetails.paymentMethod,
        description: `Booking for ${bookingDetails.roomType} room`,
        metadata: {
          guestName: bookingDetails.name,
          checkInDate: bookingDetails.date.toISOString(),
          roomType: bookingDetails.roomType
        }
      });
      
      if (paymentResult.success && paymentResult.transactionId) {
        setPaymentSuccess(true);
        setTimeout(() => {
          onPaymentSuccess(paymentResult.transactionId as string);
        }, 1500);
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>Your booking has been confirmed</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mt-2 text-muted-foreground">
            A confirmation email will be sent to {bookingDetails.email}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          Secure payment for your booking at Dandeli Adventures
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Booking Amount:</span>
            <span className="font-medium">₹{amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Room Type:</span>
            <span className="font-medium capitalize">{bookingDetails.roomType} Room</span>
          </div>
          <div className="flex justify-between">
            <span>Check-in Date:</span>
            <span className="font-medium">{bookingDetails.date.toLocaleDateString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium text-lg">
            <span>Total Amount:</span>
            <span>₹{amount.toLocaleString()}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {bookingDetails.paymentMethod === 'creditCard' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.cardNumber}
                    onChange={handleInputChange}
                    required
                    maxLength={19}
                  />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  name="cardholderName"
                  placeholder="John Doe"
                  value={cardDetails.cardholderName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    placeholder="MM/YY"
                    value={cardDetails.expiryDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    name="cvv"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={handleInputChange}
                    required
                    maxLength={3}
                    type="password"
                  />
                </div>
              </div>
            </>
          )}
          
          {bookingDetails.paymentMethod === 'upi' && (
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                name="upiId"
                placeholder="yourname@upi"
                value={upiId}
                onChange={handleInputChange}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter your UPI ID (e.g., name@okhdfcbank, name@ybl)
              </p>
            </div>
          )}
          
          {bookingDetails.paymentMethod === 'bankTransfer' && (
            <div className="border rounded-md p-4 bg-muted/30">
              <h3 className="font-medium mb-2">Bank Transfer Details</h3>
              <p className="text-sm mb-4">
                Please transfer the total amount to the following bank account:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Account Name:</span>
                  <span>Dandeli Adventures Pvt Ltd</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Account Number:</span>
                  <span>1234567890</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">IFSC Code:</span>
                  <span>HDFC0001234</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Bank:</span>
                  <span>HDFC Bank</span>
                </div>
              </div>
              <p className="text-sm mt-4">
                After making the transfer, please click "Complete Payment" to finish your booking.
              </p>
            </div>
          )}
          
          <div className="pt-4 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Back
            </Button>
            
            <Button 
              type="submit" 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Complete Payment"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
