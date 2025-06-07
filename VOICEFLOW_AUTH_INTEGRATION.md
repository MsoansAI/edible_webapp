# 🔐 **Voiceflow Authentication & Context Integration Guide**

## ✅ **What We've Built**

Your Voiceflow chatbot can now **receive real-time authentication and cart data** from your website! Here's what's now possible:

### **🎯 Context Variables Available in Voiceflow**

When a user interacts with your chatbot, these variables are automatically set:

```javascript
{
  "isAuthenticated": true/false,
  "userId": "user-uuid-123",
  "userName": "John Doe", 
  "userEmail": "john@example.com",
  "userRole": "authenticated" | "guest",
  "cartItemCount": 3,
  "cartTotal": 89.97,
  "lastOrderDate": "2024-01-15",
  "preferredDeliveryZip": "10001",
  "sessionTimestamp": "2024-01-20T10:30:00Z",
  "source": "website"
}
```

---

## 🛠️ **Setting Up Voiceflow to Use Context**

### **Step 1: Create Variables in Voiceflow**

In your Voiceflow project:

1. **Go to Variables panel**
2. **Create these variables:**
   - `isAuthenticated` (Boolean, default: false)
   - `userId` (Text, default: null)
   - `userName` (Text, default: null)
   - `userEmail` (Text, default: null)
   - `userRole` (Text, default: "guest")
   - `cartItemCount` (Number, default: 0)
   - `cartTotal` (Number, default: 0)

### **Step 2: Create Conditional Flows**

#### **Welcome Message Based on Auth Status**
```
IF {isAuthenticated} = true
  → "Welcome back, {userName}! How can I help you today?"
ELSE  
  → "Hi there! I'm your shopping assistant. Would you like to browse our products or create an account for faster checkout?"
```

#### **Cart-Aware Responses**
```
IF {cartItemCount} > 0
  → "I see you have {cartItemCount} items in your cart (${cartTotal}). Would you like to add more items or proceed to checkout?"
ELSE
  → "Your cart is empty. Let me help you find some delicious arrangements!"
```

#### **Role-Based Features**
```
IF {userRole} = "premium"
  → Enable premium customer flow (expedited shipping, exclusive products)
ELSE IF {userRole} = "authenticated"  
  → Enable standard customer flow (saved addresses, order history)
ELSE
  → Enable guest flow (account creation prompts)
```

### **Step 3: Add Intent Handlers**

Create these **Intents** in Voiceflow:

#### **"update_auth_status" Intent**
- **Purpose**: Handle authentication state changes
- **Response**: Silent update (no user message)
- **Action**: Update variables and continue conversation

#### **"update_cart_context" Intent**  
- **Purpose**: Handle cart changes
- **Response**: Optional confirmation ("Got it, your cart is updated")
- **Action**: Update cart variables

---

## 🎭 **Example Voiceflow Conversation Flows**

### **Guest User Flow**
```
User: "Hi"
Bot: "Hi there! I'm your shopping assistant. 
     Would you like to browse our products or 
     create an account for faster checkout?"

User: "Show me chocolate arrangements"
Bot: "Great choice! Here are our popular chocolate arrangements:
     [Product buttons/carousel]
     
     💡 Tip: Create an account to save your favorites 
     and get faster checkout!"
```

### **Authenticated User Flow**
```
User: "Hi" 
Bot: "Welcome back, Sarah! I see you have 2 items 
     in your cart ($45.99). Would you like to:
     
     🛒 Add more items
     💳 Proceed to checkout  
     📦 Check your recent orders"

User: "Add more items"
Bot: "Perfect! What type of arrangement are you 
     looking for today?"
```

### **VIP Customer Flow**
```
User: "Hi"
Bot: "Welcome back, Premium Member! 🌟
     
     I see you have 1 item in your cart ($75.00).
     As a premium member, you get:
     ✨ FREE express delivery
     🎁 Exclusive seasonal collections
     
     How can I assist you today?"
```

---

## 🔧 **Technical Implementation**

### **Frontend Integration** (Already Done!)

Your ChatPanel now automatically:
- ✅ **Syncs auth status** when users log in/out
- ✅ **Syncs cart changes** when items are added/removed  
- ✅ **Sends context** with every message
- ✅ **Handles state changes** automatically

### **Voiceflow Variable Usage**

In Voiceflow **Text/Speak blocks**, use:
```
Welcome {userName}!
You have {cartItemCount} items totaling ${cartTotal}
```

In Voiceflow **Condition blocks**, use:
```
IF {isAuthenticated} = true
IF {cartItemCount} > 0  
IF {userRole} = "premium"
```

In Voiceflow **API blocks**, send context:
```json
{
  "userId": "{userId}",
  "isAuthenticated": "{isAuthenticated}",
  "cartTotal": "{cartTotal}"
}
```

---

## 🧪 **Testing Your Integration**

### **Test Authentication Flow**
1. Open your website as **guest user**
2. Start chatbot → Should show guest welcome
3. **Log in** to your account  
4. Continue chat → Should show authenticated welcome with name

### **Test Cart Integration**
1. Start with **empty cart**
2. Ask chatbot about cart → Should say "empty"
3. **Add items** via website
4. Ask chatbot again → Should show correct count and total

### **Debug Context (Dev Mode)**
Your ChatPanel shows debug info in development:
```
Auth: ✅ Logged in
User: John Doe  
Cart: 3 items
```

---

## 🔄 **Real-Time Sync Triggers**

Context automatically syncs when:
- ✅ **User logs in/out**
- ✅ **Cart items change** (add/remove/quantity)
- ✅ **Every message sent** (ensures fresh context)
- ✅ **Page load** (initial sync)

---

## 🎯 **Advanced Use Cases**

### **Personalized Product Recommendations**
```javascript
// In Voiceflow API block
if (userRole === "premium") {
  return "premium-products-endpoint";
} else if (lastOrderDate) {
  return "returning-customer-products"; 
} else {
  return "new-customer-products";
}
```

### **Smart Checkout Flow**
```javascript
// Check if user can checkout
if (!isAuthenticated) {
  return "Please log in or create account first";
} else if (cartItemCount === 0) {
  return "Your cart is empty. Let me help you find products!";
} else {
  return "Great! Let's proceed to checkout...";
}
```

### **Loyalty Program Integration**
```javascript
// VIP treatment
if (userRole === "vip" || userRole === "premium") {
  return {
    message: "As a VIP member, you get priority processing!",
    actions: ["expedited-shipping", "exclusive-products"]
  };
}
```

---

## 🚀 **Ready to Test!**

Your authentication integration is **LIVE**! 

### **Quick Test Checklist:**
- [ ] 🔲 Create variables in Voiceflow
- [ ] 🔲 Add conditional welcome messages  
- [ ] 🔲 Test guest vs authenticated flows
- [ ] 🔲 Test cart awareness
- [ ] 🔲 Set up role-based responses

**Result**: Your chatbot will now provide **personalized, context-aware** conversations! 🎉

---

## 💡 **Pro Tips**

1. **Start Simple**: Begin with just `isAuthenticated` and `userName`
2. **Test Edge Cases**: Handle null/undefined values gracefully
3. **Privacy First**: Don't store sensitive data in context
4. **Performance**: Context sync is lightweight but avoid excessive calls
5. **Fallbacks**: Always have default responses for unauthenticated users

Your chatbot is now **authentication-aware** and **cart-integrated**! 🚀 