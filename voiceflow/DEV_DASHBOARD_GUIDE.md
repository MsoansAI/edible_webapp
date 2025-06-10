# Dev Context Dashboard - User Guide 🛠️

## 🎯 **What It Does**

The Dev Context Dashboard shows you **real-time context variables** as you test the user experience flow. This helps validate that our context variables fix is working properly.

---

## 🚀 **How To Use**

### **Step 1: Start Development Server**
```bash
npm run dev
```

### **Step 2: Open Your App**
- Navigate to `http://localhost:3000`
- You'll see a **blue bug icon** 🐛 in the bottom-right corner

### **Step 3: Open the Dashboard**
- Click the blue bug icon to open the dashboard
- The dashboard will appear as a floating panel

### **Step 4: Test Different User Scenarios**

#### **Test Guest User**
1. Make sure you're logged out
2. Dashboard should show:
   - `isAuthenticated: false`
   - `userRole: guest`
   - `userName: null`
   - `totalOrders: 0`

#### **Test Authenticated User**
1. Navigate to `/auth` and login
2. Dashboard should show:
   - `isAuthenticated: true`
   - `userRole: authenticated`
   - `userName: Your Name`
   - Real profile data from database

#### **Test Cart Functionality**
1. Add items to cart from `/products`
2. Dashboard should show:
   - `cartItemCount: 2` (or your actual count)
   - `cartTotal: $XX.XX`
   - `freeShipping: true/false`

---

## 🖱️ **Dashboard Features**

### **✅ Real-Time Updates**
- Auto-refreshes every 5 seconds
- Manual refresh with "Refresh" button
- Shows load time for performance monitoring

### **✅ Drag & Drop**
- Click and drag the header to move the dashboard
- Position it anywhere on screen for comfortable testing

### **✅ Minimize/Maximize**
- Click the eye icon to minimize to a small status bar
- Minimized view shows: Auth status, user name, cart count

### **✅ Console Logging**
- Click "Log to Console" to see full context object
- Open browser dev tools to see detailed data

### **✅ Development Only**
- Only appears in development mode (`NODE_ENV=development`)
- Won't show in production builds

---

## 📊 **What To Look For**

### **✅ Authentication Variables**
| Variable | Expected | What It Means |
|----------|----------|---------------|
| `isAuthenticated` | `true`/`false` | User login status |
| `userRole` | `'authenticated'`/`'guest'` | User permission level |
| `userName` | `"John Smith"` or `null` | Display name for greetings |
| `userEmail` | Email or `null` | Account identifier |
| `userId` | UUID or `null` | Database user ID |

### **✅ Profile Variables (NEW)**
| Variable | Expected | What It Means |
|----------|----------|---------------|
| `userTier` | `'new'`/`'returning'`/`'vip'`/`'premium'` | Customer tier for routing |
| `totalOrders` | Number | Order count for tier calculation |
| `lastOrderDate` | Date or `null` | For follow-up messaging |
| `deliveryZip` | ZIP code or `null` | Preferred delivery location |

### **✅ Cart Variables (Should Still Work)**
| Variable | Expected | What It Means |
|----------|----------|---------------|
| `cartItemCount` | Number | Items in cart |
| `cartTotal` | Dollar amount | Cart value |
| `freeShipping` | `true`/`false` | Shipping eligibility |

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Guest User Journey**
1. **Start**: Dashboard shows guest status
2. **Add to Cart**: Cart variables update
3. **Expected**: Intro agent routes to ordering without auth pressure

### **Scenario 2: New User Registration**
1. **Register**: Create new account
2. **Dashboard**: Should show `totalOrders: 0`, `userTier: 'new'`
3. **Expected**: Intro agent gives new customer onboarding

### **Scenario 3: Returning Customer**
1. **Login**: Use existing account with order history
2. **Dashboard**: Should show real order count and tier
3. **Expected**: Intro agent gives personalized greeting

### **Scenario 4: VIP Customer**
1. **Login**: As customer with many orders
2. **Dashboard**: Should show `userTier: 'vip'` or `'premium'`
3. **Expected**: Intro agent gives premium service messaging

---

## 🐛 **Troubleshooting**

### **Problem: Dashboard Not Appearing**
- ✅ **Check**: You're in development mode (`npm run dev`)
- ✅ **Check**: No JavaScript errors in browser console
- ✅ **Check**: Dashboard component imported in AppClientLayout

### **Problem: Auth Variables Show `null`**
- ✅ **Check**: You're actually logged in (visit `/profile` to confirm)
- ✅ **Check**: Supabase auth session exists in browser dev tools
- ✅ **Check**: `/api/user/profile` endpoint returns data

### **Problem: Profile Variables Show `null`**
- ✅ **Check**: Your account has order history in database
- ✅ **Check**: Profile API response in browser Network tab
- ✅ **Check**: Customer record exists in Supabase database

### **Problem: Cart Variables Not Updating**
- ✅ **Check**: Cart store is working (items show in header)
- ✅ **Check**: Browser console for cart-related errors
- ✅ **Check**: Cart items have proper product data

---

## 🎯 **Success Indicators**

When everything is working correctly, you should see:

### **✅ For Guest Users**
```
Authentication:
- isAuthenticated: false
- userRole: guest
- userName: null

Profile Data:
- userTier: new
- totalOrders: 0

Cart Data:
- Updates in real-time as you add/remove items
```

### **✅ For Authenticated Users**
```
Authentication:
- isAuthenticated: true
- userRole: authenticated
- userName: "Your Name"
- userEmail: "your@email.com"

Profile Data:
- userTier: "vip" (or appropriate tier)
- totalOrders: 5 (or your actual count)
- lastOrderDate: "2024-12-15" (or your last order)

Cart Data:
- cartItemCount: 2
- cartTotal: $89.98
- freeShipping: true
```

---

## 🚀 **Next Steps After Validation**

Once the dashboard shows correct data:

1. **Test Voiceflow Integration**: Send messages and verify context is passed
2. **Test Intro Agent**: Check routing decisions match user state
3. **Test Edge Cases**: Profile loading failures, network issues
4. **Performance Check**: Monitor load times (should be < 500ms)

---

## 💡 **Pro Tips**

- **Keep Dashboard Open**: While testing different user flows
- **Check Load Times**: Should be fast (< 500ms for most operations)
- **Test State Changes**: Login/logout, add/remove cart items
- **Use Browser Dev Tools**: Network tab to see API calls
- **Test Different Users**: New vs returning vs VIP customers

The dashboard is your **window into the context system** - use it to verify our fix works perfectly! 🎯 