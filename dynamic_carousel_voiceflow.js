function cardFormatter({
  id,
  index,
  title,
  name,
  desc,
  price,
  imgURL,
  buttons,
  hasOptions = false,
  productType = 'product',
  availableAddons = [],
  productId = null,
  internalId = null,
  semanticScore = null
}) {
  return {
    "id": id,
    "title": title || '',
    "description": {
      "slate": [
        {
          "children": [
            {
              "text": desc || ''
            }
          ]
        }
      ],
      "text": desc || ''
    },
    "imageUrl": imgURL,
    // Custom metadata for frontend handling
    "metadata": {
      "productType": productType,
      "hasOptions": hasOptions,
      "productId": productId,
      "internalId": internalId,
      "semanticScore": semanticScore,
      "availableAddons": availableAddons
    },
    "buttons": buttons.map((item, btnIndex) => {
      // Enhanced button parsing with multiple formats
      let label, buttonURL, actionType;
      
      if (item.includes("@")) {
        // Format: "Label@action_type:url" or "Label@action_type"
        const parts = item.split("@");
        label = parts[0].replace(/_/g, ' ');
        const actionPart = parts[1];
        
        if (actionPart.includes(":")) {
          const actionParts = actionPart.split(":");
          actionType = actionParts[0];
          buttonURL = actionParts[1];
        } else {
          actionType = actionPart;
          buttonURL = false;
        }
      } else if (item.includes(":")) {
        // Format: "Label:url" - default to external action
        const parts = item.split(":");
        label = parts[0].replace(/_/g, ' ');
        buttonURL = parts[1];
        actionType = "external";
      } else {
        // Simple label - default to select action
        label = item.replace(/_/g, ' ');
        buttonURL = false;
        actionType = hasOptions ? "show_options" : "select";
      }
     
      return {
        "name": label,
        "request": {
          "type": "selection",
          "payload": {
            "id": id,
            "name": name,
            "price": price,
            "desc": desc,
            "productId": productId,
            "internalId": internalId,
            "card_index": index,
            "button_index": btnIndex,
            "label": label,
            "action_type": actionType,
            "product_type": productType,
            "has_options": hasOptions,
            "semantic_score": semanticScore,
            "available_addons": availableAddons,
            "actions": buttonURL ? [
              {
                "type": "open_url",
                "payload": {
                  "url": buttonURL
                }
              }
            ] : []
          }
        }
      }
    })
  }
};

/**
 * Generate options carousel for products with multiple variants
 */
function generateOptionsCarousel(product, parentIndex) {
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
    optionsCarousel.cards.push(
      cardFormatter({
        id: option._internalId,
        index: optionIndex,
        name: option.name,
        price: option.price,
        title: `${option.name} | ${option.price}`,
        desc: option.description,
        imgURL: option.imageUrl || product.imageUrl,
        buttons: [
          "Select This Option@select_option",
          "Add to Cart@add_to_cart",
          "Back to Products@back_to_products"
        ],
        hasOptions: false,
        productType: 'option',
        availableAddons: product.availableAddons || [],
        productId: product.productId,
        internalId: option._internalId,
        semanticScore: product.semanticScore
      })
    );
  });

  return optionsCarousel;
}

/**
 * Main carousel generation function
 */
function generateProductCarousel(recommended_items, maxItems = 4) {
  const items_length = Math.min(recommended_items.length, maxItems);
  
  // Main products carousel
  const rawCarousel = {
    "layout": "Carousel",
    "metadata": {
      "carouselType": "products",
      "totalItems": items_length,
      "hasOptionsProducts": []
    },
    "cards": []
  };

  for (let i = 0; i < items_length; i++) {
    const item = recommended_items[i];
    const hasOptions = item.options && item.options.length > 0;
    
    // Track which products have options for frontend reference
    if (hasOptions) {
      rawCarousel.metadata.hasOptionsProducts.push({
        index: i,
        productId: item.productId,
        optionsCount: item.options.length
      });
    }

    // Generate appropriate buttons based on product type
    let buttons;
    if (hasOptions) {
      buttons = [
        "See Options@show_options",
        `Quick Add@add_to_cart:${item.productId}`,
        "More Info@external:" + (item.link || "#")
      ];
    } else {
      buttons = [
        "Select This@select",
        "Add to Cart@add_to_cart",
        "More Info@external:" + (item.link || "#")
      ];
    }

    rawCarousel.cards.push(
      cardFormatter({
        id: item._internalId,
        index: i,
        name: item.name,
        price: item.price,
        title: `${item.name} | ${item.price}`,
        desc: item.description,
        imgURL: item.imageUrl,
        buttons: buttons,
        hasOptions: hasOptions,
        productType: 'product',
        availableAddons: item.availableAddons || [],
        productId: item.productId,
        internalId: item._internalId,
        semanticScore: item.semanticScore
      })
    );
  }

  return rawCarousel;
}

/**
 * Generate options for a specific product (used when "See Options" is clicked)
 */
function generateSpecificProductOptions(recommended_items, productId, parentIndex) {
  const product = recommended_items.find(item => item.productId === productId);
  
  if (!product || !product.options) {
    return null;
  }

  return generateOptionsCarousel(product, parentIndex);
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/**
 * Main execution - generate initial product carousel
 * Replace the empty array with your actual recommended_items data
 */
// const recommended_items = []; // Your recommended_items array here
// const items_length = Math.min(recommended_items.length, 4); // Limit to 4 for 2x2 grid

// Generate main products carousel
// const productCarousel = generateProductCarousel(recommended_items, 4);
// const recom_dcarousel = JSON.stringify(productCarousel);

/**
 * For handling "See Options" button clicks in your frontend:
 * 
 * When user clicks "See Options" button, extract the productId from the payload
 * and generate the options carousel:
 */

// Example: Handle button click response
function handleButtonClick(buttonPayload) {
  if (buttonPayload.action_type === "show_options") {
    const optionsCarousel = generateSpecificProductOptions(
      recommended_items, 
      buttonPayload.productId, 
      buttonPayload.card_index
    );
    
    if (optionsCarousel) {
      // Display options in popup
      const options_dcarousel = JSON.stringify(optionsCarousel);
      // Send to your popup component
      return options_dcarousel;
    }
  }
  
  // Handle other action types...
  switch(buttonPayload.action_type) {
    case "select":
      return handleDirectSelection(buttonPayload);
    case "add_to_cart":
      return handleAddToCart(buttonPayload);
    case "back_to_products":
      return handleBackToProducts();
    default:
      return handleGenericAction(buttonPayload);
  }
}

// =============================================================================
// HELPER FUNCTIONS FOR FRONTEND INTEGRATION
// =============================================================================

/**
 * Extract products that have options for frontend reference
 */
function getProductsWithOptions(recommended_items) {
  return recommended_items
    .map((item, index) => ({
      index,
      productId: item.productId,
      name: item.name,
      optionsCount: item.options ? item.options.length : 0,
      hasOptions: !!(item.options && item.options.length > 0)
    }))
    .filter(item => item.hasOptions);
}

/**
 * Get product by ID for quick access
 */
function getProductById(recommended_items, productId) {
  return recommended_items.find(item => item.productId === productId);
}

/**
 * Format addons for display
 */
function formatAddons(availableAddons) {
  return availableAddons.map(addon => {
    const match = addon.match(/^(.+?)\s*\(\$([0-9.]+)\)$/);
    if (match) {
      return {
        name: match[1],
        price: match[2],
        displayText: addon
      };
    }
    return {
      name: addon,
      price: null,
      displayText: addon
    };
  });
} 