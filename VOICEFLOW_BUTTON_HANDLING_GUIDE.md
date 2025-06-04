# Voiceflow Button Handling Guide - Dynamic Carousel Actions

## 🎯 Overview

Now that your dynamic carousel is generating correctly in Voiceflow, you need to handle the different button clicks that come back from your frontend. Each button type requires different logic and flow paths.

## 🔄 Button Flow Architecture

```
User clicks button → Frontend sends request → Voiceflow receives payload → Route by action_type
```

## 📋 Button Action Types from Your Carousel

Your dynamic carousel generates these button types:

| Action Type | Description | Use Case |
|-------------|-------------|----------|
| `show_options` | Product has variants | Trigger options popup in frontend |
| `select` | Direct product selection | Continue with selected product |
| `select_option` | Option selection from popup | Continue with selected option |
| `add_to_cart` | Add to cart | Add product/option to cart |
| `back_to_products` | Return to main view | Close popup, return to products |
| `external` | Open external link | Product details page |

## 🛠️ Voiceflow Setup for Button Handling

### Step 1: Custom Action Configuration

Your Custom Action step should be configured as:
- **Custom Action name:** `carousel`
- **Action Body:** Variable `recom_dcarousel`
- **Stop on action:** ✅ **ENABLED** (Critical for button handling)
- **Global Listen:** ✅ **ENABLED** (Allows buttons to work later in conversation)

### Step 2: Create Button Handler Flow

After your Custom Action step, create a **Condition** step to route different button types:

```
Custom Action (carousel)
    ↓
Condition Step (Check {last_event})
    ├── show_options → Options Handler
    ├── select → Product Selection Handler  
    ├── select_option → Option Selection Handler
    ├── add_to_cart → Add to Cart Handler
    ├── back_to_products → Return to Products Handler
    └── external → External Link Handler
```

## 🔧 Setting Up Conditions

### Main Button Router Condition

Create a **Condition** step with these conditions:

```javascript
// Condition 1: Show Options
{last_event.payload.action_type} == "show_options"

// Condition 2: Select Product  
{last_event.payload.action_type} == "select"

// Condition 3: Select Option
{last_event.payload.action_type} == "select_option"

// Condition 4: Add to Cart
{last_event.payload.action_type} == "add_to_cart"

// Condition 5: Back to Products
{last_event.payload.action_type} == "back_to_products"

// Condition 6: External Link
{last_event.payload.action_type} == "external"
```

## 📝 Handler Implementation for Each Button Type

### 1. Show Options Handler (`show_options`)

**Purpose:** Generate and display options carousel for products with variants

**Flow:**
```
Condition: show_options
    ↓
Set Variables:
    - selected_product_id = {last_event.payload.productId}
    - parent_card_index = {last_event.payload.card_index}
    ↓
JavaScript Step: Generate Options Carousel
    ↓
Custom Action: Display Options Popup
```

**JavaScript Step Code:**
```javascript
// Generate options carousel for the selected product
function generateSpecificProductOptions(recommended_items, productId, parentIndex) {
  const product = recommended_items.find(item => item.productId === productId);
  
  if (!product || !product.options) {
    return null;
  }

  const optionsCarousel = {
    "layout": "Carousel", 
    "metadata": {
      "carouselType": "options",
      "parentProduct": {
        "id": product.productId,
        "name": product.name,
        "parentIndex": parentIndex
      }
    },
    "cards": []
  };

  product.options.forEach((option, optionIndex) => {
    optionsCarousel.cards.push({
      "id": option._internalId,
      "title": `${option.name} | ${option.price}`,
      "description": {
        "slate": [{"children": [{"text": option.description}]}],
        "text": option.description
      },
      "imageUrl": option.imageUrl || product.imageUrl,
      "metadata": {
        "productType": "option",
        "hasOptions": false,
        "productId": product.productId,
        "internalId": option._internalId
      },
      "buttons": [
        {
          "name": "Select This Option",
          "request": {
            "type": "selection",
            "payload": {
              "action_type": "select_option",
              "productId": product.productId,
              "optionId": option._internalId,
              "option_name": option.name,
              "price": option.price,
              "product_name": product.name
            }
          }
        },
        {
          "name": "Add to Cart",
          "request": {
            "type": "selection", 
            "payload": {
              "action_type": "add_to_cart",
              "productId": product.productId,
              "optionId": option._internalId,
              "option_name": option.name,
              "price": option.price
            }
          }
        },
        {
          "name": "Back to Products",
          "request": {
            "type": "selection",
            "payload": {
              "action_type": "back_to_products"
            }
          }
        }
      ]
    });
  });

  return optionsCarousel;
}

// Get the selected product ID from the button click
const selectedProductId = last_event.payload.productId;
const parentIndex = last_event.payload.card_index;

// Generate options carousel
const optionsCarousel = generateSpecificProductOptions(recommended_items, selectedProductId, parentIndex);

if (optionsCarousel) {
  options_dcarousel = JSON.stringify(optionsCarousel);
} else {
  options_dcarousel = JSON.stringify({
    "layout": "Carousel",
    "metadata": {"carouselType": "error", "message": "No options available"},
    "cards": []
  });
}
```

**Custom Action for Options:**
- **Custom Action name:** `carousel`
- **Action Body:** Variable `options_dcarousel`
- **Stop on action:** ✅ Enabled

