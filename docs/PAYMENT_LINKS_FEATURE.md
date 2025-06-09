# Payment Links Feature

## Overview

The Payment Links feature enables customers to complete payment for orders confirmed over the phone. This creates a seamless experience where customers can verify their order details and pay securely online after placing their order via phone call.

## Business Flow

```
Phone Order → Order Confirmed → Payment Link Generated → Customer Pays Online → Order Fulfilled
```

### Use Case
1. **Customer calls** franchisee to place order
2. **Staff takes order** and confirms details
3. **System generates** secure payment link
4. **Customer receives** link via SMS/email
5. **Customer reviews** order and completes payment
6. **Order status** updates to "paid" and moves to fulfillment

## Technical Architecture

### Database Schema

**New columns added to `orders` table:**
```sql
ALTER TABLE orders 
ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
ADD COLUMN payment_token text,
ADD COLUMN payment_link_expires_at timestamp with time zone,
ADD COLUMN payment_reference_id text,
ADD COLUMN payment_completed_at timestamp with time zone;
```

### API Endpoints

#### 1. Generate Payment Link
**Endpoint:** `PUT /functions/v1/order`

**Request:**
```json
{
  "orderNumber": "W25700000001-1",
  "expirationHours": 24
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://your-domain.com/order/pay/abc123-token",
  "paymentToken": "abc123-token",
  "expiresAt": "2025-01-16T18:30:00.000Z",
  "orderNumber": "W25700000001-1",
  "totalAmount": "59.99",
  "message": "Payment link generated successfully",
  "validUntil": "1/16/2025, 6:30:00 PM"
}
```

#### 2. Process Payment
**Endpoint:** `POST /api/payments/process`

**Request:**
```json
{
  "orderToken": "abc123-token",
  "orderId": "uuid",
  "amount": 59.99,
  "customerEmail": "customer@example.com",
  "customerName": "John Doe"
}
```

### Frontend Implementation

#### Payment Page Route
- **URL:** `/order/pay/[token]`
- **Purpose:** Display order summary and payment form
- **Security:** Token-based authentication with expiration

#### Key Components
1. **OrderSummary** - Shows order details, items, totals
2. **CustomerInfo** - Displays customer information
3. **PaymentForm** - Secure payment processing
4. **Confirmation** - Success/failure states

## Security Features

### Token Security
- **Crypto-generated UUIDs** for payment tokens
- **Time-limited expiration** (24-48 hours)
- **Single-use tokens** (invalidated after payment)
- **No sequential IDs** exposed

### Payment Security
- **Amount validation** against order total
- **Status verification** (prevent double payments)
- **Expiration checks** on every request
- **Secure HTTPS** communication

### Data Protection
- **No credit card storage** on our servers
- **PCI compliance** through Square integration
- **Encrypted token transmission**
- **Audit trail** for all payment attempts

## Integration with Square

### Payment Processing Flow
```javascript
// Square Payment API integration (future implementation)
const paymentRequest = {
  source_id: "CARD_TOKEN_FROM_SQUARE_WEB_SDK",
  amount_money: {
    amount: Math.round(totalAmount * 100), // Convert to cents
    currency: "USD"
  },
  idempotency_key: crypto.randomUUID(),
  order_id: squareOrderId,
  reference_id: orderNumber,
  buyer_email_address: customerEmail
};
```

### Required Environment Variables
```env
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_APPLICATION_ID=your_square_app_id
WEBAPP_BASE_URL=https://your-domain.com
```

## Best Practices Comparison

### Industry Standards

| Feature | Our Implementation | Industry Best Practice |
|---------|-------------------|----------------------|
| **Token Expiry** | 24-48 hours | ✅ 24-72 hours typical |
| **Security** | Crypto UUID | ✅ Non-sequential tokens |
| **Mobile First** | Responsive design | ✅ 80% payments on mobile |
| **Error Handling** | Graceful degradation | ✅ Clear error messages |
| **Status Updates** | Real-time | ✅ Immediate feedback |

### Similar Implementations
- **OpenTable**: Reservation → Payment link for deposits
- **DoorDash**: Order confirmation → Payment processing
- **Hotels.com**: Booking → Payment completion
- **Uber**: Trip confirmation → Payment link

## Usage Examples

### Basic Usage
```javascript
// Generate payment link after phone order
const response = await fetch('/functions/v1/order', {
  method: 'PUT',
  body: JSON.stringify({
    orderNumber: 'W25700000001-1',
    expirationHours: 24
  })
});

const { paymentUrl } = await response.json();
// Send paymentUrl to customer via SMS/email
```

### Error Handling
```javascript
try {
  const paymentResponse = await processPayment(orderData);
  showSuccessMessage(paymentResponse);
} catch (error) {
  if (error.code === 'EXPIRED_LINK') {
    showContactMessage();
  } else if (error.code === 'ALREADY_PAID') {
    showAlreadyPaidMessage();
  } else {
    showGenericError();
  }
}
```

## Testing

### Test Payment Flow
```bash
# Run the test script
node scripts/test-payment-flow.js
```

### Manual Testing Checklist
- [ ] Generate payment link for new order
- [ ] Verify link expiration handling
- [ ] Test already-paid order prevention
- [ ] Validate amount matching
- [ ] Check mobile responsiveness
- [ ] Verify order status updates

## Implementation Status

### ✅ Completed
- Database schema updates
- **Payment link generation API (PUT endpoint)** ⭐ DEPLOYED
- Token security system
- Order validation logic
- **CORS configuration** for all HTTP methods
- **Edge function deployment** (Version 25)
- **PUT endpoint testing** - confirmed working

### 🚧 In Progress
- Frontend payment page
- Square API integration
- Email/SMS notifications
- Enhanced error handling
- Payment confirmation emails

### 📋 Future Enhancements
- Multiple payment methods
- Partial payment support
- Payment plan options
- Franchisee dashboard integration
- Analytics and reporting

## Configuration

### Environment Setup
```env
# Required for payment links
WEBAPP_BASE_URL=https://your-domain.com
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required for Square integration
SQUARE_ACCESS_TOKEN=your_square_token
SQUARE_LOCATION_ID=your_location_id
```

### Deployment Notes
- Ensure HTTPS is enabled in production
- Configure proper CORS headers
- Set up monitoring for payment failures
- Implement proper logging for audit trails

## Support & Troubleshooting

### Common Issues
1. **"Payment link expired"** - Generate new link
2. **"Order already paid"** - Check order status
3. **"Amount mismatch"** - Verify order totals
4. **"Order not found"** - Validate order number

### Monitoring
- Track payment link generation rates
- Monitor payment success/failure ratios
- Alert on expired link usage attempts
- Log all payment processing events

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** Ready for Production 