### 2. Select Product Handler (`select`)

**Purpose:** User selected a product without options

**Flow:**
```
Condition: select
    ↓
Set Variables:
    - selected_product = {last_event.payload.name}
    - selected_price = {last_event.payload.price} 
    - selected_product_id = {last_event.payload.productId}
    ↓
Text: "Great choice! You selected {selected_product} for {selected_price}"
    ↓
Continue conversation (ask delivery details, etc.)
```

### 3. Select Option Handler (`select_option`)

**Purpose:** User selected a specific option from the popup

**Flow:**
```
Condition: select_option
    ↓
Set Variables:
    - selected_product = {last_event.payload.product_name}
    - selected_option = {last_event.payload.option_name}
    - selected_price = {last_event.payload.price}
    - selected_product_id = {last_event.payload.productId}
    - selected_option_id = {last_event.payload.optionId}
    ↓
Text: "Perfect! You selected {selected_option} of {selected_product} for {selected_price}"
    ↓
Continue conversation
```

### 4. Add to Cart Handler (`add_to_cart`)

**Purpose:** Add product or option to cart

**Flow:**
```
Condition: add_to_cart
    ↓
Set Variables (extract from payload):
    - cart_item_name = {last_event.payload.name}
    - cart_item_price = {last_event.payload.price}
    - cart_item_id = {last_event.payload.productId}
    ↓
API Step: Call your cart API
    ↓
Text: "Added {cart_item_name} to your cart!"
    ↓
Choice: "Continue Shopping" | "View Cart" | "Checkout"
```

**API Step Example:**
```javascript
// POST to your cart endpoint
{
  "method": "POST",
  "url": "https://your-api.com/cart/add",
  "body": {
    "productId": "{cart_item_id}",
    "name": "{cart_item_name}",
    "price": "{cart_item_price}",
    "userId": "{user_id}"
  }
}
```

### 5. Back to Products Handler (`back_to_products`)

**Purpose:** Return to main product view (close popup)

**Flow:**
```
Condition: back_to_products
    ↓
Text: "Back to our product selection..."
    ↓
Custom Action: Re-display original carousel
    - Use original `recom_dcarousel` variable
```

### 6. External Link Handler (`external`)

**Purpose:** Handle external links (product details, etc.)

**Flow:**
```
Condition: external  
    ↓
Text: "For more details, please visit our website."
    ↓
Custom Action: Open URL (handled by frontend)
    ↓
Continue conversation
```

## 📊 Complete Voiceflow Flow Structure

```
1. Edge Function Call
   ↓
2. JavaScript Step (Generate Carousel)
   ↓  
3. Custom Action (Display Carousel)
   ↓
4. Condition (Route Button Clicks)
   ├── show_options → Generate Options → Custom Action (Options)
   ├── select → Set Variables → Text Response → Continue
   ├── select_option → Set Variables → Text Response → Continue  
   ├── add_to_cart → API Call → Text Confirmation → Choice
   ├── back_to_products → Text → Re-display Carousel
   └── external → Text → Continue
```

## 🔍 Debugging Button Clicks

### Debug Variables

Create these variables to debug button interactions:

```javascript
// Add to JavaScript step for debugging
debug_action_type = last_event.payload.action_type;
debug_product_id = last_event.payload.productId; 
debug_button_label = last_event.payload.label;
debug_full_payload = JSON.stringify(last_event.payload);
```

### Test Each Button Type

1. **Test Show Options:**
   - Click "See Options" on products with variants
   - Verify options popup appears
   - Check options have correct data

2. **Test Direct Selection:**
   - Click "Select This" on products without options
   - Verify conversation continues with product data

3. **Test Add to Cart:**
   - Click "Add to Cart" buttons
   - Verify API call works
   - Check cart confirmation

## 🎮 Frontend Integration Notes

Your frontend needs to handle these carousel types:

```javascript
// Frontend carousel handler
function handleCarouselTrace(trace) {
  const carouselType = trace.payload.metadata.carouselType;
  
  switch(carouselType) {
    case "products":
      displayProductGrid(trace.payload.cards); // 2x2 grid
      break;
    case "options": 
      displayOptionsPopup(trace.payload.cards); // Modal popup
      break;
    case "error":
      showErrorMessage(trace.payload.metadata.message);
      break;
  }
}

// Frontend button click handler
function onButtonClick(button) {
  // Send the button's request back to Voiceflow
  voiceflowAPI.interact(userId, button.request);
}
```

## ✅ Testing Checklist

- [ ] "See Options" shows popup with product variants
- [ ] "Select This" continues conversation with product
- [ ] "Select Option" continues with chosen variant  
- [ ] "Add to Cart" calls API and shows confirmation
- [ ] "Back to Products" closes popup and returns to main view
- [ ] "More Info" handles external links appropriately
- [ ] All button payloads contain required data
- [ ] Conversation flows naturally after each action

## 🚀 Ready for Production

Once all button handlers are working:
1. ✅ Users can browse products in 2x2 grid
2. ✅ Products with options trigger popup seamlessly  
3. ✅ Selections flow into order process
4. ✅ Cart functionality integrated
5. ✅ Conversation continues naturally

Your dynamic carousel with full button handling is now production-ready! 